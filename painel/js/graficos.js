/* ===================================================
   Gráficos em SVG, escritos à mão, sem biblioteca.

   A paleta é uma rampa ordinal de um tom só, do ouro
   claro ao ouro escuro, conferida no validador de cores
   contra o fundo escuro do painel. Um tom por série,
   nunca cor solta para dizer o que o rótulo já diz.
   Todo gráfico tem rótulo direto, dica ao passar o
   mouse e uma tabela equivalente para quem precisa.
   =================================================== */

import { el } from "./util.js";

const NS = "http://www.w3.org/2000/svg";

export const OURO = {
  claro: "#ffd34d",
  medio: "#ffc42e",
  marca: "#e8b309",
  fundo: "#9c6b00",
  escuro: "#8a5c00",
};

const SUPERFICIE = "#141416";
const GRADE = "rgba(255,255,255,.07)";
const EIXO = "#7c7c85";

let contador = 0;
const novaChave = () => "gr" + ++contador;

function sv(tag, attrs = {}, filhos = []) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    e.setAttribute(k, v);
  }
  for (const f of [].concat(filhos)) if (f) e.appendChild(f);
  return e;
}

/* teto redondo, para o eixo não terminar num número quebrado */
function teto(valor) {
  if (valor <= 0) return 10;
  const ordem = Math.pow(10, Math.floor(Math.log10(valor)));
  const passos = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const p of passos) if (valor <= p * ordem) return p * ordem;
  return 10 * ordem;
}

function caminhoBarraVertical(x, y, largura, altura, raio) {
  const r = Math.max(0, Math.min(raio, largura / 2, altura));
  const b = y + altura;
  return `M${x} ${b} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + largura - r} ${y} Q${x + largura} ${y} ${x + largura} ${y + r} L${x + largura} ${b} Z`;
}

function caminhoBarraHorizontal(x, y, largura, altura, raio) {
  const r = Math.max(0, Math.min(raio, altura / 2, largura));
  const d = x + largura;
  return `M${x} ${y} L${d - r} ${y} Q${d} ${y} ${d} ${y + r} L${d} ${y + altura - r} Q${d} ${y + altura} ${d - r} ${y + altura} L${x} ${y + altura} Z`;
}

/* ---------- moldura comum a todos os gráficos ---------- */

function moldura({ titulo, sub, svg, tabela, legenda, acao }) {
  const dica = el("div", { class: "gr__dica", hidden: true });
  const area = el("div", { class: "gr__area" }, [svg, dica]);
  const alvoTabela = el("div", { class: "gr__tabela", hidden: true }, [tabela]);

  const verTabela = el("button", {
    class: "gr__link", texto: "Ver números",
    onclick: () => {
      const aberta = !alvoTabela.hidden;
      alvoTabela.hidden = aberta;
      verTabela.textContent = aberta ? "Ver números" : "Ocultar números";
    },
  });

  return el("figure", { class: "gr" }, [
    el("figcaption", { class: "gr__topo" }, [
      el("div", {}, [
        el("h3", { class: "gr__titulo", texto: titulo }),
        sub ? el("p", { class: "gr__sub", texto: sub }) : null,
      ]),
      el("div", { class: "gr__acoes" }, [acao || null, verTabela]),
    ]),
    area,
    legenda || null,
    alvoTabela,
  ]);
}

function tabelaSimples(colunas, linhas) {
  return el("table", { class: "tabela" }, [
    el("thead", {}, [el("tr", {}, colunas.map((c) => el("th", { texto: c })))]),
    el("tbody", {}, linhas.map((l) => el("tr", {}, l.map((c) => el("td", { texto: String(c) }))))),
  ]);
}

function legendaDe(itens) {
  return el("ul", { class: "gr__legenda" }, itens.map((i) =>
    el("li", {}, [
      el("span", { class: "gr__ponto", style: `background:${i.cor}` }),
      el("span", { class: "gr__legenda-nome", texto: i.rotulo }),
      i.valor ? el("strong", { texto: i.valor }) : null,
    ])
  ));
}

/* posiciona a dica dentro da área do gráfico */
function mostrarDica(dica, area, xRel, yRel, html) {
  dica.innerHTML = html;
  dica.hidden = false;
  const larguraArea = area.clientWidth || 1;
  const esq = Math.min(Math.max(xRel * larguraArea, 8), larguraArea - 8);
  dica.style.left = esq + "px";
  dica.style.top = Math.max(yRel * (area.clientHeight || 1) - 14, 4) + "px";
  dica.style.transform = `translate(${esq > larguraArea * 0.62 ? "-100%" : esq < larguraArea * 0.2 ? "0" : "-50%"}, -100%)`;
}

/* ===================================================
   Linha, para evolução no tempo
   =================================================== */

export function graficoLinha(dados, { titulo, sub, formatar = (v) => String(v), acao = null } = {}) {
  const L = 400, A = 186;
  const m = { e: 34, d: 10, c: 12, b: 22 };
  const larguraUtil = L - m.e - m.d;
  const alturaUtil = A - m.c - m.b;
  const valores = dados.map((d) => Number(d.valor) || 0);
  const alto = teto(Math.max(...valores, 1));
  const px = (i) => m.e + (dados.length === 1 ? larguraUtil / 2 : (i / (dados.length - 1)) * larguraUtil);
  const py = (v) => m.c + alturaUtil - (v / alto) * alturaUtil;

  const chave = novaChave();
  const svg = sv("svg", {
    viewBox: `0 0 ${L} ${A}`, class: "gr__svg", role: "img",
    "aria-label": `${titulo}. ${dados.map((d) => `${d.rotulo}, ${formatar(d.valor)}`).join(". ")}`,
  });

  svg.appendChild(sv("defs", {}, [
    sv("linearGradient", { id: chave, x1: "0", y1: "0", x2: "0", y2: "1" }, [
      sv("stop", { offset: "0%", "stop-color": OURO.marca, "stop-opacity": ".22" }),
      sv("stop", { offset: "100%", "stop-color": OURO.marca, "stop-opacity": "0" }),
    ]),
  ]));

  /* grade e eixo de valores */
  for (let i = 0; i <= 4; i++) {
    const v = (alto / 4) * i;
    const y = py(v);
    svg.appendChild(sv("line", { x1: m.e, y1: y, x2: L - m.d, y2: y, stroke: GRADE, "stroke-width": 1 }));
    svg.appendChild(sv("text", { x: m.e - 6, y: y + 3.5, "text-anchor": "end", fill: EIXO, "font-size": 10 },
      [document.createTextNode(formatar(v, true))]));
  }

  /* rótulos do eixo de tempo, pulando alguns quando há muitos pontos */
  const salto = dados.length > 7 ? Math.ceil(dados.length / 5) : 1;
  dados.forEach((d, i) => {
    if (i % salto !== 0 && i !== dados.length - 1) return;
    svg.appendChild(sv("text", { x: px(i), y: A - 7, "text-anchor": "middle", fill: EIXO, "font-size": 10 },
      [document.createTextNode(d.rotulo)]));
  });

  const pontos = dados.map((d, i) => `${px(i)},${py(Number(d.valor) || 0)}`);
  svg.appendChild(sv("path", {
    d: `M${m.e},${m.c + alturaUtil} L${pontos.join(" L")} L${px(dados.length - 1)},${m.c + alturaUtil} Z`,
    fill: `url(#${chave})`, stroke: "none",
  }));
  svg.appendChild(sv("polyline", {
    points: pontos.join(" "), fill: "none", stroke: OURO.marca,
    "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round",
  }));

  const cursor = sv("line", { y1: m.c, y2: m.c + alturaUtil, stroke: "rgba(255,255,255,.22)", "stroke-width": 1, opacity: 0 });
  svg.appendChild(cursor);

  const marcas = dados.map((d, i) =>
    sv("circle", { cx: px(i), cy: py(Number(d.valor) || 0), r: 4, fill: OURO.marca, stroke: SUPERFICIE, "stroke-width": 2, opacity: 0 })
  );
  marcas.forEach((c) => svg.appendChild(c));

  /* último ponto sempre rotulado, os outros só ao passar o mouse */
  if (dados.length) {
    const ultimo = dados.length - 1;
    marcas[ultimo].setAttribute("opacity", 1);
    svg.appendChild(sv("text", {
      x: px(ultimo) - 5, y: py(valores[ultimo]) - 10, "text-anchor": "end",
      fill: "#f4f4f5", "font-size": 11, "font-weight": 700,
    }, [document.createTextNode(formatar(valores[ultimo], true))]));
  }

  const fig = moldura({
    titulo, sub, svg, acao,
    tabela: tabelaSimples(["Período", "Valor"], dados.map((d) => [d.rotulo, formatar(d.valor)])),
  });
  const area = fig.querySelector(".gr__area");
  const dica = fig.querySelector(".gr__dica");

  const aoMover = (ev) => {
    const caixa = svg.getBoundingClientRect();
    const rel = (ev.clientX - caixa.left) / caixa.width;
    const i = Math.min(dados.length - 1, Math.max(0, Math.round(rel * (dados.length - 1))));
    marcas.forEach((c, j) => c.setAttribute("opacity", j === i || j === dados.length - 1 ? 1 : 0));
    cursor.setAttribute("x1", px(i));
    cursor.setAttribute("x2", px(i));
    cursor.setAttribute("opacity", 1);
    mostrarDica(dica, area, px(i) / L, py(valores[i]) / A,
      `<strong>${formatar(valores[i])}</strong><span>${dados[i].rotulo}</span>`);
  };
  const aoSair = () => {
    cursor.setAttribute("opacity", 0);
    marcas.forEach((c, j) => c.setAttribute("opacity", j === dados.length - 1 ? 1 : 0));
    dica.hidden = true;
  };
  svg.addEventListener("mousemove", aoMover);
  svg.addEventListener("mouseleave", aoSair);
  svg.addEventListener("touchstart", (ev) => aoMover(ev.touches[0]), { passive: true });
  svg.addEventListener("touchmove", (ev) => aoMover(ev.touches[0]), { passive: true });

  return fig;
}

/* ===================================================
   Barras em pé, uma ou duas partes empilhadas
   =================================================== */

export function graficoBarras(dados, { titulo, sub, formatar = (v) => String(v), partes = null, acao = null } = {}) {
  const L = 400, A = 186;
  const m = { e: 40, d: 10, c: 12, b: 22 };
  const larguraUtil = L - m.e - m.d;
  const alturaUtil = A - m.c - m.b;
  const empilhado = !!partes;
  const totais = dados.map((d) => empilhado ? partes.reduce((s, p) => s + (Number(d[p.chave]) || 0), 0) : Number(d.valor) || 0);
  const alto = teto(Math.max(...totais, 1));
  const passo = larguraUtil / Math.max(dados.length, 1);
  const largura = Math.min(passo * 0.58, 30);

  const svg = sv("svg", {
    viewBox: `0 0 ${L} ${A}`, class: "gr__svg", role: "img",
    "aria-label": `${titulo}. ${dados.map((d, i) => `${d.rotulo}, ${formatar(totais[i])}`).join(". ")}`,
  });

  for (let i = 0; i <= 4; i++) {
    const y = m.c + alturaUtil - (i / 4) * alturaUtil;
    svg.appendChild(sv("line", { x1: m.e, y1: y, x2: L - m.d, y2: y, stroke: GRADE, "stroke-width": 1 }));
    svg.appendChild(sv("text", { x: m.e - 6, y: y + 3.5, "text-anchor": "end", fill: EIXO, "font-size": 10 },
      [document.createTextNode(formatar((alto / 4) * i, true))]));
  }

  const fig = moldura({
    titulo, sub, svg, acao,
    legenda: empilhado ? legendaDe(partes.map((p) => ({ rotulo: p.rotulo, cor: p.cor }))) : null,
    tabela: tabelaSimples(
      empilhado ? ["Período", ...partes.map((p) => p.rotulo), "Total"] : ["Período", "Valor"],
      dados.map((d, i) => empilhado
        ? [d.rotulo, ...partes.map((p) => formatar(Number(d[p.chave]) || 0)), formatar(totais[i])]
        : [d.rotulo, formatar(totais[i])])
    ),
  });
  const area = fig.querySelector(".gr__area");
  const dica = fig.querySelector(".gr__dica");

  dados.forEach((d, i) => {
    const centro = m.e + passo * i + passo / 2;
    const x = centro - largura / 2;
    let base = m.c + alturaUtil;

    const desenhar = (valor, cor, topo) => {
      if (valor <= 0) return;
      const h = (valor / alto) * alturaUtil;
      const y = base - h;
      svg.appendChild(sv("path", {
        d: topo ? caminhoBarraVertical(x, y, largura, h, 3.5) : `M${x} ${y} h${largura} v${h} h${-largura} Z`,
        fill: cor, stroke: SUPERFICIE, "stroke-width": 1.6, "stroke-linejoin": "round",
      }));
      base = y;
    };

    if (empilhado) {
      const ordem = partes.slice().reverse();
      ordem.forEach((p, j) => desenhar(Number(d[p.chave]) || 0, p.cor, j === ordem.length - 1));
    } else {
      desenhar(totais[i], OURO.marca, true);
    }

    svg.appendChild(sv("text", { x: centro, y: A - 7, "text-anchor": "middle", fill: EIXO, "font-size": 10 },
      [document.createTextNode(d.rotulo)]));

    const alvo = sv("rect", { x: m.e + passo * i, y: m.c, width: passo, height: alturaUtil, fill: "transparent" });
    alvo.addEventListener("mouseenter", () => {
      const detalhe = empilhado
        ? partes.map((p) => `<span>${p.rotulo}: ${formatar(Number(d[p.chave]) || 0)}</span>`).join("")
        : `<span>${d.rotulo}</span>`;
      mostrarDica(dica, area, centro / L, (m.c + alturaUtil - (totais[i] / alto) * alturaUtil) / A,
        `<strong>${formatar(totais[i])}</strong>${empilhado ? `<span>${d.rotulo}</span>` : ""}${detalhe}`);
    });
    alvo.addEventListener("mouseleave", () => { dica.hidden = true; });
    svg.appendChild(alvo);
  });

  return fig;
}

/* ===================================================
   Barras deitadas, para comparar itens
   =================================================== */

export function graficoBarrasH(dados, { titulo, sub, formatar = (v) => String(v), acao = null } = {}) {
  const linhas = dados.slice(0, 8);
  const L = 400;
  const alturaLinha = 27;
  const A = Math.max(linhas.length * alturaLinha + 8, 50);
  const rotuloLargura = 84;
  const larguraUtil = L - rotuloLargura - 52;
  const alto = Math.max(...linhas.map((d) => Number(d.valor) || 0), 1);

  const svg = sv("svg", {
    viewBox: `0 0 ${L} ${A}`, class: "gr__svg gr__svg--fixo", role: "img",
    "aria-label": `${titulo}. ${linhas.map((d) => `${d.rotulo}, ${formatar(d.valor)}`).join(". ")}`,
  });

  const fig = moldura({
    titulo, sub, svg, acao,
    tabela: tabelaSimples(["Item", "Valor"], linhas.map((d) => [d.rotulo, formatar(d.valor)])),
  });
  const area = fig.querySelector(".gr__area");
  const dica = fig.querySelector(".gr__dica");

  linhas.forEach((d, i) => {
    const y = i * alturaLinha + 4;
    const valor = Number(d.valor) || 0;
    const largura = Math.max((valor / alto) * larguraUtil, valor > 0 ? 3 : 0);

    svg.appendChild(sv("text", { x: 0, y: y + 13, fill: "#c4c4c9", "font-size": 11 },
      [document.createTextNode(d.rotulo)]));
    svg.appendChild(sv("rect", { x: rotuloLargura, y: y + 2.5, width: larguraUtil, height: 14, rx: 4, fill: "rgba(255,255,255,.045)" }));
    if (largura > 0) {
      svg.appendChild(sv("path", {
        d: caminhoBarraHorizontal(rotuloLargura, y + 2.5, largura, 14, 4),
        fill: i === 0 ? OURO.marca : OURO.fundo,
      }));
    }
    svg.appendChild(sv("text", {
      x: L, y: y + 13.5, "text-anchor": "end", fill: "#f4f4f5", "font-size": 10.5, "font-weight": 700,
    }, [document.createTextNode(formatar(valor, true))]));

    const alvo = sv("rect", { x: 0, y, width: L, height: alturaLinha, fill: "transparent" });
    alvo.addEventListener("mouseenter", () => {
      mostrarDica(dica, area, (rotuloLargura + largura) / L, (y + 4) / A,
        `<strong>${formatar(valor)}</strong><span>${d.rotulo}</span>`);
    });
    alvo.addEventListener("mouseleave", () => { dica.hidden = true; });
    svg.appendChild(alvo);
  });

  return fig;
}

/* ===================================================
   Rosca, para repartir um total
   =================================================== */

export function graficoRosca(dados, { titulo, sub, formatar = (v) => String(v), centro = "", centroRotulo = "", acao = null } = {}) {
  const TAM = 220, raio = 88, grossura = 26;
  const total = dados.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const rampa = [OURO.claro, OURO.marca, OURO.fundo, OURO.escuro, "#6b4600"];
  const pintado = dados.map((d, i) => ({ ...d, cor: d.cor || rampa[Math.min(i, rampa.length - 1)] }));

  const svg = sv("svg", {
    viewBox: `0 0 ${TAM} ${TAM}`, class: "gr__svg gr__svg--rosca", role: "img",
    "aria-label": `${titulo}. ${pintado.map((d) => `${d.rotulo}, ${formatar(d.valor)}`).join(". ")}`,
  });

  const fig = moldura({
    titulo, sub, svg, acao,
    legenda: legendaDe(pintado.map((d) => ({
      rotulo: d.rotulo, cor: d.cor,
      valor: total ? `${formatar(d.valor, true)} (${Math.round((Number(d.valor) || 0) / total * 100)}%)` : formatar(d.valor, true),
    }))),
    tabela: tabelaSimples(["Item", "Valor", "Fatia"],
      pintado.map((d) => [d.rotulo, formatar(d.valor), total ? Math.round((Number(d.valor) || 0) / total * 100) + "%" : "0%"])),
  });
  const area = fig.querySelector(".gr__area");
  const dica = fig.querySelector(".gr__dica");

  const c = TAM / 2;
  svg.appendChild(sv("circle", { cx: c, cy: c, r: raio, fill: "none", stroke: "rgba(255,255,255,.05)", "stroke-width": grossura }));

  if (total > 0) {
    let angulo = -Math.PI / 2;
    pintado.forEach((d) => {
      const fatia = ((Number(d.valor) || 0) / total) * Math.PI * 2;
      if (fatia <= 0) return;
      const fim = angulo + fatia;
      const x1 = c + raio * Math.cos(angulo), y1 = c + raio * Math.sin(angulo);
      const x2 = c + raio * Math.cos(fim), y2 = c + raio * Math.sin(fim);
      const grande = fatia > Math.PI ? 1 : 0;
      const arco = sv("path", {
        d: fatia >= Math.PI * 2 - 0.001
          ? `M${c} ${c - raio} A${raio} ${raio} 0 1 1 ${c - 0.01} ${c - raio}`
          : `M${x1} ${y1} A${raio} ${raio} 0 ${grande} 1 ${x2} ${y2}`,
        fill: "none", stroke: d.cor, "stroke-width": grossura, "stroke-linecap": "butt",
      });
      /* folga de 2px entre fatias, na cor do fundo */
      const meio = angulo + fatia / 2;
      arco.addEventListener("mouseenter", () => {
        arco.setAttribute("stroke-width", grossura + 5);
        mostrarDica(dica, area, (c + raio * Math.cos(meio)) / TAM, (c + raio * Math.sin(meio)) / TAM,
          `<strong>${formatar(d.valor)}</strong><span>${d.rotulo}</span>`);
      });
      arco.addEventListener("mouseleave", () => {
        arco.setAttribute("stroke-width", grossura);
        dica.hidden = true;
      });
      svg.appendChild(arco);
      if (pintado.length > 1) {
        svg.appendChild(sv("line", {
          x1: c + (raio - grossura / 2 - 1) * Math.cos(fim), y1: c + (raio - grossura / 2 - 1) * Math.sin(fim),
          x2: c + (raio + grossura / 2 + 1) * Math.cos(fim), y2: c + (raio + grossura / 2 + 1) * Math.sin(fim),
          stroke: SUPERFICIE, "stroke-width": 2,
        }));
      }
      angulo = fim;
    });
  }

  if (centro !== "") {
    svg.appendChild(sv("text", { x: c, y: c + (centroRotulo ? 0 : 7), "text-anchor": "middle", fill: "#f4f4f5", "font-size": 30, "font-weight": 700 },
      [document.createTextNode(String(centro))]));
    if (centroRotulo) {
      svg.appendChild(sv("text", { x: c, y: c + 20, "text-anchor": "middle", fill: EIXO, "font-size": 11.5 },
        [document.createTextNode(centroRotulo)]));
    }
  }

  return fig;
}

/* ===================================================
   Linha miúda, para ir dentro dos cartões de número
   =================================================== */

export function miniLinha(valores, { cor = OURO.marca } = {}) {
  const L = 120, A = 32;
  const lista = valores.map((v) => Number(v) || 0);
  if (lista.length < 2) return el("span");
  const alto = Math.max(...lista, 1);
  const baixo = Math.min(...lista, 0);
  const faixa = Math.max(alto - baixo, 1);
  const pontos = lista.map((v, i) => `${(i / (lista.length - 1)) * L},${A - 3 - ((v - baixo) / faixa) * (A - 6)}`);

  const svg = sv("svg", { viewBox: `0 0 ${L} ${A}`, class: "mini", "aria-hidden": "true", preserveAspectRatio: "none" }, [
    sv("polyline", { points: pontos.join(" "), fill: "none", stroke: cor, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: ".85" }),
  ]);
  return svg;
}

/* ===================================================
   Barra de progresso simples, com rótulo direto
   =================================================== */

export function barraProgresso(parte, total, { rotulo = "", cor = OURO.marca } = {}) {
  const pc = total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0;
  return el("div", { class: "progresso" }, [
    rotulo ? el("div", { class: "progresso__topo" }, [
      el("span", { texto: rotulo }),
      el("strong", { texto: pc + "%" }),
    ]) : null,
    el("div", { class: "progresso__trilho" }, [
      el("span", { class: "progresso__barra", style: `width:${pc}%;background:${cor}` }),
    ]),
  ]);
}
