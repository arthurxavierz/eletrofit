/* Pecas de tela reaproveitadas: aviso, painel deslizante,
   confirmacao e campos de formulario. */

import { el, limpar } from "./util.js";

/* ---------- aviso rapido no rodape ---------- */
let avisoTimer = null;
export function aviso(texto, tipo = "ok") {
  let caixa = document.getElementById("aviso");
  if (!caixa) {
    caixa = el("div", { id: "aviso", class: "aviso" });
    document.body.appendChild(caixa);
  }
  caixa.textContent = texto;
  caixa.className = "aviso aviso--" + tipo + " visivel";
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => caixa.classList.remove("visivel"), 3200);
}

/* ---------- painel que sobe por cima da tela ---------- */
export function abrirFolha(titulo, montarConteudo, { largura = "" } = {}) {
  fecharFolha();
  const corpo = el("div", { class: "folha__corpo" });
  const folha = el("div", { class: "folha" + (largura ? " folha--" + largura : "") }, [
    el("div", { class: "folha__topo" }, [
      el("h2", { texto: titulo }),
      el("button", { class: "folha__x", "aria-label": "Fechar", onclick: fecharFolha, texto: "×" }),
    ]),
    corpo,
  ]);
  const fundo = el("div", { class: "folha__fundo", id: "folhaFundo", onclick: (e) => { if (e.target.id === "folhaFundo") fecharFolha(); } }, [folha]);
  document.body.appendChild(fundo);
  document.body.classList.add("travado");
  montarConteudo(corpo, fecharFolha);
  requestAnimationFrame(() => fundo.classList.add("visivel"));
  return { fechar: fecharFolha, corpo };
}

export function fecharFolha() {
  const f = document.getElementById("folhaFundo");
  if (f) f.remove();
  document.body.classList.remove("travado");
}

/* ---------- confirmacao ---------- */
export function confirmar(texto, { rotuloOk = "Confirmar", perigo = false } = {}) {
  return new Promise((resolve) => {
    abrirFolha("Confirmar", (corpo, fechar) => {
      corpo.appendChild(el("p", { class: "texto", texto }));
      corpo.appendChild(
        el("div", { class: "linha-botoes" }, [
          el("button", { class: "bt bt--linha", texto: "Voltar", onclick: () => { fechar(); resolve(false); } }),
          el("button", {
            class: "bt " + (perigo ? "bt--perigo" : "bt--primario"),
            texto: rotuloOk,
            onclick: () => { fechar(); resolve(true); },
          }),
        ])
      );
    }, { largura: "estreita" });
  });
}

/* ---------- campos ---------- */
export function campo(rotulo, entrada, dica = "") {
  return el("label", { class: "campo" }, [
    el("span", { class: "campo__rotulo", texto: rotulo }),
    entrada,
    dica ? el("span", { class: "campo__dica", texto: dica }) : null,
  ]);
}

export function entradaTexto(nome, valor = "", attrs = {}) {
  return el("input", Object.assign({ class: "entrada", name: nome, value: valor ?? "", type: "text" }, attrs));
}

export function entradaSelecao(nome, opcoes, valor = "") {
  const s = el("select", { class: "entrada", name: nome });
  opcoes.forEach((o) => {
    const op = el("option", { value: o.valor, texto: o.texto });
    if (String(o.valor) === String(valor)) op.selected = true;
    s.appendChild(op);
  });
  return s;
}

export function entradaArea(nome, valor = "", linhas = 3) {
  return el("textarea", { class: "entrada", name: nome, rows: linhas }, [valor || ""]);
}

/* le todos os campos de um formulario em um objeto */
export function lerFormulario(raiz) {
  const dados = {};
  raiz.querySelectorAll("[name]").forEach((e) => {
    if (e.type === "checkbox") dados[e.name] = e.checked;
    else dados[e.name] = e.value;
  });
  return dados;
}


/* ---------- icones ---------- */
export const ICONES = {
  whatsapp: { vb: "0 0 32 32", tipo: "preenchido", d: "M16 3C9 3 3.3 8.7 3.3 15.7c0 2.4.7 4.6 1.8 6.5L3 29l7-1.8c1.8 1 3.9 1.6 6 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3Zm0 23.1c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4a10.3 10.3 0 0 1-1.6-5.5C5.4 9.9 10.1 5.3 16 5.3S26.6 9.9 26.6 15.7 21.9 26.1 16 26.1Zm5.8-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 0 1-2.6-1.6 9.5 9.5 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.4-.6s0-.4 0-.6-.7-1.7-1-2.3-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4A3.6 3.6 0 0 0 8.9 12a6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c.8.3 1.4.5 1.9.7a4.5 4.5 0 0 0 2 .1c.6-.1 1.9-.8 2.2-1.5s.3-1.4.2-1.5-.3-.2-.6-.3Z" },
  certo: { vb: "0 0 24 24", d: "M20 6.5 9.5 17 4 11.5" },
  errado: { vb: "0 0 24 24", d: "M6 6l12 12M18 6 6 18" },
  mais: { vb: "0 0 24 24", d: "M12 5v14M5 12h14" },
  reticencias: { vb: "0 0 24 24", d: "M6 12h.01M12 12h.01M18 12h.01" },
  pessoa: { vb: "0 0 24 24", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6" },
  lapis: { vb: "0 0 24 24", d: "M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z" },
  lixeira: { vb: "0 0 24 24", d: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" },
  esquerda: { vb: "0 0 24 24", d: "M15 5 8 12l7 7" },
  direita: { vb: "0 0 24 24", d: "m9 5 7 7-7 7" },
  painel: { vb: "0 0 24 24", d: "M4 19V9M9.3 19V5M14.7 19v-7M20 19v-11" },
  calendario: { vb: "0 0 24 24", d: "M7 3v3M17 3v3M3 9h18M5 5h14v16H5z" },
  pessoas: { vb: "0 0 24 24", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6" },
  dinheiro: { vb: "0 0 24 24", d: "M3 7h18v12H3zM3 11h18M7 15h4" },
  regua: { vb: "0 0 24 24", d: "M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" },
  raio: { vb: "0 0 24 24", d: "M13 2 4 14h6l-1 8 9-12h-6z" },
  balao: { vb: "0 0 24 24", d: "M4 5h16v11H8l-4 4z" },
  relatorio: { vb: "0 0 24 24", d: "M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4" },
  engrenagem: { vb: "0 0 24 24", d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 12h2M18 12h2M12 4v2M12 18v2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" },
  etiquetaIcone: { vb: "0 0 24 24", d: "M3 12V5h7l11 11-7 7L3 12ZM7.5 8.5h.01" },
  busca: { vb: "0 0 24 24", d: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" },
  barras: { vb: "0 0 24 24", d: "M4 4h16v16H4zM4 15h16M9 4v16" },
  alvo: { vb: "0 0 24 24", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" },
  relogio: { vb: "0 0 24 24", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2" },
  sino: { vb: "0 0 24 24", d: "M6 16V10a6 6 0 1 1 12 0v6l2 3H4l2-3ZM10 22h4" },
  subiu: { vb: "0 0 24 24", d: "M4 17 10 11l4 4 6-7M14 8h6v6" },
  saiu: { vb: "0 0 24 24", d: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9" },
  copiar: { vb: "0 0 24 24", d: "M9 9h11v11H9zM5 15H4V4h11v1" },
  bolinhas: { vb: "0 0 24 24", d: "M12 6h.01M12 12h.01M12 18h.01" },
};

export function icone(nome, tamanho = 18) {
  const def = ICONES[nome];
  if (!def) return el("span");
  const preenchido = def.tipo === "preenchido";
  const svg = `<svg viewBox="${def.vb}" width="${tamanho}" height="${tamanho}" aria-hidden="true" fill="${preenchido ? "currentColor" : "none"}"${preenchido ? "" : ' stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'}><path d="${def.d}"/></svg>`;
  return el("span", { class: "ico", html: svg });
}

/* botao so com icone, com nome lido por leitor de tela */
export function botaoIcone(nomeIcone, rotulo, aoClicar, estilo = "") {
  return el("button", {
    class: ("bt bt--icone " + estilo).trim(),
    "aria-label": rotulo,
    title: rotulo,
    onclick: aoClicar,
  }, [icone(nomeIcone)]);
}

/* botao com icone antes do texto */
export function botaoComIcone(nomeIcone, texto, aoClicar, estilo = "bt--linha") {
  return el("button", { class: "bt " + estilo, onclick: aoClicar }, [icone(nomeIcone, 16), el("span", { texto })]);
}

/* ---------- blocos visuais ---------- */
export function tituloTela(titulo, acao = null) {
  return el("div", { class: "tela__topo" }, [el("h1", { class: "tela__titulo", texto: titulo }), acao]);
}

export function vazio(texto, acao = null) {
  return el("div", { class: "vazio" }, [el("p", { texto }), acao]);
}

export function carregando(destino) {
  limpar(destino).appendChild(el("div", { class: "carregando", texto: "Carregando" }));
}

export function etiqueta(texto, tipo = "") {
  return el("span", { class: "etiqueta " + (tipo ? "etiqueta--" + tipo : ""), texto });
}

export function botao(texto, aoClicar, estilo = "bt--primario") {
  return el("button", { class: "bt " + estilo, texto, onclick: aoClicar });
}

/* cartão de número, com ícone, variação e linha miúda */
export function cartaoNumero({ rotulo, valor, icone: nomeIcone = "painel", nota = "", tom = "", variacao = null, sentido = 0, mini = null }) {
  const caixa = el("div", { class: "cartao " + (tom ? "cartao--" + tom : "") }, [
    el("div", { class: "cartao__topo" }, [
      el("span", { class: "cartao__ico" }, [icone(nomeIcone, 16)]),
      el("span", { class: "cartao__rotulo", texto: rotulo }),
    ]),
    el("strong", { class: "cartao__valor", texto: String(valor) }),
  ]);

  if (variacao || nota || mini) {
    const lado = el("div", {}, [
      variacao ? el("span", { class: "variacao variacao--" + (sentido > 0 ? "sobe" : sentido < 0 ? "desce" : "igual"), texto: variacao }) : null,
      nota ? el("span", { class: "cartao__nota", texto: nota }) : null,
    ]);
    const pe = el("div", { class: "cartao__pe" }, [lado, mini || null]);
    caixa.appendChild(pe);
  }
  return caixa;
}
