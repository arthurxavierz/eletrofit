/* Painel: a visão geral do estúdio em uma tela só.
   Números do mês, evolução, repartição por plano e
   a lista do que precisa de atenção hoje. */

import { numerosDoPainel } from "../db.js";
import { el, limpar, dinheiro, dataBr, hora, iniciais, primeiroNome, DIAS } from "../util.js";
import { cartaoNumero, etiqueta, vazio, botaoComIcone } from "../ui.js";
import { graficoLinha, graficoBarras, graficoBarrasH, graficoRosca, miniLinha, barraProgresso, OURO } from "../graficos.js";
import { estado } from "../estado.js";
import { abrirFicha, abrirFormularioAluno, abrirWhats, textoCobranca } from "./ficha.js";
import { abrirNovaSessao, abrirAcoesSessao } from "./sessao.js";

/* valores curtos para os eixos, valores por extenso na dica */
function reais(v, curto) {
  const n = Number(v) || 0;
  if (!curto) return dinheiro(n);
  if (n >= 1000) return "R$ " + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + " mil";
  return "R$ " + Math.round(n);
}
const inteiro = (v) => String(Math.round(Number(v) || 0));

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export async function montar(raiz) {
  const dados = await numerosDoPainel({ meses: 12, diasDeHistorico: 90 });
  const recarregar = () => montar(raiz);
  const agora = new Date();
  const estudio = estado.perfil.estudio;
  const k = dados.kpis;

  limpar(raiz);

  /* ---------- faixa de boas-vindas ---------- */
  const pendencias = dados.atrasadas.length + dados.solicitacoes.length;
  const porFazer = dados.sessoesHoje.filter((s) => s.status === "agendada").length;

  raiz.appendChild(
    el("section", { class: "faixa" }, [
      el("img", { class: "faixa__raio", src: "img/eletrofit-raio.png", alt: "", "aria-hidden": "true" }),
      el("h1", { class: "faixa__ola" }, [
        document.createTextNode(saudacao() + ", "),
        el("em", { texto: primeiroNome(estado.perfil.nome) || "tudo certo" }),
      ]),
      el("p", { class: "faixa__texto", texto: [
        `${DIAS[agora.getDay()]}, ${dataBr(agora)}.`,
        dados.sessoesHoje.length
          ? `${dados.sessoesHoje.length} ${dados.sessoesHoje.length === 1 ? "sessão marcada" : "sessões marcadas"} para hoje${porFazer ? `, ${porFazer} ainda sem registro` : ", tudo registrado"}.`
          : "Nenhuma sessão marcada para hoje.",
        pendencias ? `${pendencias} ${pendencias === 1 ? "assunto esperando" : "assuntos esperando"} você lá embaixo.` : "Nada atrasado por aqui.",
      ].join(" ") }),
      el("div", { class: "faixa__acoes" }, [
        el("button", { class: "bt bt--primario bt--peq", texto: "Marcar sessão", onclick: () => abrirNovaSessao({ data: agora }, recarregar) }),
        el("button", { class: "bt bt--linha bt--peq", texto: "Novo aluno", onclick: () => abrirFormularioAluno(null, recarregar) }),
        el("a", { class: "bt bt--linha bt--peq", href: "#financeiro", texto: "Financeiro" }),
      ]),
    ])
  );

  /* ---------- cartões de número ---------- */
  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({
        rotulo: "Alunos com plano ativo", valor: inteiro(dados.serieAlunos.at(-1)?.valor || 0), icone: "pessoas",
        variacao: k.variacaoAlunos ? (k.variacaoAlunos > 0 ? "+" : "") + k.variacaoAlunos + " no mês" : null,
        sentido: k.variacaoAlunos,
        nota: k.experimentais ? `${k.experimentais} em fase experimental` : "",
        mini: miniLinha(dados.serieAlunos.map((x) => x.valor)),
      }),
      cartaoNumero({
        rotulo: "Recebido no mês", valor: dinheiro(k.recebido), icone: "dinheiro", tom: "ok",
        variacao: k.variacaoFaturamento ? (k.variacaoFaturamento > 0 ? "+" : "") + k.variacaoFaturamento + "%" : null,
        sentido: k.variacaoFaturamento,
        nota: "contra o mês passado",
        mini: miniLinha(dados.serieFaturamento.map((x) => x.recebido)),
      }),
      cartaoNumero({
        rotulo: "A receber no mês", valor: dinheiro(k.aReceber), icone: "relogio",
        nota: `previsto de ${dinheiro(k.previsto)} com os planos ativos`,
      }),
      cartaoNumero({
        rotulo: "Em atraso", valor: dinheiro(k.atrasado), icone: "sino",
        tom: dados.atrasadas.length ? "alerta" : "",
        nota: dados.atrasadas.length ? `${dados.atrasadas.length} ${dados.atrasadas.length === 1 ? "aluno" : "alunos"}` : "ninguém devendo",
      }),
    ])
  );

  /* ---------- evolução e repartição ---------- */
  const grade1 = el("div", { class: "graficos graficos--larga" });
  grade1.appendChild(graficoLinha(dados.serieAlunos, {
    titulo: "Alunos com plano ativo",
    sub: "Últimos doze meses, contando quem tinha plano em cada mês",
    formatar: (v) => inteiro(v),
  }));
  grade1.appendChild(
    dados.porPlano.length
      ? graficoRosca(dados.porPlano, {
          titulo: "Repartição por plano",
          sub: "Quem está com plano ativo agora",
          formatar: (v) => inteiro(v),
          centro: inteiro(dados.porPlano.reduce((s, p) => s + p.valor, 0)),
          centroRotulo: "alunos",
        })
      : el("div", { class: "gr" }, [vazio("Nenhum plano ativo para repartir ainda.")])
  );
  raiz.appendChild(grade1);

  /* ---------- dinheiro e horários ---------- */
  const grade2 = el("div", { class: "graficos graficos--larga" });
  grade2.appendChild(graficoBarras(dados.serieFaturamento, {
    titulo: "Mensalidades mês a mês",
    sub: "O que já entrou e o que ainda está em aberto",
    formatar: reais,
    partes: [
      { chave: "recebido", rotulo: "Recebido", cor: OURO.medio },
      { chave: "aberto", rotulo: "Em aberto", cor: OURO.escuro },
    ],
  }));
  grade2.appendChild(
    dados.horarios.length
      ? graficoBarrasH(dados.horarios, {
          titulo: "Horários mais procurados",
          sub: "Sessões dos últimos noventa dias",
          formatar: (v) => inteiro(v) + (v === 1 ? " sessão" : " sessões"),
        })
      : el("div", { class: "gr" }, [vazio("Ainda não há sessões suficientes para medir os horários.")])
  );
  raiz.appendChild(grade2);

  /* ---------- metas e presença ---------- */
  const meta = Number(estudio.meta_faturamento || 0);
  const metaAlunos = Number(estudio.meta_alunos || 0);
  const blocoMetas = el("section", { class: "bloco" }, [
    el("h2", { class: "bloco__titulo", texto: "Como o mês está indo" }),
  ]);
  if (meta > 0) {
    blocoMetas.appendChild(barraProgresso(k.recebido, meta, {
      rotulo: `Meta de ${dinheiro(meta)}, recebidos ${dinheiro(k.recebido)}`,
      cor: OURO.marca,
    }));
  }
  if (metaAlunos > 0) {
    blocoMetas.appendChild(barraProgresso(k.ativos, metaAlunos, {
      rotulo: `Meta de ${metaAlunos} alunos, hoje são ${k.ativos}`,
      cor: OURO.claro,
    }));
  }
  blocoMetas.appendChild(barraProgresso(dados.presenca.realizadas, dados.presenca.realizadas + dados.presenca.faltas, {
    rotulo: `Presença nos últimos noventa dias, ${dados.presenca.realizadas} treinos e ${dados.presenca.faltas} faltas`,
    cor: OURO.fundo,
  }));
  blocoMetas.appendChild(
    el("p", { class: "obs", style: "margin-top:.8rem", texto:
      `Ticket médio de ${dinheiro(k.ticket)} por aluno. Se todo mundo pagar em dia, o mês fecha em ${dinheiro(k.previsto)}.` })
  );
  raiz.appendChild(blocoMetas);

  /* ---------- agenda de hoje ---------- */
  const blocoHoje = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: "Agenda de hoje" }),
      el("a", { class: "bt bt--linha bt--peq", href: "#hoje", texto: "Abrir o dia" }),
    ]),
  ]);
  if (!dados.sessoesHoje.length) {
    blocoHoje.appendChild(vazio("Nenhuma sessão marcada para hoje.",
      el("button", { class: "bt bt--linha bt--peq", texto: "Marcar a primeira", onclick: () => abrirNovaSessao({ data: agora }, recarregar) })));
  } else {
    blocoHoje.appendChild(
      el("ul", { class: "sessoes" }, dados.sessoesHoje.slice(0, 6).map((s) => {
        const aluno = s.aluno || {};
        return el("li", { class: "sessao " + (s.status === "realizada" ? "sessao--feita" : s.status === "falta" ? "sessao--falta" : "") }, [
          el("div", { class: "sessao__hora" }, [
            el("strong", { texto: hora(s.inicio) }),
            el("span", { texto: (s.duracao || 30) + " min" }),
          ]),
          el("button", { class: "sessao__aluno", onclick: () => abrirFicha(s.aluno_id, recarregar) }, [
            el("span", { class: "avatar avatar--peq", texto: iniciais(aluno.nome) }),
            el("div", {}, [
              el("strong", { texto: aluno.nome || "Aluno" }),
              el("span", { texto: s.status === "realizada" ? "Treino registrado" : s.status === "falta" ? "Faltou" : "Aguardando" }),
            ]),
          ]),
          el("div", { class: "sessao__acoes" }, [
            el("button", { class: "bt bt--linha bt--peq", texto: "Abrir", onclick: () => abrirAcoesSessao(s, recarregar) }),
          ]),
        ]);
      }))
    );
  }
  raiz.appendChild(blocoHoje);

  /* ---------- precisa de atenção ---------- */
  const atencao = el("div", { class: "graficos" });

  const blocoSumidos = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: "Alunos sumidos" }),
      el("span", { class: "obs", texto: "sem treinar há doze dias ou mais" }),
    ]),
  ]);
  if (!dados.sumidos.length) {
    blocoSumidos.appendChild(el("p", { class: "obs", texto: "Ninguém sumido. Todo mundo apareceu nas últimas duas semanas." }));
  } else {
    blocoSumidos.appendChild(
      el("ul", { class: "lista-simples" }, dados.sumidos.map((a) =>
        el("li", {}, [
          el("div", {}, [
            el("strong", { texto: a.nome }),
            el("span", { texto: a.dias === null ? "Nunca treinou" : `Último treino há ${a.dias} dias` }),
          ]),
          botaoComIcone("whatsapp", "Chamar", () => abrirWhats(a.telefone,
            `Oi ${primeiroNome(a.nome)}, senti sua falta no estúdio. Quer que eu já separe um horário para você?`), "bt--linha bt--peq"),
        ])
      ))
    );
  }
  atencao.appendChild(blocoSumidos);

  const blocoCobrar = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: "Para cobrar" }),
      el("a", { class: "bt bt--linha bt--peq", href: "#financeiro", texto: "Ver tudo" }),
    ]),
  ]);
  if (!dados.atrasadas.length) {
    blocoCobrar.appendChild(el("p", { class: "obs", texto: "Nenhuma mensalidade atrasada. Bom sinal." }));
  } else {
    blocoCobrar.appendChild(
      el("ul", { class: "lista-simples" }, dados.atrasadas.slice(0, 6).map((c) => {
        const aluno = c.aluno || {};
        const dias = Math.floor((new Date() - new Date(c.vencimento + "T12:00:00")) / 864e5);
        return el("li", {}, [
          el("div", {}, [
            el("strong", { texto: aluno.nome || "Aluno" }),
            el("span", { texto: `${dinheiro(c.valor)}  ·  venceu há ${dias} dia${dias === 1 ? "" : "s"}` }),
          ]),
          botaoComIcone("whatsapp", "Cobrar", () => abrirWhats(aluno.telefone, textoCobranca(aluno, c)), "bt--linha bt--peq"),
        ]);
      }))
    );
  }
  atencao.appendChild(blocoCobrar);
  raiz.appendChild(atencao);

  /* ---------- pedidos e aniversários ---------- */
  const extras = el("div", { class: "graficos" });

  const blocoPedidos = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: "Pedidos de aula experimental" }),
      el("a", { class: "bt bt--linha bt--peq", href: "#solicitacoes", texto: "Responder" }),
    ]),
  ]);
  if (!dados.solicitacoes.length) {
    blocoPedidos.appendChild(el("p", { class: "obs", texto: "Nenhum pedido novo esperando resposta." }));
  } else {
    blocoPedidos.appendChild(
      el("ul", { class: "lista-simples" }, dados.solicitacoes.slice(0, 5).map((s) =>
        el("li", {}, [
          el("div", {}, [
            el("strong", { texto: s.nome }),
            el("span", { texto: [s.objetivo, s.periodo].filter(Boolean).join("  ·  ") }),
          ]),
          etiqueta("Novo", "aviso"),
        ])
      ))
    );
  }
  extras.appendChild(blocoPedidos);

  const blocoAniver = el("section", { class: "bloco" }, [
    el("h2", { class: "bloco__titulo", texto: "Aniversariantes do mês" }),
  ]);
  if (!dados.aniversariantes.length) {
    blocoAniver.appendChild(el("p", { class: "obs", texto: "Nenhum aniversário neste mês." }));
  } else {
    blocoAniver.appendChild(
      el("ul", { class: "lista-simples" }, dados.aniversariantes.slice(0, 6).map((a) =>
        el("li", {}, [
          el("div", {}, [
            el("strong", {}, [
              document.createTextNode(a.nome + "  "),
              a.aniversario_hoje ? el("span", { class: "hoje-tag", texto: "hoje" }) : null,
            ]),
            el("span", { texto: "Dia " + a.aniversario_dia }),
          ]),
          botaoComIcone("whatsapp", "Parabenizar", () => abrirWhats(a.telefone,
            `Feliz aniversário, ${primeiroNome(a.nome)}! Toda a equipe da Eletrofit deseja um dia excelente.`), "bt--linha bt--peq"),
        ])
      ))
    );
  }
  extras.appendChild(blocoAniver);
  raiz.appendChild(extras);
}
