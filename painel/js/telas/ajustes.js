/* Dados do estudio, planos e informacoes do sistema */

import { salvarEstudio, listarPlanos, salvarPlano, DEMO, reiniciarDemo } from "../db.js";
import { el, limpar, dinheiro, DIAS, PERIODICIDADES, rotuloPeriodicidade, precoDoPlano, periodicidadeDe } from "../util.js";
import { abrirFolha, campo, entradaTexto, entradaSelecao, lerFormulario, aviso, confirmar, etiqueta } from "../ui.js";
import { estado } from "../estado.js";

function formularioPlano(plano, aoSalvar) {
  const novo = !plano;
  abrirFolha(novo ? "Novo plano" : "Editar plano", (corpo, fechar) => {
    const form = el("form", { class: "form" });
    form.append(
      campo("Nome", entradaTexto("nome", plano?.nome || "", { placeholder: "Plano 2x na semana", required: true })),
      el("div", { class: "form__par" }, [
        campo("Sessões por semana", entradaTexto("sessoes_semana", plano?.sessoes_semana ?? 2, { type: "number", min: 1, max: 7 })),
        campo("Sessões por mês", entradaTexto("sessoes_mes", plano?.sessoes_mes ?? 8, { type: "number", min: 1, max: 31 })),
      ]),
      campo("Cobrança", entradaSelecao("periodicidade",
        PERIODICIDADES.map((x) => ({ valor: x.valor, texto: x.rotulo })), plano?.periodicidade || "mensal"),
        "Mensal cobra todo mês, trimestral a cada 3 meses, anual uma vez por ano."),
      campo("Valor do ciclo", entradaTexto("valor", plano?.valor ?? 0, { type: "number", min: 0, step: "0.01" }),
        "O valor cheio cobrado de uma vez. Em um trimestral, o valor dos 3 meses."),
      campo("Situação", entradaSelecao("ativo", [
        { valor: "true", texto: "Disponível para venda" },
        { valor: "false", texto: "Fora de linha" },
      ], String(plano?.ativo ?? true))),
      el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: novo ? "Cadastrar plano" : "Salvar" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = lerFormulario(form);
      try {
        await salvarPlano({
          id: plano?.id,
          nome: d.nome.trim(),
          sessoes_semana: Number(d.sessoes_semana),
          sessoes_mes: Number(d.sessoes_mes),
          periodicidade: d.periodicidade,
          valor: Number(d.valor),
          ativo: d.ativo === "true",
        });
        aviso("Plano salvo.");
        fechar();
        aoSalvar();
      } catch (e) { aviso(e.message, "erro"); }
    });
    corpo.appendChild(form);
  });
}

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const estudio = estado.perfil.estudio;
  const planos = await listarPlanos({});

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Ajustes" }),
        el("p", { class: "tela__sub", texto: "Como o estúdio funciona no dia a dia" }),
      ]),
    ])
  );

  /* dados do estudio */
  const bloco = el("section", { class: "bloco" }, [el("h2", { class: "bloco__titulo", texto: "Estúdio" })]);
  const form = el("form", { class: "form" });
  form.append(
    campo("Nome", entradaTexto("nome", estudio.nome || "")),
    el("div", { class: "form__par" }, [
      campo("WhatsApp", entradaTexto("whatsapp", estudio.whatsapp || ""), "Com DDI e DDD, so numeros"),
      campo("Alunos ao mesmo tempo", entradaTexto("capacidade", estudio.capacidade ?? 2, { type: "number", min: 1, max: 20 }), "Quantos coletes atendem juntos"),
    ]),
    campo("Endereço", entradaTexto("endereco", estudio.endereco || "")),
    el("div", { class: "form__par" }, [
      campo("Duração da sessão", entradaSelecao("duracao_padrao", [20, 25, 30, 45, 60].map((v) => ({ valor: v, texto: v + " minutos" })), estudio.duracao_padrao || 30)),
      campo("Intervalo de recuperação", entradaSelecao("intervalo_recuperacao", [0, 12, 24, 36, 48, 72].map((v) => ({ valor: v, texto: v ? v + " horas" : "Sem controle" })), estudio.intervalo_recuperacao ?? 24), "O painel avisa se marcar antes disso"),
    ]),
    el("div", { class: "form__par" }, [
      campo("Abre as", entradaTexto("abre", (estudio.abre || "07:00").slice(0, 5), { type: "time" })),
      campo("Fecha as", entradaTexto("fecha", (estudio.fecha || "20:30").slice(0, 5), { type: "time" })),
    ])
  );

  // os campos abaixo so existem depois do arquivo 05 do banco
  const temConfirmacao = "antecedencia_cancelamento" in estudio;
  if (temConfirmacao) {
    form.append(el("div", { class: "form__par" }, [
      campo("Desmarcar com reposição até", entradaSelecao("antecedencia_cancelamento",
        [0, 1, 2, 3, 4, 6, 12, 24].map((v) => ({ valor: v, texto: v ? `${v} hora${v === 1 ? "" : "s"} antes` : "Qualquer hora" })),
        estudio.antecedencia_cancelamento ?? 3), "Quem avisa depois disso fica sem reposição"),
      campo("Agenda no site", entradaSelecao("agenda_no_site", [
        { valor: "true", texto: "Mostrar horários livres" },
        { valor: "false", texto: "Esconder, só o formulário" },
      ], String(estudio.agenda_no_site ?? true)), "Onde o visitante escolhe a aula experimental"),
    ]));
  }

  const marcados = new Set((estudio.dias_semana || []).map(Number));
  const dias = el("div", { class: "dias" }, DIAS.map((nome, i) => {
    const marca = el("input", { type: "checkbox", class: "marcador", value: i });
    marca.checked = marcados.has(i);
    return el("label", { class: "dias__item" }, [marca, el("span", { texto: nome.slice(0, 3) })]);
  }));
  form.appendChild(el("div", { class: "campo" }, [el("span", { class: "campo__rotulo", texto: "Dias de atendimento" }), dias]));

  const bt = el("button", { class: "bt bt--primario", type: "submit", texto: "Salvar ajustes" });
  form.appendChild(bt);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const escolhidos = [...dias.querySelectorAll("input:checked")].map((i) => Number(i.value));
    bt.disabled = true;
    try {
      const dados = {
        nome: d.nome, whatsapp: d.whatsapp, endereco: d.endereco,
        capacidade: Number(d.capacidade), duracao_padrao: Number(d.duracao_padrao),
        intervalo_recuperacao: Number(d.intervalo_recuperacao),
        abre: d.abre, fecha: d.fecha, dias_semana: escolhidos,
      };
      if (temConfirmacao) {
        dados.antecedencia_cancelamento = Number(d.antecedencia_cancelamento);
        dados.agenda_no_site = d.agenda_no_site === "true";
      }
      const salvo = await salvarEstudio(dados);
      estado.perfil.estudio = salvo;
      aviso("Ajustes salvos.");
      recarregar();
    } catch (e) {
      aviso(e.message, "erro");
      bt.disabled = false;
    }
  });

  bloco.appendChild(form);
  raiz.appendChild(bloco);

  /* planos */
  const blocoPlanos = el("section", { class: "bloco" }, [
    el("div", { class: "bloco__topo" }, [
      el("h2", { class: "bloco__titulo", texto: "Planos" }),
      el("button", { class: "bt bt--linha bt--peq", texto: "Novo plano", onclick: () => formularioPlano(null, recarregar) }),
    ]),
  ]);

  if (!planos.length) {
    blocoPlanos.appendChild(el("p", { class: "obs", texto: "Nenhum plano cadastrado. Cadastre para poder matricular alunos." }));
  } else {
    blocoPlanos.appendChild(
      el("ul", { class: "lista-simples" }, planos.map((p) =>
        el("li", {}, [
          el("div", {}, [
            el("strong", { texto: p.nome }),
            el("span", { texto: `${p.sessoes_semana}x na semana  ·  ${precoDoPlano(p.valor, p.periodicidade)}` }),
          ]),
          etiqueta(rotuloPeriodicidade(p.periodicidade), "cinza"),
          p.ativo ? etiqueta("Disponível", "ok") : etiqueta("Fora de linha", "cinza"),
          el("button", { class: "bt bt--linha bt--peq", texto: "Editar", onclick: () => formularioPlano(p, recarregar) }),
        ])
      ))
    );
  }
  raiz.appendChild(blocoPlanos);

  /* sistema */
  const blocoSistema = el("section", { class: "bloco" }, [el("h2", { class: "bloco__titulo", texto: "Sistema" })]);
  if (DEMO) {
    blocoSistema.append(
      el("p", { class: "obs", texto: "Você está na demonstração. Os dados são de exemplo e as alterações ficam apenas neste navegador." }),
      el("button", {
        class: "bt bt--linha bt--peq", texto: "Recarregar dados de exemplo",
        onclick: async () => {
          if (!(await confirmar("Apagar as alterações e voltar aos dados de exemplo?", { rotuloOk: "Recarregar", perigo: true }))) return;
          reiniciarDemo();
          aviso("Dados de exemplo recarregados.");
          location.reload();
        },
      })
    );
  } else {
    blocoSistema.append(
      el("p", { class: "obs", texto: "Painel ligado ao banco de dados. Cada usuário enxerga apenas o próprio estúdio." }),
      el("p", { class: "obs", texto: "ID do estúdio: " + (estudio.id || "") })
    );
  }
  raiz.appendChild(blocoSistema);
}
