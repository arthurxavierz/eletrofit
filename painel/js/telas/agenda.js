/* Agenda da semana */

import { sessoesEntre } from "../db.js";
import { el, limpar, hora, iso, dataCurta, somarDias, inicioDaSemana, hoje, DIAS_CURTO } from "../util.js";
import { estado } from "../estado.js";
import { abrirNovaSessao, abrirAcoesSessao } from "./sessao.js";

let semanaAtual = null;

export async function montar(raiz) {
  const estudio = estado.perfil.estudio;
  if (!semanaAtual) semanaAtual = inicioDaSemana(hoje());
  const inicio = new Date(semanaAtual);
  const fim = somarDias(inicio, 7);

  const sessoes = await sessoesEntre(inicio, fim);
  const recarregar = () => montar(raiz);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Agenda" }),
        el("p", { class: "tela__sub", texto: `${dataCurta(inicio)} a ${dataCurta(somarDias(inicio, 6))}` }),
      ]),
      el("div", { class: "linha-botoes" }, [
        el("button", { class: "bt bt--linha bt--peq", texto: "Anterior", onclick: () => { semanaAtual = somarDias(semanaAtual, -7); montar(raiz); } }),
        el("button", { class: "bt bt--linha bt--peq", texto: "Hoje", onclick: () => { semanaAtual = inicioDaSemana(hoje()); montar(raiz); } }),
        el("button", { class: "bt bt--linha bt--peq", texto: "Próxima", onclick: () => { semanaAtual = somarDias(semanaAtual, 7); montar(raiz); } }),
        el("button", { class: "bt bt--primario bt--peq", texto: "Marcar", onclick: () => abrirNovaSessao({ data: new Date(inicio) }, recarregar) }),
      ]),
    ])
  );

  const dias = (estudio.dias_semana && estudio.dias_semana.length ? estudio.dias_semana : [0, 1, 2, 3, 4, 5, 6]).slice().sort();
  const hojeIso = iso(hoje());
  const grade = el("div", { class: "semana" });

  dias.forEach((d) => {
    const dia = somarDias(inicio, d);
    const doDia = sessoes
      .filter((s) => iso(s.inicio) === iso(dia) && s.status !== "cancelada")
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

    const coluna = el("div", { class: "semana__dia " + (iso(dia) === hojeIso ? "semana__dia--hoje" : "") }, [
      el("div", { class: "semana__topo" }, [
        el("strong", { texto: DIAS_CURTO[dia.getDay()] }),
        el("span", { texto: dataCurta(dia) }),
        el("span", { class: "semana__carga", texto: doDia.length ? doDia.length + (doDia.length === 1 ? " sessão" : " sessões") : "" }),
      ]),
    ]);

    if (!doDia.length) {
      coluna.appendChild(el("p", { class: "semana__vazio", texto: "Livre" }));
    } else {
      doDia.forEach((s) => {
        const aluno = s.aluno || {};
        coluna.appendChild(
          el("button", {
            class: "cartao-sessao " + (s.status === "realizada" ? "cartao-sessao--feita" : s.status === "falta" ? "cartao-sessao--falta" : ""),
            onclick: () => abrirAcoesSessao(s, recarregar),
          }, [
            el("strong", { texto: hora(s.inicio) }),
            el("span", { texto: aluno.nome || "Aluno" }),
          ])
        );
      });
    }

    coluna.appendChild(
      el("button", {
        class: "semana__mais", texto: "Marcar",
        onclick: () => abrirNovaSessao({ data: dia }, recarregar),
      })
    );

    grade.appendChild(coluna);
  });

  raiz.appendChild(grade);

  const total = sessoes.filter((s) => s.status !== "cancelada").length;
  const feitas = sessoes.filter((s) => s.status === "realizada").length;
  const faltas = sessoes.filter((s) => s.status === "falta").length;

  /* quantas vagas o estúdio tem na semana, contando capacidade e horário */
  const [ha, ma] = String(estudio.abre || "07:00").split(":").map(Number);
  const [hf, mf] = String(estudio.fecha || "20:30").split(":").map(Number);
  const duracao = Number(estudio.duracao_padrao || 30);
  const janelasPorDia = Math.max(Math.floor(((hf * 60 + mf) - (ha * 60 + ma)) / duracao), 0);
  const vagas = janelasPorDia * dias.length * Number(estudio.capacidade || 1);
  const ocupacao = vagas ? Math.round((total / vagas) * 100) : 0;

  raiz.appendChild(
    el("p", { class: "obs obs--centro", texto:
      `${total} ${total === 1 ? "sessão" : "sessões"} na semana, ${feitas} ${feitas === 1 ? "realizada" : "realizadas"}, ${faltas} ${faltas === 1 ? "falta" : "faltas"}. ` +
      `A agenda está com ${ocupacao}% das vagas ocupadas.` })
  );
}
