/* Lista de alunos, com busca e filtro */

import { listarAlunos, matriculaDoAluno } from "../db.js";
import { el, limpar, telefoneBonito, iniciais, dinheiro, rotuloPeriodicidade, precoDoPlano } from "../util.js";
import { etiqueta, vazio, botaoIcone } from "../ui.js";
import { abrirFicha, abrirFormularioAluno, abrirWhats } from "./ficha.js";

let filtro = { busca: "", status: "" };
let versaoBusca = 0;

export async function montar(raiz, manterFoco = false) {
  const versao = ++versaoBusca;
  const recarregar = () => montar(raiz);
  const alunos = await listarAlunos(filtro);

  const matriculas = {};
  await Promise.all(alunos.map(async (a) => { matriculas[a.id] = await matriculaDoAluno(a.id); }));
  if (versao !== versaoBusca || raiz.dataset.tela !== "alunos") return;
  const buscaAtiva = manterFoco && document.activeElement?.type === "search";
  const cursor = buscaAtiva ? document.activeElement.selectionStart : null;

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Alunos" }),
        el("p", { class: "tela__sub", texto: `${alunos.length} ${alunos.length === 1 ? "aluno" : "alunos"}` }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Novo aluno", onclick: () => abrirFormularioAluno(null, recarregar) }),
    ])
  );

  const busca = el("input", {
    class: "entrada", type: "search", "aria-label": "Buscar alunos por nome ou telefone", placeholder: "Buscar por nome ou telefone", value: filtro.busca,
  });
  let debounce = null;
  busca.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { filtro.busca = busca.value; montar(raiz, true); }, 300);
  });

  const abas = el("div", { class: "abas" },
    [
      { valor: "", texto: "Todos" },
      { valor: "ativo", texto: "Ativos" },
      { valor: "experimental", texto: "Experimentais" },
      { valor: "inativo", texto: "Inativos" },
    ].map((o) =>
      el("button", {
        class: "abas__item " + (filtro.status === o.valor ? "ativo" : ""),
        "aria-pressed": String(filtro.status === o.valor),
        texto: o.texto,
        onclick: () => { filtro.status = o.valor; montar(raiz); },
      })
    )
  );

  raiz.appendChild(el("div", { class: "filtros" }, [busca, abas]));
  if (buscaAtiva) { busca.focus({ preventScroll: true }); busca.setSelectionRange(cursor, cursor); }

  if (!alunos.length) {
    raiz.appendChild(vazio(
      filtro.busca ? "Nenhum aluno encontrado com esse termo." : "Nenhum aluno cadastrado ainda.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Cadastrar aluno", onclick: () => abrirFormularioAluno(null, recarregar) })
    ));
    return;
  }

  raiz.appendChild(
    el("ul", { class: "alunos" }, alunos.map((a) => {
      const m = matriculas[a.id];
      return el("li", { class: "aluno" }, [
        el("button", { class: "aluno__abrir", onclick: () => abrirFicha(a.id, recarregar) }, [
          el("span", { class: "avatar", texto: iniciais(a.nome) }),
          el("div", { class: "aluno__dados" }, [
            el("strong", { texto: a.nome }),
            el("span", { texto: [
              telefoneBonito(a.telefone),
              m ? `${m.plano ? m.plano.nome : "Plano"}, ${precoDoPlano(m.valor, m.periodicidade)}` : "Sem plano",
            ].filter(Boolean).join("  ·  ") }),
          ]),
        ]),
        el("div", { class: "aluno__lado" }, [
          m ? etiqueta(rotuloPeriodicidade(m.periodicidade), "cinza") : null,
          a.saude_liberado ? null : etiqueta("Saúde", "erro"),
          a.status === "ativo" ? null : etiqueta(a.status === "experimental" ? "Experimental" : "Inativo",
            a.status === "experimental" ? "aviso" : "cinza"),
          botaoIcone("whatsapp", "Falar no WhatsApp com " + a.nome, () => abrirWhats(a.telefone, `Oi ${a.nome.split(" ")[0]}, tudo bem?`), "bt--peq"),
        ]),
      ]);
    }))
  );
}
