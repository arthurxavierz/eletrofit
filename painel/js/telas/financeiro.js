/* Mensalidades: o que entrou, o que vence agora, o que atrasou
   e o historico de tudo que ja foi recebido. */

import {
  cobrancasDoMes, cobrancasEmAberto, gerarCobrancasDoMes,
  estornarPagamento, pagamentosEntre,
} from "../db.js";
import {
  el, limpar, dinheiro, dataBr, iso, primeiroDoMes, somarMeses, somarDias,
  mesPorExtenso, hoje, situacaoCobranca, periodoPorExtenso, vencimentoSeguinte,
  DIAS_PROXIMA,
} from "../util.js";
import { aviso, etiqueta, vazio, confirmar, botaoComIcone, botaoIcone } from "../ui.js";
import { abrirFicha, abrirWhats, textoCobranca } from "./ficha.js";
import { abrirBaixa } from "./baixa.js";

let mes = null;
let aba = "mes";

function cartaoNumero(valor, rotulo, tom = "") {
  return el("div", { class: "numero " + (tom ? "numero--" + tom : "") }, [
    el("strong", { texto: String(valor) }),
    el("span", { texto: rotulo }),
  ]);
}

/* Uma mensalidade na lista. O texto de apoio muda conforme a situacao:
   pendente mostra o atraso e oferece a cobranca, proxima mostra quantos
   dias faltam, paga mostra como e quando entrou e quando vem a seguinte. */
function linhaCobranca(c, recarregar) {
  const aluno = c.aluno || {};
  const s = situacaoCobranca(c);

  const apoio = [el("span", { texto: s.detalhe })];
  if (s.chave === "paga") {
    apoio.push(el("span", { class: "cobranca__proxima", texto: "Próxima em " + dataBr(vencimentoSeguinte(c)) }));
  }

  const acoes = [];
  if (c.status === "aberta") {
    // o chamado para cobranca so aparece quando ja da para cobrar
    if (s.chave === "atrasada" || s.chave === "proxima") {
      acoes.push(botaoComIcone(
        "whatsapp",
        s.chave === "atrasada" ? "Cobrar" : "Lembrar",
        () => abrirWhats(aluno.telefone, textoCobranca(aluno, c)),
        "bt--linha bt--peq"
      ));
    }
    acoes.push(el("button", {
      class: "bt bt--primario bt--peq", texto: "Recebi",
      onclick: () => abrirBaixa(c, aluno, recarregar),
    }));
  } else if (c.status === "paga") {
    acoes.push(el("button", {
      class: "bt bt--linha bt--peq", texto: "Desfazer",
      onclick: async () => {
        const ok = await confirmar(
          "Marcar esta mensalidade como em aberto de novo? O pagamento continua no histórico, marcado como estornado.",
          { rotuloOk: "Desfazer baixa" }
        );
        if (!ok) return;
        await estornarPagamento(c.id);
        aviso("Baixa desfeita.");
        recarregar();
      },
    }));
  }

  return el("li", { class: "cobranca cobranca--" + s.chave }, [
    el("button", { class: "cobranca__aluno", onclick: () => abrirFicha(c.aluno_id, recarregar) }, [
      el("strong", { texto: aluno.nome || "Aluno" }),
      el("span", { class: "cobranca__periodo", texto: periodoPorExtenso(c.competencia, c.periodicidade) }),
      el("div", { class: "cobranca__apoio" }, apoio),
    ]),
    el("div", { class: "cobranca__valor" }, [
      el("strong", { texto: dinheiro(c.valor) }),
      etiqueta(s.rotulo, s.tom),
    ]),
    el("div", { class: "cobranca__acoes" }, acoes),
  ]);
}

/* Uma entrada do historico de pagamentos */
function linhaPagamento(p, recarregar) {
  const aluno = p.aluno || {};
  return el("li", { class: "cobranca " + (p.estornado ? "cobranca--estornada" : "cobranca--paga") }, [
    el("button", { class: "cobranca__aluno", onclick: () => abrirFicha(p.aluno_id, recarregar) }, [
      el("strong", { texto: aluno.nome || "Aluno" }),
      el("span", { class: "cobranca__periodo", texto: p.forma }),
      el("div", { class: "cobranca__apoio" }, [
        el("span", { texto: "Recebido em " + dataBr(p.pago_em) }),
        p.observacao ? el("span", { class: "obs", texto: p.observacao }) : null,
      ]),
    ]),
    el("div", { class: "cobranca__valor" }, [
      el("strong", { texto: dinheiro(p.valor) }),
      p.estornado ? etiqueta("Estornado", "cinza") : etiqueta("Recebido", "ok"),
    ]),
  ]);
}

export async function montar(raiz) {
  if (!mes) mes = primeiroDoMes(hoje());
  const recarregar = () => montar(raiz);

  const fimDoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
  const [doMes, abertas, pagamentos] = await Promise.all([
    cobrancasDoMes(mes),
    cobrancasEmAberto(),
    pagamentosEntre(mes, fimDoMes),
  ]);

  const hojeIso = iso(hoje());
  const limiteProxima = iso(somarDias(hoje(), DIAS_PROXIMA));
  const atrasadas = abertas.filter((c) => c.vencimento < hojeIso);
  const proximas = abertas.filter((c) => c.vencimento >= hojeIso && c.vencimento <= limiteProxima);

  const recebido = doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0);
  const aReceber = doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0);
  const totalAtrasado = atrasadas.reduce((s, c) => s + Number(c.valor), 0);
  const totalProximo = proximas.reduce((s, c) => s + Number(c.valor), 0);

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
            const ok = await confirmar(
              `Gerar as mensalidades de ${mesPorExtenso(mes)}? Entram os alunos com plano ativo cujo ciclo cai neste mês. Quem já tem mensalidade, ou está no meio de um trimestre ou ano já pago, não recebe cobrança.`,
              { rotuloOk: "Gerar" }
            );
            if (!ok) return;
            const { criadas, noMeioDoCiclo } = await gerarCobrancasDoMes(mes);
            const sobra = noMeioDoCiclo
              ? ` ${noMeioDoCiclo} alun${noMeioDoCiclo > 1 ? "os seguem" : "o segue"} no meio de um ciclo já pago.`
              : "";
            aviso(criadas
              ? `${criadas} mensalidade${criadas > 1 ? "s geradas" : " gerada"}.` + sobra
              : "Nenhuma mensalidade a gerar neste mês." + sobra);
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
      cartaoNumero(dinheiro(totalProximo), `vencem em ${DIAS_PROXIMA} dias`, totalProximo ? "aviso" : ""),
      cartaoNumero(dinheiro(totalAtrasado), "pendente", totalAtrasado ? "alerta" : ""),
    ])
  );

  const previsto = recebido + aReceber;
  raiz.appendChild(el("section", { class: "progresso", "aria-label": "Recebimentos do mês" }, [
    el("div", { class: "progresso__topo" }, [
      el("h2", { texto: "Recebimentos do mês" }),
      el("span", { texto: previsto ? Math.round(recebido / previsto * 100) + "% recebido" : "Sem mensalidades" }),
    ]),
    el("progress", { max: Math.max(previsto, 1), value: recebido, "aria-label": "Valor recebido em relação ao total do mês" }),
    el("p", { class: "obs", texto: `${dinheiro(recebido)} recebidos de ${dinheiro(previsto)} previstos` }),
  ]));

  /* recebido por forma de pagamento, no mes */
  const valendo = pagamentos.filter((p) => !p.estornado);
  if (valendo.length) {
    const porForma = {};
    valendo.forEach((p) => {
      const f = p.forma || "Não informado";
      porForma[f] = (porForma[f] || 0) + Number(p.valor);
    });
    /* este bloco conta o que entrou no caixa dentro do mes, que nao e
       a mesma coisa que o recebido por competencia logo acima: uma
       mensalidade de agosto paga em setembro aparece aqui */
    raiz.appendChild(el("p", { class: "formas__titulo obs", texto: `Entrou no caixa em ${mesPorExtenso(mes)}` }));
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

  const abas = el("div", { class: "abas" }, [
      { valor: "mes", texto: "Do mês" },
      { valor: "pendente", texto: `Pendentes (${atrasadas.length})` },
      { valor: "proxima", texto: `Próximas (${proximas.length})` },
      { valor: "aberto", texto: `Tudo em aberto (${abertas.length})` },
      { valor: "historico", texto: "Histórico" },
    ].map((o) =>
      el("button", {
        class: "abas__item " + (aba === o.valor ? "ativo" : ""),
        "aria-pressed": String(aba === o.valor),
        texto: o.texto,
        onclick: () => { aba = o.valor; montar(raiz); },
      })
    ));
  raiz.appendChild(abas);

  /* sao cinco abas: no celular elas rolam de lado, entao a escolhida
     e trazida para a vista sem mexer na rolagem da pagina */
  const ativo = abas.querySelector(".ativo");
  if (ativo) abas.scrollLeft = Math.max(0, ativo.offsetLeft - 12);

  if (aba === "historico") {
    if (!pagamentos.length) {
      raiz.appendChild(vazio(`Nenhum pagamento registrado em ${mesPorExtenso(mes)}.`));
      return;
    }
    const soma = valendo.reduce((s, p) => s + Number(p.valor), 0);
    raiz.appendChild(el("p", { class: "obs", texto: `${valendo.length} pagamento${valendo.length === 1 ? "" : "s"} em ${mesPorExtenso(mes)}, somando ${dinheiro(soma)}.` }));
    raiz.appendChild(el("ul", { class: "cobrancas" }, pagamentos.map((p) => linhaPagamento(p, recarregar))));
    return;
  }

  const lista = aba === "mes" ? doMes
    : aba === "pendente" ? atrasadas
    : aba === "proxima" ? proximas
    : abertas;

  if (!lista.length) {
    raiz.appendChild(vazio(
      aba === "mes" ? "Nenhuma mensalidade neste mês. Use o botão gerar mensalidades."
      : aba === "pendente" ? "Nenhuma mensalidade pendente. Bom sinal."
      : aba === "proxima" ? `Nada vencendo nos próximos ${DIAS_PROXIMA} dias.`
      : "Nada em aberto por aqui. Bom sinal."
    ));
    return;
  }

  raiz.appendChild(el("ul", { class: "cobrancas" }, lista.map((c) => linhaCobranca(c, recarregar))));
}
