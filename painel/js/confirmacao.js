/* Confirmacao de presenca: textos, links e a regra do prazo.
   Usado pela tela de confirmacoes, pela agenda e pelos pedidos. */

import { CONFIG } from "../config.js";
import { DEMO } from "./db.js";
import { hora, primeiroNome, DIAS, dataCurta, iso, hoje, somarDias } from "./util.js";

export function antecedenciaDe(estudio) {
  const h = Number(estudio?.antecedencia_cancelamento);
  return Number.isFinite(h) && h >= 0 ? h : 3;
}

/* Ate quando o aluno pode desmarcar mantendo o direito de repor */
export function prazoDe(sessao, estudio) {
  return new Date(new Date(sessao.inicio).getTime() - antecedenciaDe(estudio) * 36e5);
}

export function dentroDoPrazo(sessao, estudio, agora = new Date()) {
  return agora <= prazoDe(sessao, estudio);
}

/* Link que o aluno abre para responder. Sem SITE_URL, na demonstracao
   usa a copia local do site; em producao, fica sem link. */
export function linkConfirmacao(sessao) {
  if (!sessao?.token) return null;
  let base = String(CONFIG.SITE_URL || "").trim().replace(/\/+$/, "");
  if (!base && DEMO) base = new URL("../site", location.href).href.replace(/\/+$/, "");
  if (!base) return null;
  return `${base}/confirmar.html?c=${encodeURIComponent(sessao.token)}`;
}

/* "hoje", "amanhã" ou "quinta, 02/10" */
export function quandoPorExtenso(data) {
  const d = new Date(data);
  const dia = iso(d);
  if (dia === iso(hoje())) return `hoje (${DIAS[d.getDay()].toLowerCase()}, ${dataCurta(d)})`;
  if (dia === iso(somarDias(hoje(), 1))) return `amanhã (${DIAS[d.getDay()].toLowerCase()}, ${dataCurta(d)})`;
  return `${DIAS[d.getDay()].toLowerCase()}, ${dataCurta(d)}`;
}

/* A mensagem que vai no WhatsApp pedindo a confirmacao */
export function textoConfirmacao(aluno, sessao, estudio) {
  const nome = primeiroNome(aluno?.nome) || "tudo bem";
  const link = linkConfirmacao(sessao);
  const prazo = prazoDe(sessao, estudio);
  const horas = antecedenciaDe(estudio);
  const aula = sessao.experimental ? "sua aula experimental" : "sua aula";
  const linhas = [
    `Oi, ${nome}! Aqui é da Eletrofit.`,
    `Passando para confirmar ${aula} de ${quandoPorExtenso(sessao.inicio)} às ${hora(sessao.inicio)}.`,
    "",
  ];
  if (link) {
    linhas.push("Toque no link e responda se vem ou não:", link, "");
  } else {
    linhas.push("Responda SIM se você vem ou NÃO se não puder vir.", "");
  }
  if (horas > 0) {
    linhas.push(`Se não puder vir, avise até ${hora(prazo)}${iso(prazo) !== iso(sessao.inicio) ? " do dia " + dataCurta(prazo) : ""} (${horas} hora${horas === 1 ? "" : "s"} antes) para garantir a reposição da aula.`);
  }
  return linhas.join("\n");
}

/* Mensagem de quando a proprietaria confirma um pedido de aula experimental */
export function textoAulaExperimentalConfirmada(nome, sessao, estudio) {
  const link = linkConfirmacao(sessao);
  const linhas = [
    `Oi, ${primeiroNome(nome)}! Aqui é da Eletrofit.`,
    `Sua aula experimental está confirmada para ${quandoPorExtenso(sessao.inicio)} às ${hora(sessao.inicio)}.`,
    "",
    estudio?.endereco ? `Endereço: ${estudio.endereco}.` : null,
    "Venha com roupa de treino, tênis e uma garrafinha de água. O colete é por nossa conta.",
  ];
  if (link) linhas.push("", "Se precisar desmarcar, responda por este link:", link);
  return linhas.filter((l) => l !== null).join("\n");
}

/* Traduz a sessao em algo para a tela mostrar.
   chave: confirmada | recusada | recusada_tarde | enviada | sem_resposta | encerrada */
export function situacaoConfirmacao(sessao, estudio) {
  if (sessao.confirmacao === "confirmada") {
    return { chave: "confirmada", rotulo: "Confirmou", tom: "ok", detalhe: sessao.confirmacao_por === "aluno" ? "Respondeu pelo link" : "Anotado pelo estúdio" };
  }
  if (sessao.confirmacao === "recusada") {
    return sessao.reposicao_direito
      ? { chave: "recusada", rotulo: "Não vem, repõe", tom: "aviso", detalhe: "Avisou a tempo, tem direito a reposição" }
      : { chave: "recusada_tarde", rotulo: "Não vem", tom: "erro", detalhe: "Avisou fora do prazo, sem reposição" };
  }
  if (sessao.status !== "agendada") {
    return { chave: "encerrada", rotulo: sessao.status === "realizada" ? "Feita" : sessao.status === "falta" ? "Faltou" : "Cancelada", tom: "cinza", detalhe: "" };
  }
  if (new Date(sessao.inicio) <= new Date()) {
    return { chave: "sem_resposta", rotulo: "Não respondeu", tom: "cinza", detalhe: "O horário já passou" };
  }
  if (sessao.aviso_enviado_em) {
    return { chave: "enviada", rotulo: "Aguardando", tom: "cinza", detalhe: `Mensagem enviada às ${hora(sessao.aviso_enviado_em)}` + (iso(sessao.aviso_enviado_em) !== iso(new Date()) ? ` de ${dataCurta(sessao.aviso_enviado_em)}` : "") };
  }
  return { chave: "sem_resposta", rotulo: "Não avisado", tom: "cinza", detalhe: "Mensagem ainda não enviada" };
}
