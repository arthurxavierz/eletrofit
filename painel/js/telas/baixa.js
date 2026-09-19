/* Dar baixa em uma mensalidade.

   Usada pelo Financeiro e pela ficha do aluno, para que a baixa peca
   sempre as mesmas coisas: como o aluno pagou e em que dia. A data vem
   preenchida com hoje, mas quem recebeu ontem em dinheiro consegue
   registrar o dia certo. */

import { registrarPagamento } from "../db.js";
import { el, iso, hoje, dinheiro, dataBr, periodoPorExtenso, situacaoCobranca } from "../util.js";
import { abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea, lerFormulario, aviso } from "../ui.js";

export const FORMAS = ["Pix", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Transferência"];

export function abrirBaixa(cobranca, aluno, aoConcluir) {
  abrirFolha("Dar baixa", (corpo, fechar) => {
    const situacao = situacaoCobranca(cobranca);
    const form = el("form", { class: "form" });
    const hojeIso = iso(hoje());

    form.append(
      el("div", { class: "baixa__resumo" }, [
        el("strong", { texto: aluno?.nome || "Aluno" }),
        el("span", { texto: `${dinheiro(cobranca.valor)}  ·  ${periodoPorExtenso(cobranca.competencia, cobranca.periodicidade)}` }),
        el("span", { class: "obs", texto: situacao.detalhe }),
      ]),
      campo("Como o aluno pagou", entradaSelecao("forma", FORMAS.map((f) => ({ valor: f, texto: f })), FORMAS[0])),
      campo(
        "Data do pagamento",
        entradaTexto("pago_em", hojeIso, { type: "date", max: hojeIso, required: true }),
        "Deixe em " + dataBr(hojeIso) + " se recebeu hoje."
      ),
      campo("Observação", entradaArea("observacao", "", 2), "Opcional, fica no histórico.")
    );

    const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: "Confirmar recebimento" });
    form.appendChild(bt);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);

      if (!dados.pago_em) { aviso("Informe a data do pagamento.", "erro"); return; }
      if (dados.pago_em > hojeIso) { aviso("A data do pagamento não pode ser no futuro.", "erro"); return; }

      bt.disabled = true;
      try {
        await registrarPagamento({
          cobranca,
          pago_em: dados.pago_em,
          forma: dados.forma,
          observacao: dados.observacao.trim(),
        });
        aviso(`Baixa registrada: ${dinheiro(cobranca.valor)} por ${dados.forma} em ${dataBr(dados.pago_em)}.`);
        fechar();
        if (aoConcluir) await aoConcluir();
      } catch (e) {
        aviso(e.message, "erro");
        bt.disabled = false;
      }
    });

    corpo.appendChild(form);
  }, { largura: "estreita" });
}
