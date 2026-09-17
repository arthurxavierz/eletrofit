/* Mensalidades: o que entrou, o que falta e o que atrasou */

import { cobrancasDoMes, cobrancasEmAberto, gerarCobrancasDoMes, salvarCobranca, cobrancasDesde, listarMatriculas } from "../db.js";
import { el, limpar, dinheiro, dataBr, iso, primeiroDoMes, somarMeses, mesPorExtenso, hoje, MESES } from "../util.js";
import { aviso, etiqueta, vazio, confirmar, abrirFolha, campo, entradaSelecao, lerFormulario, botaoComIcone, cartaoNumero } from "../ui.js";
import { graficoBarras, OURO } from "../graficos.js";
import { abrirFicha, abrirWhats, textoCobranca } from "./ficha.js";

let mes = null;
let aba = "mes";

function reais(v, curto) {
  const n = Number(v) || 0;
  if (!curto) return dinheiro(n);
  if (n >= 1000) return "R$ " + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + " mil";
  return "R$ " + Math.round(n);
}

function linhaCobranca(c, recarregar) {
  const aluno = c.aluno || {};
  const hojeIso = iso(hoje());
  const atrasada = c.status === "aberta" && c.vencimento < hojeIso;
  const dias = atrasada ? Math.floor((new Date() - new Date(c.vencimento + "T12:00:00")) / 864e5) : 0;

  return el("li", { class: "cobranca " + (atrasada ? "cobranca--atrasada" : c.status === "paga" ? "cobranca--paga" : "") }, [
    el("button", { class: "cobranca__aluno", onclick: () => abrirFicha(c.aluno_id, recarregar) }, [
      el("strong", { texto: aluno.nome || "Aluno" }),
      el("span", { texto: atrasada ? `Venceu há ${dias} dia${dias === 1 ? "" : "s"}` : `Vence ${dataBr(c.vencimento)}` }),
    ]),
    el("div", { class: "cobranca__valor" }, [
      el("strong", { texto: dinheiro(c.valor) }),
      c.status === "paga" ? etiqueta("Paga", "ok") : atrasada ? etiqueta("Atrasada", "erro") : etiqueta("Em aberto", "aviso"),
    ]),
    el("div", { class: "cobranca__acoes" },
      c.status === "aberta"
        ? [
            botaoComIcone("whatsapp", "Cobrar", () => abrirWhats(aluno.telefone, textoCobranca(aluno, c)), "bt--linha bt--peq"),
            el("button", {
              class: "bt bt--primario bt--peq", texto: "Recebi",
              onclick: () => abrirFolha("Dar baixa", (corpo, fechar) => {
                const form = el("form", { class: "form" });
                form.append(
                  el("p", { class: "obs", texto: `${aluno.nome}, ${dinheiro(c.valor)}` }),
                  campo("Como recebeu", entradaSelecao("forma", [
                    { valor: "Pix", texto: "Pix" },
                    { valor: "Dinheiro", texto: "Dinheiro" },
                    { valor: "Cartão", texto: "Cartão" },
                    { valor: "Transferência", texto: "Transferência" },
                  ], "Pix")),
                  el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: "Confirmar recebimento" })
                );
                form.addEventListener("submit", async (ev) => {
                  ev.preventDefault();
                  const dados = lerFormulario(form);
                  await salvarCobranca({ id: c.id, status: "paga", pago_em: iso(new Date()), forma: dados.forma });
                  aviso("Mensalidade baixada.");
                  fechar();
                  recarregar();
                });
                corpo.appendChild(form);
              }, { largura: "estreita" }),
            }),
          ]
        : c.status === "paga"
          ? [el("button", {
              class: "bt bt--linha bt--peq", texto: "Desfazer",
              onclick: async () => {
                if (!(await confirmar("Marcar esta mensalidade como em aberto de novo?"))) return;
                await salvarCobranca({ id: c.id, status: "aberta", pago_em: null, forma: null });
                aviso("Baixa desfeita.");
                recarregar();
              },
            })]
          : []
    ),
  ]);
}

export async function montar(raiz) {
  if (!mes) mes = primeiroDoMes(hoje());
  const recarregar = () => montar(raiz);

  const seisMeses = primeiroDoMes(somarMeses(hoje(), -5));
  const [doMes, abertas, ultimos, matriculas] = await Promise.all([
    cobrancasDoMes(mes), cobrancasEmAberto(), cobrancasDesde(iso(seisMeses)), listarMatriculas(),
  ]);
  const hojeIso = iso(hoje());
  const atrasadas = abertas.filter((c) => c.vencimento < hojeIso);

  const recebido = doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0);
  const aReceber = doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0);
  const totalAtrasado = atrasadas.reduce((s, c) => s + Number(c.valor), 0);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Financeiro" }),
        el("p", { class: "tela__sub", texto: mesPorExtenso(mes) }),
      ]),
      el("div", { class: "linha-botoes" }, [
        el("button", { class: "bt bt--linha bt--peq", texto: "Anterior", onclick: () => { mes = somarMeses(mes, -1); montar(raiz); } }),
        el("button", { class: "bt bt--linha bt--peq", texto: "Próximo", onclick: () => { mes = somarMeses(mes, 1); montar(raiz); } }),
        el("button", {
          class: "bt bt--primario bt--peq", texto: "Gerar mensalidades",
          onclick: async () => {
            const ok = await confirmar(`Gerar as mensalidades de ${mesPorExtenso(mes)} para todos os alunos com plano ativo? Quem já tem mensalidade não recebe outra.`, { rotuloOk: "Gerar" });
            if (!ok) return;
            const quantas = await gerarCobrancasDoMes(mes);
            aviso(quantas ? `${quantas} mensalidade${quantas > 1 ? "s geradas" : " gerada"}.` : "Todas as mensalidades deste mês já existiam.");
            montar(raiz);
          },
        }),
      ]),
    ])
  );

  const previsto = matriculas.filter((m) => m.status === "ativa").reduce((s, m) => s + Number(m.valor), 0);

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Recebido no mês", valor: dinheiro(recebido), icone: "dinheiro", tom: "ok",
        nota: previsto ? `${Math.round((recebido / previsto) * 100)}% do previsto` : "" }),
      cartaoNumero({ rotulo: "A receber no mês", valor: dinheiro(aReceber), icone: "relogio" }),
      cartaoNumero({ rotulo: "Em atraso", valor: dinheiro(totalAtrasado), icone: "sino", tom: totalAtrasado ? "alerta" : "",
        nota: atrasadas.length ? `${atrasadas.length} ${atrasadas.length === 1 ? "aluno" : "alunos"}` : "ninguém devendo" }),
      cartaoNumero({ rotulo: "Previsto com os planos", valor: dinheiro(previsto), icone: "alvo",
        nota: "se todo mundo pagar em dia" }),
    ])
  );

  /* seis meses de mensalidades, para enxergar a curva */
  const serie = [];
  for (let k = 5; k >= 0; k--) {
    const m = primeiroDoMes(somarMeses(hoje(), -k));
    const comp = iso(m);
    const lista = ultimos.filter((c) => c.competencia === comp);
    serie.push({
      rotulo: MESES[m.getMonth()].slice(0, 3),
      recebido: lista.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0),
      aberto: lista.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0),
    });
  }
  raiz.appendChild(graficoBarras(serie, {
    titulo: "Últimos seis meses",
    sub: "O que já entrou e o que ainda está em aberto",
    formatar: reais,
    partes: [
      { chave: "recebido", rotulo: "Recebido", cor: OURO.medio },
      { chave: "aberto", rotulo: "Em aberto", cor: OURO.escuro },
    ],
  }));

  /* recebido por forma de pagamento, no mes */
  const pagas = doMes.filter((c) => c.status === "paga");
  if (pagas.length) {
    const porForma = {};
    pagas.forEach((c) => {
      const f = c.forma || "Não informado";
      porForma[f] = (porForma[f] || 0) + Number(c.valor);
    });
    raiz.appendChild(
      el("div", { class: "formas" }, Object.entries(porForma)
        .sort((a, b) => b[1] - a[1])
        .map(([forma, valor]) =>
          el("span", { class: "forma" }, [
            document.createTextNode(forma + " "),
            el("strong", { texto: dinheiro(valor) }),
          ])
        ))
    );
  }

  raiz.appendChild(
    el("div", { class: "abas" }, [
      el("button", { class: "abas__item " + (aba === "mes" ? "ativo" : ""), texto: "Do mês", onclick: () => { aba = "mes"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "atraso" ? "ativo" : ""), texto: `Em atraso (${atrasadas.length})`, onclick: () => { aba = "atraso"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "aberto" ? "ativo" : ""), texto: `Tudo em aberto (${abertas.length})`, onclick: () => { aba = "aberto"; montar(raiz); } }),
    ])
  );

  const lista = aba === "mes" ? doMes : aba === "atraso" ? atrasadas : abertas;

  if (!lista.length) {
    raiz.appendChild(vazio(
      aba === "mes"
        ? "Nenhuma mensalidade neste mês. Use o botão gerar mensalidades."
        : "Nada em aberto por aqui. Bom sinal."
    ));
    return;
  }

  raiz.appendChild(el("ul", { class: "cobrancas" }, lista.map((c) => linhaCobranca(c, recarregar))));
}
