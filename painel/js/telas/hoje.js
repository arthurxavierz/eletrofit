/* Tela inicial: o que acontece hoje e o que precisa de atencao */

import { resumo, atualizarSessao } from "../db.js";
import { el, limpar, hora, dinheiro, dataBr, primeiroNome, iniciais, DIAS } from "../util.js";
import { aviso, etiqueta, vazio, botaoIcone, botaoComIcone, icone } from "../ui.js";
import { abrirFicha, abrirWhats, textoCobranca } from "./ficha.js";
import { abrirNovaSessao, abrirAcoesSessao } from "./sessao.js";

function cartaoNumero(valor, rotulo, tom = "") {
  return el("div", { class: "numero " + (tom ? "numero--" + tom : "") }, [
    el("strong", { texto: String(valor) }),
    el("span", { texto: rotulo }),
  ]);
}

export async function montar(raiz) {
  const dados = await resumo();
  const recarregar = () => montar(raiz);
  const agora = new Date();

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Hoje" }),
        el("p", { class: "tela__sub", texto: `${DIAS[agora.getDay()]}, ${dataBr(agora)}` }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Marcar sessao", onclick: () => abrirNovaSessao({ data: agora }, recarregar) }),
    ])
  );

  /* numeros */
  raiz.appendChild(
    el("div", { class: "numeros" }, [
      cartaoNumero(dados.sessoesHoje.filter((s) => s.status !== "cancelada").length, "sessoes hoje"),
      cartaoNumero(dados.ativos, "alunos ativos"),
      cartaoNumero(dinheiro(dados.aReceber), "a receber no mes"),
      cartaoNumero(dados.atrasadas.length, "mensalidades atrasadas", dados.atrasadas.length ? "alerta" : ""),
    ])
  );

  /* avisos */
  const avisos = [];
  if (dados.solicitacoes.length) {
    avisos.push({
      texto: `${dados.solicitacoes.length} pedido${dados.solicitacoes.length > 1 ? "s" : ""} de aula experimental esperando resposta`,
      acao: "Ver pedidos", destino: "#solicitacoes",
    });
  }
  if (dados.atrasadas.length) {
    avisos.push({
      texto: `${dados.atrasadas.length} mensalidade${dados.atrasadas.length > 1 ? "s" : ""} em atraso, somando ${dinheiro(dados.atrasadas.reduce((s, c) => s + Number(c.valor), 0))}`,
      acao: "Ver financeiro", destino: "#financeiro",
    });
  }
  if (dados.venceSemana.length) {
    avisos.push({
      texto: `${dados.venceSemana.length} mensalidade${dados.venceSemana.length > 1 ? "s vencem" : " vence"} nos proximos sete dias`,
      acao: "Ver financeiro", destino: "#financeiro",
    });
  }
  if (avisos.length) {
    raiz.appendChild(
      el("div", { class: "avisos" }, avisos.map((a) =>
        el("div", { class: "avisos__item" }, [
          el("span", { texto: a.texto }),
          el("a", { class: "bt bt--linha bt--peq", href: a.destino, texto: a.acao }),
        ])
      ))
    );
  }

  /* agenda do dia */
  const bloco = el("section", { class: "bloco" }, [el("h2", { class: "bloco__titulo", texto: "Agenda do dia" })]);
  const doDia = dados.sessoesHoje.filter((s) => s.status !== "cancelada");

  if (!doDia.length) {
    bloco.appendChild(vazio("Nenhuma sessao marcada para hoje.",
      el("button", { class: "bt bt--linha bt--peq", texto: "Marcar a primeira", onclick: () => abrirNovaSessao({ data: agora }, recarregar) })));
  } else {
    bloco.appendChild(
      el("ul", { class: "sessoes" }, doDia.map((s) => {
        const aluno = s.aluno || {};
        const passou = new Date(s.inicio) < agora;
        const linha = el("li", { class: "sessao " + (s.status === "realizada" ? "sessao--feita" : s.status === "falta" ? "sessao--falta" : passou ? "sessao--passou" : "") }, [
          el("div", { class: "sessao__hora" }, [
            el("strong", { texto: hora(s.inicio) }),
            el("span", { texto: (s.duracao || 30) + " min" }),
          ]),
          el("button", { class: "sessao__aluno", onclick: () => abrirFicha(s.aluno_id, recarregar) }, [
            el("span", { class: "avatar avatar--peq", texto: iniciais(aluno.nome) }),
            el("div", {}, [
              el("strong", { texto: aluno.nome || "Aluno" }),
              el("span", { texto: aluno.saude_liberado === false ? "Ficha de saude pendente" : (s.intensidade || "Sem anotacao") }),
            ]),
          ]),
          el("div", { class: "sessao__acoes" },
            s.status === "agendada"
              ? [
                  botaoComIcone("certo", "Presenca", async () => { await atualizarSessao(s.id, { status: "realizada" }); aviso("Presenca registrada."); recarregar(); }, "bt--linha bt--peq"),
                  botaoComIcone("errado", "Falta", async () => { await atualizarSessao(s.id, { status: "falta" }); aviso("Falta registrada."); recarregar(); }, "bt--linha bt--peq"),
                  botaoIcone("reticencias", "Mais acoes", () => abrirAcoesSessao(s, recarregar), "bt--linha bt--peq"),
                ]
              : [
                  etiqueta(s.status === "realizada" ? "Feita" : "Falta", s.status === "realizada" ? "ok" : "erro"),
                  botaoIcone("reticencias", "Mais acoes", () => abrirAcoesSessao(s, recarregar), "bt--linha bt--peq"),
                ]
          ),
        ]);
        return linha;
      }))
    );
  }
  raiz.appendChild(bloco);

  /* cobranca do dia */
  if (dados.atrasadas.length) {
    const blocoCob = el("section", { class: "bloco" }, [
      el("h2", { class: "bloco__titulo", texto: "Para cobrar hoje" }),
      el("ul", { class: "lista-simples" }, dados.atrasadas.slice(0, 6).map((c) => {
        const aluno = c.aluno || {};
        const dias = Math.floor((new Date() - new Date(c.vencimento + "T12:00:00")) / 864e5);
        return el("li", {}, [
          el("div", {}, [
            el("strong", { texto: aluno.nome || "Aluno" }),
            el("span", { texto: `${dinheiro(c.valor)}  ·  venceu ha ${dias} dia${dias === 1 ? "" : "s"}` }),
          ]),
          botaoComIcone("whatsapp", "Cobrar", () => abrirWhats(aluno.telefone, textoCobranca(aluno, c)), "bt--linha bt--peq"),
        ]);
      })),
    ]);
    raiz.appendChild(blocoCob);
  }
}
