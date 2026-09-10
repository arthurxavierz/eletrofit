/* Marcar, editar e concluir sessoes.
   Usada pelas telas de hoje e de agenda. */

import {
  listarAlunos, criarSessao, atualizarSessao, removerSessao,
  sessoesEntre, ultimaSessaoDoAluno, obterAluno,
} from "../db.js";
import { el, iso, hora, dataBr, somarDias } from "../util.js";
import { abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea, lerFormulario, aviso, confirmar, botaoComIcone } from "../ui.js";
import { estado } from "../estado.js";
import { abrirFicha, abrirWhats, textoLembrete } from "./ficha.js";

function juntarDataHora(dataIso, horaTexto) {
  const [a, m, d] = dataIso.split("-").map(Number);
  const [h, min] = horaTexto.split(":").map(Number);
  return new Date(a, m - 1, d, h, min || 0, 0, 0);
}

export function horariosPossiveis(estudio) {
  const [ha, ma] = String(estudio.abre || "07:00").split(":").map(Number);
  const [hf, mf] = String(estudio.fecha || "20:30").split(":").map(Number);
  const passo = 30;
  const lista = [];
  let minutos = ha * 60 + ma;
  const fim = hf * 60 + mf;
  while (minutos + Number(estudio.duracao_padrao || 30) <= fim) {
    lista.push(`${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`);
    minutos += passo;
  }
  return lista;
}

/* quantos alunos ja ocupam aquele horario */
export async function ocupacaoNoHorario(inicio, duracao, ignorarId = null) {
  const fim = new Date(inicio.getTime() + duracao * 60000);
  const dia = new Date(inicio);
  dia.setHours(0, 0, 0, 0);
  const doDia = await sessoesEntre(dia, somarDias(dia, 1));
  return doDia.filter((s) => {
    if (s.id === ignorarId) return false;
    if (s.status === "cancelada") return false;
    const si = new Date(s.inicio);
    const sf = new Date(si.getTime() + (s.duracao || 30) * 60000);
    return si < fim && sf > inicio;
  }).length;
}

export function abrirNovaSessao({ data = null, horaInicial = "", alunoId = "" } = {}, aoSalvar) {
  const estudio = estado.perfil.estudio;

  abrirFolha("Marcar sessao", async (corpo, fechar) => {
    const alunos = (await listarAlunos({})).filter((a) => a.status !== "inativo");
    if (!alunos.length) {
      corpo.appendChild(el("p", { class: "obs", texto: "Cadastre um aluno antes de marcar a primeira sessao." }));
      return;
    }

    const form = el("form", { class: "form" });
    form.append(
      campo("Aluno", entradaSelecao("aluno_id", alunos.map((a) => ({ valor: a.id, texto: a.nome })), alunoId || alunos[0].id)),
      el("div", { class: "form__par" }, [
        campo("Dia", entradaTexto("dia", iso(data || new Date()), { type: "date", required: true })),
        campo("Hora", entradaSelecao("hora", horariosPossiveis(estudio).map((h) => ({ valor: h, texto: h })), horaInicial || "18:00")),
      ]),
      campo("Duracao", entradaSelecao("duracao", [
        { valor: 20, texto: "20 minutos" },
        { valor: 30, texto: "30 minutos" },
        { valor: 45, texto: "45 minutos" },
        { valor: 60, texto: "60 minutos" },
      ], estudio.duracao_padrao || 30))
    );

    const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: "Marcar" });
    form.appendChild(bt);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      const inicio = juntarDataHora(dados.dia, dados.hora);
      const duracao = Number(dados.duracao);
      const aluno = await obterAluno(dados.aluno_id);

      const ocupados = await ocupacaoNoHorario(inicio, duracao);
      if (ocupados >= Number(estudio.capacidade || 1)) {
        aviso(`Esse horario ja esta cheio. O estudio atende ${estudio.capacidade} por vez.`, "erro");
        return;
      }

      if (!aluno.saude_liberado) {
        const segue = await confirmar(
          `${aluno.nome} ainda nao esta com a ficha de saude liberada. Marcar mesmo assim?`,
          { rotuloOk: "Marcar assim mesmo" }
        );
        if (!segue) return;
      }

      const ultima = await ultimaSessaoDoAluno(aluno.id);
      if (ultima) {
        const horas = Math.abs(inicio - new Date(ultima.inicio)) / 36e5;
        const minimo = Number(estudio.intervalo_recuperacao || 0);
        if (minimo && horas < minimo) {
          const segue = await confirmar(
            `A ultima sessao de ${aluno.nome} foi em ${dataBr(ultima.inicio)} as ${hora(ultima.inicio)}. O intervalo de recuperacao do estudio e de ${minimo} horas. Marcar mesmo assim?`,
            { rotuloOk: "Marcar assim mesmo" }
          );
          if (!segue) return;
        }
      }

      bt.disabled = true;
      try {
        await criarSessao({ aluno_id: aluno.id, inicio: inicio.toISOString(), duracao });
        aviso("Sessao marcada.");
        fechar();
        if (aoSalvar) aoSalvar();
      } catch (e) {
        aviso(e.message, "erro");
        bt.disabled = false;
      }
    });

    corpo.appendChild(form);
  });
}

export function abrirAcoesSessao(sessao, aoMudar) {
  const aluno = sessao.aluno || {};
  abrirFolha(aluno.nome || "Sessao", (corpo, fechar) => {
    const feito = async (status) => {
      await atualizarSessao(sessao.id, { status });
      aviso(status === "realizada" ? "Presenca registrada." : status === "falta" ? "Falta registrada." : "Sessao cancelada.");
      fechar();
      if (aoMudar) aoMudar();
    };

    corpo.appendChild(
      el("p", { class: "obs", texto: `${dataBr(sessao.inicio)} as ${hora(sessao.inicio)}, ${sessao.duracao || 30} minutos` })
    );

    corpo.appendChild(
      el("div", { class: "grade-acoes" }, [
        botaoComIcone("certo", "Marcar presenca", () => feito("realizada"), "bt--linha"),
        botaoComIcone("errado", "Marcar falta", () => feito("falta"), "bt--linha"),
        botaoComIcone("whatsapp", "Lembrar no WhatsApp", () => abrirWhats(aluno.telefone, textoLembrete(aluno, sessao)), "bt--linha"),
        el("button", { class: "bt bt--linha", texto: "Ver ficha", onclick: () => { fechar(); abrirFicha(sessao.aluno_id, aoMudar); } }),
      ])
    );

    const form = el("form", { class: "form" });
    form.append(
      campo("Intensidade e anotacoes do treino", entradaArea("intensidade", sessao.intensidade || "", 2), "Exemplo: nivel 6, pernas 7, sem queixa"),
      el("button", { class: "bt bt--linha bt--peq", type: "submit", texto: "Salvar anotacao" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      await atualizarSessao(sessao.id, { intensidade: dados.intensidade });
      aviso("Anotacao salva.");
      fechar();
      if (aoMudar) aoMudar();
    });
    corpo.appendChild(form);

    corpo.appendChild(
      el("div", { class: "linha-botoes" }, [
        el("button", {
          class: "bt bt--perigo bt--peq", texto: "Desmarcar",
          onclick: async () => {
            if (!(await confirmar("Desmarcar esta sessao? Ela sai da agenda.", { rotuloOk: "Desmarcar", perigo: true }))) return;
            await removerSessao(sessao.id);
            aviso("Sessao desmarcada.");
            fechar();
            if (aoMudar) aoMudar();
          },
        }),
      ])
    );
  });
}
