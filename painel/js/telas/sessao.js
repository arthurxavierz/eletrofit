/* Marcar, editar e concluir sessoes.
   Usada pelas telas de hoje e de agenda. */

import {
  listarAlunos, criarSessao, atualizarSessao, removerSessao,
  sessoesEntre, ultimaSessaoDoAluno, obterAluno, listarProtocolos,
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

  abrirFolha("Marcar sessão", async (corpo, fechar) => {
    const [alunos, protocolos] = await Promise.all([
      listarAlunos({}).then((l) => l.filter((a) => a.status !== "inativo")),
      listarProtocolos({ apenasAtivos: true }),
    ]);
    if (!alunos.length) {
      corpo.appendChild(el("p", { class: "obs", texto: "Cadastre um aluno antes de marcar a primeira sessão." }));
      return;
    }

    const form = el("form", { class: "form" });
    form.append(
      campo("Aluno", entradaSelecao("aluno_id", alunos.map((a) => ({ valor: a.id, texto: a.nome })), alunoId || alunos[0].id)),
      el("div", { class: "form__par" }, [
        campo("Dia", entradaTexto("dia", iso(data || new Date()), { type: "date", required: true })),
        campo("Hora", entradaSelecao("hora", horariosPossiveis(estudio).map((h) => ({ valor: h, texto: h })), horaInicial || "18:00")),
      ]),
      campo("Protocolo de treino", entradaSelecao("protocolo_id",
        [{ valor: "", texto: "Decidir na hora" }].concat(protocolos.map((t) => ({ valor: t.id, texto: `${t.nome}  ·  ${t.foco}` }))), "")),
      el("div", { class: "form__par" }, [
        campo("Duração", entradaSelecao("duracao", [
          { valor: 20, texto: "20 minutos" },
          { valor: 30, texto: "30 minutos" },
          { valor: 45, texto: "45 minutos" },
          { valor: 60, texto: "60 minutos" },
        ], estudio.duracao_padrao || 30)),
        campo("Repetir", entradaSelecao("repetir", [
          { valor: 0, texto: "Não repetir" },
          { valor: 4, texto: "Toda semana, 4 semanas" },
          { valor: 8, texto: "Toda semana, 8 semanas" },
          { valor: 12, texto: "Toda semana, 12 semanas" },
        ], 0), "Repete o mesmo horário nas próximas semanas")
      ])
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
        aviso(`Esse horário já está cheio. O estúdio atende ${estudio.capacidade} por vez.`, "erro");
        return;
      }

      if (!aluno.saude_liberado) {
        const segue = await confirmar(
          `${aluno.nome} ainda não está com a ficha de saúde liberada. Marcar mesmo assim?`,
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
            `A última sessão de ${aluno.nome} foi em ${dataBr(ultima.inicio)} às ${hora(ultima.inicio)}. O intervalo de recuperação do estúdio é de ${minimo} horas. Marcar mesmo assim?`,
            { rotuloOk: "Marcar assim mesmo" }
          );
          if (!segue) return;
        }
      }

      bt.disabled = true;
      try {
        const protocolo_id = dados.protocolo_id || null;
        await criarSessao({ aluno_id: aluno.id, inicio: inicio.toISOString(), duracao, protocolo_id });

        const repetir = Number(dados.repetir || 0);
        let criadas = 1;
        let cheias = 0;
        for (let i = 1; i <= repetir; i++) {
          const prox = somarDias(inicio, 7 * i);
          const ocupadosProx = await ocupacaoNoHorario(prox, duracao);
          if (ocupadosProx >= Number(estudio.capacidade || 1)) { cheias++; continue; }
          await criarSessao({ aluno_id: aluno.id, inicio: prox.toISOString(), duracao, protocolo_id });
          criadas++;
        }

        if (repetir) {
          aviso(`${criadas} sessões marcadas.` + (cheias ? ` ${cheias} semana${cheias > 1 ? "s" : ""} já estava${cheias > 1 ? "m" : ""} cheia${cheias > 1 ? "s" : ""}.` : ""));
        } else {
          aviso("Sessão marcada.");
        }
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
  abrirFolha(aluno.nome || "Sessão", async (corpo, fechar) => {
    const protocolos = await listarProtocolos({ apenasAtivos: true });
    const feito = async (status) => {
      await atualizarSessao(sessao.id, { status });
      aviso(status === "realizada" ? "Presença registrada." : status === "falta" ? "Falta registrada." : "Sessão cancelada.");
      fechar();
      if (aoMudar) aoMudar();
    };

    corpo.appendChild(
      el("p", { class: "obs", texto: `${dataBr(sessao.inicio)} às ${hora(sessao.inicio)}, ${sessao.duracao || 30} minutos` })
    );

    corpo.appendChild(
      el("div", { class: "grade-acoes" }, [
        botaoComIcone("certo", "Marcar presença", () => feito("realizada"), "bt--linha"),
        botaoComIcone("errado", "Marcar falta", () => feito("falta"), "bt--linha"),
        botaoComIcone("whatsapp", "Lembrar no WhatsApp", () => abrirWhats(aluno.telefone, textoLembrete(aluno, sessao)), "bt--linha"),
        el("button", { class: "bt bt--linha", texto: "Ver ficha", onclick: () => { fechar(); abrirFicha(sessao.aluno_id, aoMudar); } }),
      ])
    );

    const form = el("form", { class: "form" });
    form.append(
      campo("Protocolo aplicado", entradaSelecao("protocolo_id",
        [{ valor: "", texto: "Sem protocolo definido" }].concat(protocolos.map((t) => ({ valor: t.id, texto: `${t.nome}  ·  ${t.foco}` }))),
        sessao.protocolo_id || "")),
      campo("Intensidade e anotações do treino", entradaArea("intensidade", sessao.intensidade || "", 2), "Exemplo: nível 6, pernas 7, sem queixa"),
      el("button", { class: "bt bt--linha bt--peq", type: "submit", texto: "Salvar anotação" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      await atualizarSessao(sessao.id, { intensidade: dados.intensidade, protocolo_id: dados.protocolo_id || null });
      aviso("Anotação salva.");
      fechar();
      if (aoMudar) aoMudar();
    });
    corpo.appendChild(form);

    corpo.appendChild(
      el("div", { class: "linha-botoes linha-botoes--inicio" }, [
        el("button", {
          class: "bt bt--linha bt--peq", texto: "Reagendar",
          onclick: () => { fechar(); abrirReagendar(sessao, aoMudar); },
        }),
        el("button", {
          class: "bt bt--perigo bt--peq", texto: "Desmarcar",
          onclick: async () => {
            if (!(await confirmar("Desmarcar esta sessão? Ela sai da agenda.", { rotuloOk: "Desmarcar", perigo: true }))) return;
            await removerSessao(sessao.id);
            aviso("Sessão desmarcada.");
            fechar();
            if (aoMudar) aoMudar();
          },
        }),
      ])
    );
  });
}

/* Muda o dia e a hora de uma sessao ja marcada */
export function abrirReagendar(sessao, aoMudar) {
  const estudio = estado.perfil.estudio;
  const aluno = sessao.aluno || {};
  abrirFolha("Reagendar", (corpo, fechar) => {
    const atual = new Date(sessao.inicio);
    const form = el("form", { class: "form" });
    form.append(
      el("p", { class: "obs", texto: `${aluno.nome || "Aluno"}, hoje em ${dataBr(sessao.inicio)} às ${hora(sessao.inicio)}` }),
      el("div", { class: "form__par" }, [
        campo("Novo dia", entradaTexto("dia", iso(atual), { type: "date", required: true })),
        campo("Nova hora", entradaSelecao("hora", horariosPossiveis(estudio).map((h) => ({ valor: h, texto: h })),
          `${String(atual.getHours()).padStart(2, "0")}:${String(atual.getMinutes()).padStart(2, "0")}`)),
      ]),
      el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: "Reagendar" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      const novo = juntarDataHora(dados.dia, dados.hora);
      const duracao = sessao.duracao || 30;
      const ocupados = await ocupacaoNoHorario(novo, duracao, sessao.id);
      if (ocupados >= Number(estudio.capacidade || 1)) {
        aviso(`Esse horário já está cheio. O estúdio atende ${estudio.capacidade} por vez.`, "erro");
        return;
      }
      await atualizarSessao(sessao.id, { inicio: novo.toISOString(), status: "agendada" });
      aviso("Sessão reagendada.");
      fechar();
      if (aoMudar) aoMudar();
    });
    corpo.appendChild(form);
  });
}
