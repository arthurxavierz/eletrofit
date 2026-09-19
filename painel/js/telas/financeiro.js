/* Mensalidades: o que entrou, o que falta e o que atrasou */

import { cobrancasDoMes, cobrancasEmAberto, gerarCobrancasDoMes, salvarCobranca } from "../db.js";
import { el, limpar, dinheiro, dataBr, iso, primeiroDoMes, somarMeses, mesPorExtenso, hoje } from "../util.js";
import { aviso, etiqueta, vazio, confirmar, abrirFolha, campo, entradaSelecao, lerFormulario, botaoComIcone, botaoIcone } from "../ui.js";
import { abrirFicha, abrirWhats, textoCobranca } from "./ficha.js";

let mes = null;
let aba = "mes";

function cartaoNumero(valor, rotulo, tom = "") {
  return el("div", { class: "numero " + (tom ? "numero--" + tom : "") }, [
    el("strong", { texto: String(valor) }),
    el("span", { texto: rotulo }),
  ]);
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

  const [doMes, abertas] = await Promise.all([cobrancasDoMes(mes), cobrancasEmAberto()]);
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
        botaoIcone("esquerda", "Mês anterior", () => { mes = somarMeses(mes, -1); montar(raiz); }),
        botaoIcone("direita", "Próximo mês", () => { mes = somarMeses(mes, 1); montar(raiz); }),
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

  raiz.appendChild(
    el("div", { class: "numeros" }, [
      cartaoNumero(dinheiro(recebido), "recebido no mês", "ok"),
      cartaoNumero(dinheiro(aReceber), "a receber no mês"),
      cartaoNumero(dinheiro(totalAtrasado), "em atraso", totalAtrasado ? "alerta" : ""),
      cartaoNumero(atrasadas.length, "alunos em atraso", atrasadas.length ? "alerta" : ""),
    ])
  );

  /* recebido por forma de pagamento, no mes */
  const previsto = recebido + aReceber;
  raiz.appendChild(el("section", { class: "progresso", "aria-label": "Recebimentos do mês" }, [
    el("div", { class: "progresso__topo" }, [
      el("h2", { texto: "Recebimentos do mês" }),
      el("span", { texto: previsto ? Math.round(recebido / previsto * 100) + "% recebido" : "Sem mensalidades" }),
    ]),
    el("progress", { max: Math.max(previsto, 1), value: recebido, "aria-label": "Valor recebido em relação ao total do mês" }),
    el("p", { class: "obs", texto: `${dinheiro(recebido)} recebidos de ${dinheiro(previsto)} previstos` }),
  ]));

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
      el("button", { class: "abas__item " + (aba === "mes" ? "ativo" : ""), "aria-pressed": String(aba === "mes"), texto: "Do mês", onclick: () => { aba = "mes"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "atraso" ? "ativo" : ""), "aria-pressed": String(aba === "atraso"), texto: `Em atraso (${atrasadas.length})`, onclick: () => { aba = "atraso"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "aberto" ? "ativo" : ""), "aria-pressed": String(aba === "aberto"), texto: `Tudo em aberto (${abertas.length})`, onclick: () => { aba = "aberto"; montar(raiz); } }),
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
