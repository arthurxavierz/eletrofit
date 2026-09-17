/* Comunicação: os textos que o estúdio manda sempre e as
   listas prontas de quem precisa receber cada um deles. */

import {
  listarModelos, salvarModelo, removerModelo, listarAlunos,
  cobrancasEmAberto, listarSolicitacoes, sessoesEntre, resumo,
} from "../db.js";
import { el, limpar, dinheiro, dataBr, iso, hoje, somarDias, primeiroNome } from "../util.js";
import {
  abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea, lerFormulario,
  aviso, confirmar, vazio, etiqueta, cartaoNumero, botaoComIcone,
} from "../ui.js";
import { estado } from "../estado.js";
import { abrirWhats } from "./ficha.js";

const CATEGORIAS = ["Agenda", "Financeiro", "Vendas", "Retenção", "Relacionamento"];
let aba = "listas";
let modeloEscolhido = {};

/* troca {nome}, {valor} e companhia pelo que vale de verdade */
export function preencher(texto, dados) {
  return String(texto || "").replace(/\{(\w+)\}/g, (achado, chave) => {
    const v = dados[chave];
    return v === undefined || v === null || v === "" ? achado : String(v);
  });
}

function formularioModelo(modelo, aoSalvar) {
  const novo = !modelo;
  abrirFolha(novo ? "Novo modelo" : "Editar modelo", (corpo, fechar) => {
    const form = el("form", { class: "form" });
    form.append(
      campo("Título", entradaTexto("titulo", modelo?.titulo || "", { required: true, placeholder: "Lembrete de treino" })),
      campo("Assunto", entradaSelecao("categoria", CATEGORIAS.map((c) => ({ valor: c, texto: c })), modelo?.categoria || CATEGORIAS[0])),
      campo("Mensagem", entradaArea("texto", modelo?.texto || "", 5),
        "Use {nome}, {valor}, {vencimento}, {data}, {hora} e {estudio} para o painel preencher sozinho"),
      el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: novo ? "Salvar modelo" : "Salvar" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = lerFormulario(form);
      try {
        await salvarModelo({ id: modelo?.id, titulo: d.titulo.trim(), categoria: d.categoria, texto: d.texto });
        aviso("Modelo salvo.");
        fechar();
        aoSalvar();
      } catch (e) { aviso(e.message, "erro"); }
    });
    corpo.appendChild(form);
  });
}

/* ---------- uma lista pronta ---------- */

function blocoLista({ chave, titulo, explicacao, pessoas, modelos, recarregar }) {
  const bloco = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: `${titulo} (${pessoas.length})` }),
    ]),
    el("p", { class: "obs", texto: explicacao }),
  ]);

  if (!pessoas.length) {
    bloco.appendChild(el("p", { class: "obs", style: "margin-top:.6rem", texto: "Ninguém nesta lista agora." }));
    return bloco;
  }

  const doAssunto = modelos.filter((m) => !m.categoria || m.categoria === chave.assunto);
  const usaveis = doAssunto.length ? doAssunto : modelos;
  if (!modeloEscolhido[chave.id] && usaveis.length) modeloEscolhido[chave.id] = usaveis[0].id;

  const seletor = entradaSelecao("modelo", usaveis.map((m) => ({ valor: m.id, texto: m.titulo })), modeloEscolhido[chave.id] || "");
  seletor.addEventListener("change", () => { modeloEscolhido[chave.id] = seletor.value; recarregar(); });
  if (usaveis.length) {
    bloco.appendChild(el("div", { style: "margin:.7rem 0" }, [campo("Mensagem usada", seletor)]));
  }

  const modelo = usaveis.find((m) => m.id === modeloEscolhido[chave.id]) || usaveis[0] || null;
  if (modelo) {
    bloco.appendChild(el("p", { class: "ficha-cartao__texto", style: "margin-bottom:.6rem", texto: modelo.texto }));
  }

  bloco.appendChild(
    el("ul", { class: "lista-simples" }, pessoas.map((p) => {
      const texto = modelo ? preencher(modelo.texto, p.variaveis) : `Oi ${primeiroNome(p.nome)}, tudo bem?`;
      return el("li", {}, [
        el("div", {}, [
          el("strong", { texto: p.nome }),
          el("span", { texto: p.detalhe }),
        ]),
        botaoComIcone("whatsapp", "Chamar", () => abrirWhats(p.telefone, texto), "bt--linha bt--peq"),
      ]);
    }))
  );
  return bloco;
}

/* ---------- tela ---------- */

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const base = hoje();
  const estudio = estado.perfil.estudio;

  const [modelos, alunos, abertas, pedidos, proximas, geral] = await Promise.all([
    listarModelos(),
    listarAlunos({}),
    cobrancasEmAberto(),
    listarSolicitacoes("nova"),
    sessoesEntre(somarDias(base, 1), somarDias(base, 2)),
    resumo(),
  ]);

  const hojeIso = iso(base);
  const atrasadas = abertas.filter((c) => c.vencimento < hojeIso);
  const ultimaSessao = {};
  const historico = await sessoesEntre(somarDias(base, -60), somarDias(base, 1));
  historico.filter((s) => s.status === "realizada").forEach((s) => {
    const t = new Date(s.inicio).getTime();
    if (!ultimaSessao[s.aluno_id] || t > ultimaSessao[s.aluno_id]) ultimaSessao[s.aluno_id] = t;
  });

  const listas = [
    {
      chave: { id: "amanha", assunto: "Agenda" },
      titulo: "Confirmar os treinos de amanhã",
      explicacao: "Quem tem sessão marcada para amanhã e ainda não confirmou.",
      pessoas: proximas.filter((s) => s.status === "agendada").map((s) => ({
        nome: (s.aluno || {}).nome || "Aluno",
        telefone: (s.aluno || {}).telefone,
        detalhe: `${dataBr(s.inicio)} às ${new Date(s.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        variaveis: {
          nome: primeiroNome((s.aluno || {}).nome),
          data: dataBr(s.inicio),
          hora: new Date(s.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          estudio: estudio.nome,
        },
      })),
    },
    {
      chave: { id: "atraso", assunto: "Financeiro" },
      titulo: "Mensalidades em atraso",
      explicacao: "Quem passou do vencimento e ainda não pagou.",
      pessoas: atrasadas.map((c) => ({
        nome: (c.aluno || {}).nome || "Aluno",
        telefone: (c.aluno || {}).telefone,
        detalhe: `${dinheiro(c.valor)}, venceu ${dataBr(c.vencimento)}`,
        variaveis: {
          nome: primeiroNome((c.aluno || {}).nome),
          valor: dinheiro(c.valor),
          vencimento: dataBr(c.vencimento),
          estudio: estudio.nome,
        },
      })),
    },
    {
      chave: { id: "sumidos", assunto: "Retenção" },
      titulo: "Alunos sumidos",
      explicacao: "Alunos ativos que não treinam há mais de duas semanas.",
      pessoas: alunos.filter((a) => a.status === "ativo").map((a) => {
        const dias = ultimaSessao[a.id] ? Math.floor((base - ultimaSessao[a.id]) / 864e5) : null;
        return { aluno: a, dias };
      }).filter((x) => x.dias === null || x.dias >= 14).map((x) => ({
        nome: x.aluno.nome, telefone: x.aluno.telefone,
        detalhe: x.dias === null ? "Nunca treinou" : `Último treino há ${x.dias} dias`,
        variaveis: { nome: primeiroNome(x.aluno.nome), estudio: estudio.nome },
      })),
    },
    {
      chave: { id: "pedidos", assunto: "Vendas" },
      titulo: "Pedidos de aula experimental",
      explicacao: "Quem preencheu o formulário do site e ainda espera resposta.",
      pessoas: pedidos.map((s) => ({
        nome: s.nome, telefone: s.telefone,
        detalhe: [s.objetivo, s.periodo].filter(Boolean).join("  ·  "),
        variaveis: { nome: primeiroNome(s.nome), estudio: estudio.nome },
      })),
    },
    {
      chave: { id: "aniversario", assunto: "Relacionamento" },
      titulo: "Aniversariantes do mês",
      explicacao: "Uma mensagem no dia certo custa nada e o aluno lembra.",
      pessoas: geral.aniversariantes.map((a) => ({
        nome: a.nome, telefone: a.telefone,
        detalhe: a.aniversario_hoje ? "É hoje" : "Dia " + a.aniversario_dia,
        variaveis: { nome: primeiroNome(a.nome), estudio: estudio.nome },
      })),
    },
    {
      chave: { id: "saude", assunto: "Agenda" },
      titulo: "Ficha de saúde pendente",
      explicacao: "Alunos que treinam sem a liberação registrada no sistema.",
      pessoas: alunos.filter((a) => a.status !== "inativo" && !a.saude_liberado).map((a) => ({
        nome: a.nome, telefone: a.telefone,
        detalhe: a.saude_restricoes || "Sem liberação registrada",
        variaveis: { nome: primeiroNome(a.nome), estudio: estudio.nome },
      })),
    },
  ];

  const totalNaFila = listas.reduce((s, l) => s + l.pessoas.length, 0);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Comunicação" }),
        el("p", { class: "tela__sub", texto: "Listas prontas de quem precisa receber mensagem e os textos que o estúdio usa" }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Novo modelo", onclick: () => formularioModelo(null, recarregar) }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Pessoas para chamar", valor: String(totalNaFila), icone: "whatsapp" }),
      cartaoNumero({ rotulo: "Cobranças em atraso", valor: String(atrasadas.length), icone: "dinheiro", tom: atrasadas.length ? "alerta" : "" }),
      cartaoNumero({ rotulo: "Pedidos sem resposta", valor: String(pedidos.length), icone: "balao", tom: pedidos.length ? "alerta" : "" }),
      cartaoNumero({ rotulo: "Modelos salvos", valor: String(modelos.length), icone: "relatorio" }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "abas" }, [
      el("button", { class: "abas__item " + (aba === "listas" ? "ativo" : ""), texto: "Listas prontas", onclick: () => { aba = "listas"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "modelos" ? "ativo" : ""), texto: `Modelos (${modelos.length})`, onclick: () => { aba = "modelos"; montar(raiz); } }),
    ])
  );

  if (aba === "listas") {
    if (!modelos.length) {
      raiz.appendChild(el("div", { class: "avisos" }, [
        el("div", { class: "avisos__item" }, [
          el("span", { texto: "Nenhum modelo de mensagem salvo. Sem modelo o painel manda só um oi." }),
          el("button", { class: "bt bt--linha bt--peq", texto: "Criar modelo", onclick: () => formularioModelo(null, recarregar) }),
        ]),
      ]));
    }
    listas.forEach((l) => raiz.appendChild(blocoLista({ ...l, modelos, recarregar })));
    return;
  }

  if (!modelos.length) {
    raiz.appendChild(vazio("Nenhum modelo salvo ainda.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Criar o primeiro", onclick: () => formularioModelo(null, recarregar) })));
    return;
  }

  raiz.appendChild(
    el("div", { class: "grade" }, modelos.map((m) =>
      el("article", { class: "ficha-cartao" }, [
        el("div", { class: "ficha-cartao__topo" }, [
          el("div", { style: "min-width:0" }, [el("strong", { texto: m.titulo })]),
          etiqueta(m.categoria || "Geral", ""),
        ]),
        el("p", { class: "ficha-cartao__texto", texto: m.texto }),
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          el("button", { class: "bt bt--linha bt--peq", texto: "Editar", onclick: () => formularioModelo(m, recarregar) }),
          el("button", {
            class: "bt bt--linha bt--peq", texto: "Copiar",
            onclick: async () => {
              try {
                await navigator.clipboard.writeText(m.texto);
                aviso("Mensagem copiada.");
              } catch (e) { aviso("Não foi possível copiar neste navegador.", "erro"); }
            },
          }),
          el("button", {
            class: "bt bt--perigo bt--peq", texto: "Apagar",
            onclick: async () => {
              if (!(await confirmar(`Apagar o modelo ${m.titulo}?`, { rotuloOk: "Apagar", perigo: true }))) return;
              await removerModelo(m.id);
              aviso("Modelo apagado.");
              recarregar();
            },
          }),
        ]),
      ])
    ))
  );
}
