/* Pedidos de aula experimental que chegam pelo site */

import { listarSolicitacoes, atualizarSolicitacao, salvarAluno, listarAlunos, criarSessao } from "../db.js";
import { el, limpar, telefoneBonito, dataBr, hora, primeiroNome, soDigitos, iso, DIAS } from "../util.js";
import { aviso, vazio, confirmar, etiqueta, botaoComIcone, abrirFolha, campo, entradaTexto, entradaSelecao, lerFormulario, icone } from "../ui.js";
import { abrirFicha, abrirWhats } from "./ficha.js";
import { horariosPossiveis, ocupacaoNoHorario } from "./sessao.js";
import { textoAulaExperimentalConfirmada } from "../confirmacao.js";
import { estado } from "../estado.js";

/* "quinta, 02/10 às 18:30" */
function horarioPedido(s) {
  if (!s.data_desejada) return "";
  const d = new Date(s.data_desejada + "T12:00:00");
  const h = s.horario_desejado ? String(s.horario_desejado).slice(0, 5) : "";
  return `${DIAS[d.getDay()]}, ${dataBr(d).slice(0, 5)}${h ? " às " + h : ""}`;
}

function juntar(dataIso, horaTexto) {
  const [a, m, d] = dataIso.split("-").map(Number);
  const [h, min] = String(horaTexto).split(":").map(Number);
  return new Date(a, m - 1, d, h, min || 0, 0, 0);
}

/* Procura o aluno pelo celular antes de cadastrar de novo */
async function alunoDoPedido(s) {
  const alvo = soDigitos(s.telefone).slice(-9);
  if (alvo.length >= 8) {
    const todos = await listarAlunos({});
    const achado = todos.find((a) => soDigitos(a.telefone).slice(-9) === alvo);
    if (achado) return achado;
  }
  return salvarAluno({
    nome: s.nome, telefone: s.telefone, objetivo: s.objetivo || "",
    status: "experimental", observacoes: "Veio pelo site, aula experimental.",
  });
}

/* Confirma o pedido: cadastra (ou reaproveita) o aluno, coloca a aula
   experimental na agenda e abre o WhatsApp com a confirmacao. */
function abrirConfirmarPedido(s, aoConfirmar) {
  const estudio = estado.perfil.estudio;
  abrirFolha("Confirmar aula experimental", (corpo, fechar) => {
    const horarios = horariosPossiveis(estudio);
    const pedida = s.horario_desejado ? String(s.horario_desejado).slice(0, 5) : "";
    const form = el("form", { class: "form" });
    form.append(
      el("div", { class: "pedido-resumo" }, [
        el("strong", { texto: s.nome }),
        el("span", { texto: [telefoneBonito(s.telefone), s.objetivo].filter(Boolean).join(" · ") }),
        s.data_desejada ? el("span", { class: "pedido-resumo__quando", texto: "Pediu: " + horarioPedido(s) }) : null,
      ]),
      el("div", { class: "form__par" }, [
        campo("Dia", entradaTexto("dia", s.data_desejada || iso(new Date()), { type: "date", required: true })),
        campo("Hora", entradaSelecao("hora", horarios.map((h) => ({ valor: h, texto: h })), horarios.includes(pedida) ? pedida : (horarios[0] || "08:00"))),
      ]),
      el("p", { class: "obs", texto: "Troque o dia ou a hora se precisar oferecer outro horário. O aluno entra como experimental e a aula já vai para a agenda." }),
    );
    const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit" }, [icone("whatsapp", 16), el("span", { texto: "Confirmar e avisar no WhatsApp" })]);
    form.appendChild(bt);
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const inicio = juntar(d.dia, d.hora);
      if (inicio < new Date()) { aviso("Esse horário já passou.", "erro"); return; }
      const duracao = Number(estudio.duracao_padrao || 30);
      bt.disabled = true;
      try {
        const ocupados = await ocupacaoNoHorario(inicio, duracao);
        if (ocupados >= Number(estudio.capacidade || 1)) {
          aviso(`Esse horário já está cheio. O estúdio atende ${estudio.capacidade} por vez.`, "erro");
          bt.disabled = false;
          return;
        }
        const aluno = await alunoDoPedido(s);
        const sessao = await criarSessao({ aluno_id: aluno.id, inicio: inicio.toISOString(), duracao, experimental: true });
        await atualizarSolicitacao(s.id, { status: "atendida", sessao_id: sessao.id });
        abrirWhats(s.telefone, textoAulaExperimentalConfirmada(s.nome, sessao, estudio));
        aviso("Aula experimental na agenda.");
        fechar();
        aoConfirmar();
      } catch (e) {
        aviso(e.message, "erro");
        bt.disabled = false;
      }
    });
    corpo.appendChild(form);
  });
}

let aba = "nova";

function quandoChegou(criado) {
  const horas = (new Date() - new Date(criado)) / 36e5;
  if (horas < 1) return "agora há pouco";
  if (horas < 24) return `há ${Math.floor(horas)} hora${Math.floor(horas) === 1 ? "" : "s"}`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} dia${dias === 1 ? "" : "s"}`;
  return dataBr(criado);
}

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const [novas, todas] = await Promise.all([listarSolicitacoes("nova"), listarSolicitacoes("")]);
  const lista = aba === "nova" ? novas : todas;

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Pedidos" }),
        el("p", { class: "tela__sub", texto: "Aulas experimentais pedidas pelo site" }),
      ]),
    ])
  );

  raiz.appendChild(
    el("div", { class: "abas" }, [
      el("button", { class: "abas__item " + (aba === "nova" ? "ativo" : ""), "aria-pressed": String(aba === "nova"), texto: `Novos (${novas.length})`, onclick: () => { aba = "nova"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "todas" ? "ativo" : ""), "aria-pressed": String(aba === "todas"), texto: "Todos", onclick: () => { aba = "todas"; montar(raiz); } }),
    ])
  );

  if (!lista.length) {
    raiz.appendChild(vazio(
      aba === "nova"
        ? "Nenhum pedido novo. Quando alguém preencher o formulário do site, aparece aqui."
        : "Nenhum pedido registrado até agora."
    ));
    return;
  }

  raiz.appendChild(
    el("ul", { class: "pedidos" }, lista.map((s) =>
      el("li", { class: "pedido" }, [
        el("div", { class: "pedido__topo" }, [
          el("strong", { texto: s.nome }),
          s.status === "nova" ? etiqueta("Novo", "aviso") : s.status === "atendida" ? etiqueta("Atendido", "ok") : etiqueta("Descartado", "cinza"),
        ]),
        s.data_desejada
          ? el("p", { class: "pedido__quando" }, [
              el("span", { texto: s.status === "nova" ? "Quer a aula" : "Pediu" }),
              el("strong", { texto: horarioPedido(s) }),
            ])
          : null,
        el("p", { class: "pedido__linha", texto: [telefoneBonito(s.telefone), s.objetivo, s.data_desejada ? null : s.periodo].filter(Boolean).join("  ·  ") }),
        el("p", { class: "obs", texto: `Chegou ${quandoChegou(s.criado_em)}` }),
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          s.status === "nova"
            ? el("button", {
                class: "bt bt--primario bt--peq", texto: s.data_desejada ? "Confirmar horário" : "Marcar aula",
                onclick: () => abrirConfirmarPedido(s, recarregar),
              })
            : null,
          botaoComIcone("whatsapp", "Responder", () => abrirWhats(s.telefone,
            s.data_desejada
              ? `Oi ${primeiroNome(s.nome)}, aqui é da Eletrofit. Recebemos seu pedido de aula experimental para ${horarioPedido(s).toLowerCase()}.`
              : `Oi ${primeiroNome(s.nome)}, aqui é da Eletrofit. Recebemos seu pedido de aula experimental. Qual dia dessa semana fica melhor para você?`), "bt--linha bt--peq"),
          s.status === "nova"
            ? el("button", {
                class: "bt bt--linha bt--peq", texto: "Só cadastrar",
                onclick: async () => {
                  const ok = await confirmar(`Cadastrar ${s.nome} como aluno experimental?`, { rotuloOk: "Cadastrar" });
                  if (!ok) return;
                  const aluno = await salvarAluno({
                    nome: s.nome, telefone: s.telefone, objetivo: s.objetivo || "",
                    status: "experimental", observacoes: s.periodo ? "Prefere treinar no período: " + s.periodo : "",
                  });
                  await atualizarSolicitacao(s.id, { status: "atendida" });
                  aviso("Aluno cadastrado.");
                  await montar(raiz);
                  abrirFicha(aluno.id, recarregar);
                },
              })
            : null,
          s.status === "nova"
            ? el("button", {
                class: "bt bt--linha bt--peq", texto: "Já atendi",
                onclick: async () => { await atualizarSolicitacao(s.id, { status: "atendida" }); aviso("Pedido marcado como atendido."); montar(raiz); },
              })
            : null,
          s.status === "nova"
            ? el("button", {
                class: "bt bt--linha bt--peq", texto: "Descartar",
                onclick: async () => {
                  if (!(await confirmar("Descartar este pedido?", { rotuloOk: "Descartar", perigo: true }))) return;
                  await atualizarSolicitacao(s.id, { status: "descartada" });
                  aviso("Pedido descartado.");
                  montar(raiz);
                },
              })
            : null,
        ]),
      ])
    ))
  );
}
