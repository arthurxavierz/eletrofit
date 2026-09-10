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
const ICONES = {
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
