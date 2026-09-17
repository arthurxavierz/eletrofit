/* Pedidos de aula experimental que chegam pelo site */

import { listarSolicitacoes, atualizarSolicitacao, salvarAluno } from "../db.js";
import { el, limpar, telefoneBonito, dataBr, hora, primeiroNome } from "../util.js";
import { aviso, vazio, confirmar, etiqueta, botaoComIcone } from "../ui.js";
import { abrirFicha, abrirWhats } from "./ficha.js";

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
        el("p", { class: "tela__sub", texto: "Formulário do site e contatos anotados" }),
      ]),
    ])
  );

  raiz.appendChild(
    el("div", { class: "abas" }, [
      el("button", { class: "abas__item " + (aba === "nova" ? "ativo" : ""), texto: `Novos (${novas.length})`, onclick: () => { aba = "nova"; montar(raiz); } }),
      el("button", { class: "abas__item " + (aba === "todas" ? "ativo" : ""), texto: "Todos", onclick: () => { aba = "todas"; montar(raiz); } }),
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
        el("p", { class: "pedido__linha", texto: [telefoneBonito(s.telefone), s.objetivo, s.periodo].filter(Boolean).join("  ·  ") }),
        el("p", { class: "obs", texto: `Chegou ${quandoChegou(s.criado_em)}` }),
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          botaoComIcone("whatsapp", "Responder", () => abrirWhats(s.telefone,
            `Oi ${primeiroNome(s.nome)}, aqui é da Eletrofit. Recebemos seu pedido de aula experimental. Qual dia dessa semana fica melhor para você?`), "bt--linha bt--peq"),
          s.status === "nova"
            ? el("button", {
                class: "bt bt--primario bt--peq", texto: "Virar aluno",
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
