/* Confirmacao das aulas do dia.

   A proprietaria escolhe o dia, dispara a mensagem para todos que
   tem aula, um atras do outro, e acompanha quem confirmou. O aluno
   responde pelo link que vai na mensagem, e a resposta aparece aqui.
   Quem responde direto na conversa tambem pode ser anotado a mao.

   Quem desmarca dentro do prazo ganha direito a repor a aula, e a
   lista de reposicoes fica no fim da tela. */

import {
  sessoesEntre, marcarAvisoEnviado, registrarResposta, limparResposta,
  reposicoesPendentes, dispensarReposicao,
} from "../db.js";
import { el, limpar, hora, iso, hoje, somarDias, dataBr, dataCurta, iniciais, DIAS, diasEntre, primeiroNome } from "../util.js";
import { aviso, abrirFolha, etiqueta, vazio, confirmar, botaoComIcone, botaoIcone, icone } from "../ui.js";
import { estado } from "../estado.js";
import { abrirFicha } from "./ficha.js";
import { abrirNovaSessao } from "./sessao.js";
import {
  textoConfirmacao, situacaoConfirmacao, prazoDe, dentroDoPrazo, antecedenciaDe, linkConfirmacao,
} from "../confirmacao.js";
import { linkWhats } from "../util.js";

let diaEscolhido = null;

function rotuloDia(d) {
  const dia = iso(d);
  if (dia === iso(hoje())) return "Hoje";
  if (dia === iso(somarDias(hoje(), 1))) return "Amanhã";
  return `${DIAS[d.getDay()].slice(0, 3)} ${dataCurta(d)}`;
}

/* A proxima data com expediente, para o botao de amanha pular o fim de semana */
function proximoDiaAberto(estudio, depoisDe) {
  const dias = estudio.dias_semana && estudio.dias_semana.length ? estudio.dias_semana : [0, 1, 2, 3, 4, 5, 6];
  let d = somarDias(depoisDe, 1);
  for (let i = 0; i < 7 && !dias.includes(d.getDay()); i++) d = somarDias(d, 1);
  return d;
}

function abrirConversa(sessao, estudio) {
  const aluno = sessao.aluno || {};
  const url = linkWhats(aluno.telefone, textoConfirmacao(aluno, sessao, estudio));
  if (!url) {
    aviso(`${aluno.nome || "Este aluno"} está sem telefone cadastrado.`, "erro");
    return false;
  }
  window.open(url, "_blank", "noopener");
  return true;
}

export async function montar(raiz) {
  const estudio = estado.perfil.estudio;
  if (!diaEscolhido) diaEscolhido = hoje();
  const recarregar = () => montar(raiz);

  const amanha = proximoDiaAberto(estudio, hoje());
  const [doDia, deHoje, deAmanha, reposicoes] = await Promise.all([
    sessoesEntre(diaEscolhido, somarDias(diaEscolhido, 1)),
    sessoesEntre(hoje(), somarDias(hoje(), 1)),
    sessoesEntre(amanha, somarDias(amanha, 1)),
    reposicoesPendentes(),
  ]);

  // canceladas sem resposta nao interessam aqui; canceladas por "nao vou" sim
  const relevantes = (lista) => lista.filter((s) => s.status !== "cancelada" || s.confirmacao === "recusada");
  const lista = relevantes(doDia).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  const agora = new Date();
  const pendentes = lista.filter((s) => s.status === "agendada" && !s.confirmacao && new Date(s.inicio) > agora);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Confirmar aulas" }),
        el("p", { class: "tela__sub", texto: `${DIAS[diaEscolhido.getDay()]}, ${dataBr(diaEscolhido)} · desmarcar até ${antecedenciaDe(estudio)}h antes dá direito a reposição` }),
      ]),
      pendentes.length
        ? el("button", {
            class: "bt bt--primario",
            onclick: () => abrirDisparo(pendentes, estudio, recarregar),
          }, [icone("whatsapp", 16), el("span", { texto: `Enviar para ${pendentes.length}` })])
        : null,
    ])
  );

  /* escolha do dia */
  const contar = (l) => relevantes(l).filter((s) => s.status === "agendada" && !s.confirmacao && new Date(s.inicio) > agora).length;
  const chip = (d, extra) => el("button", {
    class: "abas__item " + (iso(d) === iso(diaEscolhido) ? "ativo" : ""),
    "aria-pressed": String(iso(d) === iso(diaEscolhido)),
    onclick: () => { diaEscolhido = d; montar(raiz); },
  }, [el("span", { texto: rotuloDia(d) }), extra ? el("span", { class: "abas__contador", texto: String(extra) }) : null]);

  const seletor = el("input", {
    class: "entrada entrada--dia", type: "date", value: iso(diaEscolhido), "aria-label": "Escolher outro dia",
    onchange: (e) => { if (e.target.value) { diaEscolhido = new Date(e.target.value + "T00:00:00"); montar(raiz); } },
  });

  raiz.appendChild(el("div", { class: "abas abas--dias" }, [
    chip(hoje(), contar(deHoje)),
    chip(amanha, contar(deAmanha)),
    iso(diaEscolhido) !== iso(hoje()) && iso(diaEscolhido) !== iso(amanha) ? chip(diaEscolhido, contar(doDia)) : null,
    el("label", { class: "abas__data" }, [el("span", { class: "sr", texto: "Outro dia" }), seletor]),
  ]));

  /* numeros */
  const confirmadas = lista.filter((s) => s.confirmacao === "confirmada").length;
  const recusadas = lista.filter((s) => s.confirmacao === "recusada").length;
  const semResposta = pendentes.length;
  raiz.appendChild(el("div", { class: "numeros numeros--quatro" }, [
    numero(lista.length, lista.length === 1 ? "aula no dia" : "aulas no dia"),
    numero(confirmadas, confirmadas === 1 ? "confirmou" : "confirmaram", confirmadas ? "ok" : ""),
    numero(semResposta, "sem resposta", semResposta ? "espera" : ""),
    numero(recusadas, recusadas === 1 ? "não vem" : "não vêm", recusadas ? "alerta" : ""),
  ]));

  if (lista.length) {
    const barra = el("div", { class: "confirma-barra", role: "img", "aria-label": `${confirmadas} confirmadas, ${semResposta} sem resposta, ${recusadas} não vêm` }, [
      el("i", { class: "confirma-barra__ok", style: `flex-grow:${confirmadas}` }),
      el("i", { class: "confirma-barra__espera", style: `flex-grow:${semResposta}` }),
      el("i", { class: "confirma-barra__nao", style: `flex-grow:${recusadas}` }),
    ]);
    raiz.appendChild(barra);
  }

  if (!linkConfirmacao({ token: "x" })) {
    raiz.appendChild(el("p", { class: "nota", texto:
      "O endereço do site ainda não está em config.js (SITE_URL). Até lá, a mensagem pede para o aluno responder SIM ou NÃO na conversa, e você anota a resposta aqui." }));
  }

  /* lista do dia */
  const bloco = el("section", { class: "bloco bloco--sem-borda" });
  if (!lista.length) {
    bloco.appendChild(vazio("Nenhuma aula marcada neste dia."));
  } else {
    bloco.appendChild(el("ul", { class: "confirmacoes" }, lista.map((s) => linhaSessao(s, estudio, recarregar))));
  }
  raiz.appendChild(bloco);

  /* reposicoes */
  const blocoRep = el("section", { class: "bloco", id: "reposicoes" }, [
    el("div", { class: "bloco__cabeca" }, [
      el("h2", { class: "bloco__titulo", texto: "Reposições para marcar" }),
      el("span", { class: "contador", texto: String(reposicoes.length) }),
    ]),
    el("p", { class: "obs", texto: "Quem avisou que não vinha dentro do prazo. Ao marcar a reposição, ela sai desta lista." }),
  ]);
  if (!reposicoes.length) {
    blocoRep.appendChild(el("p", { class: "semana__vazio", texto: "Nenhuma reposição pendente." }));
  } else {
    blocoRep.appendChild(el("ul", { class: "lista-simples" }, reposicoes.map((s) => {
      const aluno = s.aluno || {};
      const dias = diasEntre(s.inicio, hoje());
      return el("li", {}, [
        el("div", {}, [
          el("strong", { texto: aluno.nome || "Aluno" }),
          el("span", { texto: `Aula de ${dataBr(s.inicio)} às ${hora(s.inicio)}` + (dias > 0 ? ` · há ${dias} dia${dias === 1 ? "" : "s"}` : "") }),
        ]),
        el("button", {
          class: "bt bt--primario bt--peq", texto: "Marcar reposição",
          onclick: () => abrirNovaSessao({ alunoId: s.aluno_id, reposicaoDe: s }, recarregar),
        }),
        el("button", {
          class: "bt bt--linha bt--peq", texto: "Dispensar",
          onclick: async () => {
            if (!(await confirmar(`Dispensar a reposição de ${aluno.nome || "aluno"}? A aula de ${dataBr(s.inicio)} não será reposta.`, { rotuloOk: "Dispensar", perigo: true }))) return;
            await dispensarReposicao(s.id);
            aviso("Reposição dispensada.");
            recarregar();
          },
        }),
      ]);
    })));
  }
  raiz.appendChild(blocoRep);
}

function numero(valor, rotulo, tom = "") {
  return el("div", { class: "numero " + (tom ? "numero--" + tom : "") }, [
    el("strong", { texto: String(valor) }),
    el("span", { texto: rotulo }),
  ]);
}

function linhaSessao(s, estudio, recarregar) {
  const aluno = s.aluno || {};
  const sit = situacaoConfirmacao(s, estudio);
  const passou = new Date(s.inicio) <= new Date();
  const prazo = prazoDe(s, estudio);

  const acoes = [];
  if (!passou && s.status === "agendada" && !s.confirmacao) {
    acoes.push(
      botaoComIcone("whatsapp", s.aviso_enviado_em ? "Reenviar" : "Enviar", async () => {
        if (abrirConversa(s, estudio)) { await marcarAvisoEnviado(s.id); recarregar(); }
      }, "bt--linha bt--peq"),
      botaoComIcone("certo", "Vem", async () => {
        await registrarResposta(s, { vai: true });
        aviso(`${primeiroNome(aluno.nome)} confirmada.`);
        recarregar();
      }, "bt--linha bt--peq"),
      botaoComIcone("errado", "Não vem", () => anotarNaoVem(s, estudio, recarregar), "bt--linha bt--peq"),
    );
  } else if (s.confirmacao && !passou) {
    acoes.push(el("button", {
      class: "bt bt--linha bt--peq", texto: "Desfazer",
      onclick: async () => {
        if (!(await confirmar(`Apagar a resposta de ${aluno.nome || "aluno"}? A aula volta a ficar sem resposta.`, { rotuloOk: "Apagar resposta" }))) return;
        await limparResposta(s);
        aviso("Resposta apagada.");
        recarregar();
      },
    }));
  }

  return el("li", { class: `conf conf--${sit.chave}` }, [
    el("div", { class: "conf__hora" }, [
      el("strong", { texto: hora(s.inicio) }),
      el("span", { texto: (s.duracao || 30) + " min" }),
    ]),
    el("button", { class: "conf__aluno", onclick: () => abrirFicha(s.aluno_id, recarregar) }, [
      el("span", { class: "avatar avatar--peq", texto: iniciais(aluno.nome) }),
      el("div", {}, [
        el("strong", {}, [
          document.createTextNode(aluno.nome || "Aluno"),
          s.experimental ? el("span", { class: "tag-exp", texto: "experimental" }) : null,
          s.reposicao_de ? el("span", { class: "tag-exp tag-exp--rep", texto: "reposição" }) : null,
        ]),
        el("span", { texto: sit.detalhe || (!passou ? `Pode desmarcar até ${hora(prazo)}` : "") }),
      ]),
    ]),
    el("div", { class: "conf__estado" }, [etiqueta(sit.rotulo, sit.tom)]),
    acoes.length ? el("div", { class: "conf__acoes" }, acoes) : null,
  ]);
}

/* Anotar a mao que o aluno nao vem. O painel sugere a reposicao
   conforme o horario de agora, mas quem decide e a proprietaria:
   o aluno pode ter avisado antes na conversa. */
function anotarNaoVem(s, estudio, recarregar) {
  const aluno = s.aluno || {};
  const prazo = prazoDe(s, estudio);
  const noPrazo = dentroDoPrazo(s, estudio);
  abrirFolha("Não vem", (corpo, fechar) => {
    corpo.append(
      el("p", { class: "texto", texto: `${aluno.nome || "O aluno"} avisou que não vem na aula de ${dataBr(s.inicio)} às ${hora(s.inicio)}. O horário fica livre na agenda.` }),
      el("p", { class: "obs", texto: `O prazo para desmarcar com reposição ${noPrazo ? "vai" : "foi"} até ${hora(prazo)}${iso(prazo) !== iso(new Date()) ? " de " + dataCurta(prazo) : ""}. ${noPrazo ? "Ainda está dentro do prazo." : "Se o aviso chegou antes disso, dê a reposição mesmo assim."}` }),
      el("div", { class: "grade-acoes" }, [
        el("button", {
          class: "bt " + (noPrazo ? "bt--primario" : "bt--linha"), texto: "Avisou a tempo, dar reposição",
          onclick: async () => {
            await registrarResposta(s, { vai: false, comReposicao: true });
            aviso("Anotado. A reposição está na lista.");
            fechar(); recarregar();
          },
        }),
        el("button", {
          class: "bt " + (noPrazo ? "bt--linha" : "bt--primario"), texto: "Fora do prazo, sem reposição",
          onclick: async () => {
            await registrarResposta(s, { vai: false, comReposicao: false });
            aviso("Anotado, sem reposição.");
            fechar(); recarregar();
          },
        }),
      ])
    );
  }, { largura: "estreita" });
}

/* Dispara as mensagens uma de cada vez. O navegador so deixa abrir
   uma conversa por toque, entao cada toque abre a conversa atual e
   ja prepara a proxima. */
export function abrirDisparo(fila, estudio, aoTerminar) {
  let i = 0;
  let abertas = 0;
  abrirFolha("Enviar confirmações", (corpo, fechar) => {
    const desenhar = () => {
      limpar(corpo);
      if (i >= fila.length) {
        corpo.append(
          el("div", { class: "disparo__fim" }, [
            el("span", { class: "disparo__selo", html: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6.5 9.5 17 4 11.5"/></svg>' }),
            el("h3", { texto: abertas ? `${abertas} mensage${abertas === 1 ? "m aberta" : "ns abertas"}` : "Nenhuma mensagem aberta" }),
            el("p", { class: "obs", texto: "Quem responder pelo link aparece como confirmado nesta tela, sem precisar anotar." }),
            el("button", { class: "bt bt--primario bt--cheio", texto: "Concluir", onclick: () => fechar() }),
          ])
        );
        return;
      }
      const s = fila[i];
      const aluno = s.aluno || {};
      const texto = textoConfirmacao(aluno, s, estudio);
      corpo.append(
        el("div", { class: "disparo__progresso" }, [
          el("span", { texto: `${i + 1} de ${fila.length}` }),
          el("progress", { max: fila.length, value: i, "aria-label": "Mensagens enviadas" }),
        ]),
        el("div", { class: "disparo__aluno" }, [
          el("span", { class: "avatar", texto: iniciais(aluno.nome) }),
          el("div", {}, [
            el("strong", { texto: aluno.nome || "Aluno" }),
            el("span", { texto: `${hora(s.inicio)} · ${aluno.telefone ? "WhatsApp pronto" : "sem telefone cadastrado"}` }),
          ]),
        ]),
        el("pre", { class: "disparo__msg", texto }),
        el("div", { class: "grade-acoes grade-acoes--2" }, [
          el("button", { class: "bt bt--linha", texto: "Pular", onclick: () => { i++; desenhar(); } }),
          el("button", {
            class: "bt bt--primario", disabled: !aluno.telefone,
            onclick: async () => {
              if (abrirConversa(s, estudio)) {
                abertas++;
                try { await marcarAvisoEnviado(s.id); } catch (e) { /* segue a fila */ }
              }
              i++; desenhar();
            },
          }, [icone("whatsapp", 16), el("span", { texto: `Abrir conversa de ${primeiroNome(aluno.nome)}` })]),
        ]),
        el("button", {
          class: "bt bt--texto", texto: "Copiar mensagem",
          onclick: async () => {
            try { await navigator.clipboard.writeText(texto); aviso("Mensagem copiada."); }
            catch (e) { aviso("Não foi possível copiar. Segure no texto para copiar.", "erro"); }
          },
        })
      );
      corpo.querySelector(".bt--primario:not([disabled])")?.focus();
    };
    desenhar();
  }, { aoFechar: aoTerminar });
}
