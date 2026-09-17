/* Lista de alunos, com busca, filtro e ordenação */

import { listarAlunos, matriculaDoAluno, sessoesEntre } from "../db.js";
import { el, limpar, telefoneBonito, iniciais, dinheiro, somarDias, hoje } from "../util.js";
import { etiqueta, vazio, botaoIcone, cartaoNumero } from "../ui.js";
import { abrirFicha, abrirFormularioAluno, abrirWhats } from "./ficha.js";

let filtro = { busca: "", status: "", ordem: "nome" };

/* usado pela busca do topo do painel */
export function definirBusca(termo) {
  filtro.busca = termo;
  filtro.status = "";
}

const ORDENS = [
  { valor: "nome", texto: "Nome" },
  { valor: "recente", texto: "Mais novos no estúdio" },
  { valor: "sumido", texto: "Sem treinar há mais tempo" },
  { valor: "valor", texto: "Maior mensalidade" },
];

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const base = hoje();
  const [alunos, historico] = await Promise.all([
    listarAlunos(filtro),
    sessoesEntre(somarDias(base, -120), somarDias(base, 1)),
  ]);

  const matriculas = {};
  await Promise.all(alunos.map(async (a) => { matriculas[a.id] = await matriculaDoAluno(a.id); }));

  const ultimoTreino = {};
  historico.filter((s) => s.status === "realizada").forEach((s) => {
    const t = new Date(s.inicio).getTime();
    if (!ultimoTreino[s.aluno_id] || t > ultimoTreino[s.aluno_id]) ultimoTreino[s.aluno_id] = t;
  });

  const ordenados = alunos.slice().sort((a, b) => {
    if (filtro.ordem === "recente") return String(b.criado_em || "").localeCompare(String(a.criado_em || ""));
    if (filtro.ordem === "valor") return Number(matriculas[b.id]?.valor || 0) - Number(matriculas[a.id]?.valor || 0);
    if (filtro.ordem === "sumido") return (ultimoTreino[a.id] || 0) - (ultimoTreino[b.id] || 0);
    return a.nome.localeCompare(b.nome);
  });

  const todos = await listarAlunos({});
  const semSaude = todos.filter((a) => a.status !== "inativo" && !a.saude_liberado).length;

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Alunos" }),
        el("p", { class: "tela__sub", texto: `${ordenados.length} ${ordenados.length === 1 ? "aluno na lista" : "alunos na lista"}` }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Novo aluno", onclick: () => abrirFormularioAluno(null, recarregar) }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Ativos", valor: String(todos.filter((a) => a.status === "ativo").length), icone: "pessoas" }),
      cartaoNumero({ rotulo: "Experimentais", valor: String(todos.filter((a) => a.status === "experimental").length), icone: "alvo" }),
      cartaoNumero({ rotulo: "Inativos", valor: String(todos.filter((a) => a.status === "inativo").length), icone: "saiu" }),
      cartaoNumero({ rotulo: "Sem ficha de saúde", valor: String(semSaude), icone: "sino", tom: semSaude ? "alerta" : "" }),
    ])
  );

  const busca = el("input", {
    class: "entrada", type: "search", placeholder: "Buscar por nome ou telefone", value: filtro.busca,
  });
  let espera = null;
  busca.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(() => { filtro.busca = busca.value.trim(); montar(raiz); }, 300);
  });

  const ordem = el("select", { class: "entrada" });
  ORDENS.forEach((o) => {
    const op = el("option", { value: o.valor, texto: "Ordenar por: " + o.texto });
    if (o.valor === filtro.ordem) op.selected = true;
    ordem.appendChild(op);
  });
  ordem.addEventListener("change", () => { filtro.ordem = ordem.value; montar(raiz); });

  const abas = el("div", { class: "abas" },
    [
      { valor: "", texto: "Todos" },
      { valor: "ativo", texto: "Ativos" },
      { valor: "experimental", texto: "Experimentais" },
      { valor: "inativo", texto: "Inativos" },
    ].map((o) =>
      el("button", {
        class: "abas__item " + (filtro.status === o.valor ? "ativo" : ""),
        texto: o.texto,
        onclick: () => { filtro.status = o.valor; montar(raiz); },
      })
    )
  );

  raiz.appendChild(el("div", { class: "filtros" }, [
    el("div", { class: "form__par" }, [busca, ordem]),
    abas,
  ]));

  if (!ordenados.length) {
    raiz.appendChild(vazio(
      filtro.busca ? "Nenhum aluno encontrado com esse termo." : "Nenhum aluno cadastrado ainda.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Cadastrar aluno", onclick: () => abrirFormularioAluno(null, recarregar) })
    ));
    return;
  }

  raiz.appendChild(
    el("ul", { class: "alunos" }, ordenados.map((a) => {
      const m = matriculas[a.id];
      const quando = ultimoTreino[a.id];
      const dias = quando ? Math.floor((base - quando) / 864e5) : null;
      const linhaDois = [
        telefoneBonito(a.telefone),
        m ? `${m.plano ? m.plano.nome : "Plano"}, ${dinheiro(m.valor)}` : "Sem plano",
        dias === null ? null : dias === 0 ? "treinou hoje" : `treinou há ${dias} ${dias === 1 ? "dia" : "dias"}`,
      ].filter(Boolean).join("  ·  ");

      return el("li", { class: "aluno" }, [
        el("button", { class: "aluno__abrir", onclick: () => abrirFicha(a.id, recarregar) }, [
          el("span", { class: "avatar", texto: iniciais(a.nome) }),
          el("div", { class: "aluno__dados" }, [
            el("strong", { texto: a.nome }),
            el("span", { texto: linhaDois }),
          ]),
        ]),
        el("div", { class: "aluno__lado" }, [
          a.saude_liberado ? null : etiqueta("Saúde", "erro"),
          a.status === "ativo" ? null : etiqueta(a.status === "experimental" ? "Experimental" : "Inativo",
            a.status === "experimental" ? "aviso" : ""),
          botaoIcone("whatsapp", "Falar no WhatsApp com " + a.nome, () => abrirWhats(a.telefone, `Oi ${a.nome.split(" ")[0]}, tudo bem?`), "bt--peq"),
        ]),
      ]);
    }))
  );
}
