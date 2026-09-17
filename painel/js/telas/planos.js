/* Planos: quanto custa cada plano, quantos alunos tem
   e quanto cada um representa no faturamento do mês. */

import { listarPlanos, salvarPlano, listarMatriculas } from "../db.js";
import { el, limpar, dinheiro } from "../util.js";
import {
  abrirFolha, campo, entradaTexto, entradaSelecao, lerFormulario,
  aviso, vazio, etiqueta, cartaoNumero,
} from "../ui.js";
import { graficoRosca, barraProgresso, OURO } from "../graficos.js";

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
      campo("Valor mensal", entradaTexto("valor", plano?.valor ?? 0, { type: "number", min: 0, step: "0.01" })),
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
  const [planos, matriculas] = await Promise.all([listarPlanos({}), listarMatriculas()]);
  const ativas = matriculas.filter((m) => m.status === "ativa");

  const emOrdem = planos.slice().sort((a, b) => (a.sessoes_semana || 0) - (b.sessoes_semana || 0));
  const comNumeros = emOrdem.map((p) => {
    const alunos = ativas.filter((m) => m.plano_id === p.id);
    return { plano: p, alunos: alunos.length, receita: alunos.reduce((s, m) => s + Number(m.valor), 0) };
  });
  const receitaTotal = comNumeros.reduce((s, x) => s + x.receita, 0);
  const totalAlunos = comNumeros.reduce((s, x) => s + x.alunos, 0);
  const ticket = totalAlunos ? receitaTotal / totalAlunos : 0;

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Planos" }),
        el("p", { class: "tela__sub", texto: "O que o estúdio vende e quanto cada plano representa" }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Novo plano", onclick: () => formularioPlano(null, recarregar) }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Planos à venda", valor: String(planos.filter((p) => p.ativo).length), icone: "etiquetaIcone" }),
      cartaoNumero({ rotulo: "Alunos com plano", valor: String(totalAlunos), icone: "pessoas" }),
      cartaoNumero({ rotulo: "Receita prevista", valor: dinheiro(receitaTotal), icone: "dinheiro", nota: "por mês, com os planos ativos" }),
      cartaoNumero({ rotulo: "Ticket médio", valor: dinheiro(ticket), icone: "alvo", nota: "valor médio por aluno" }),
    ])
  );

  if (!planos.length) {
    raiz.appendChild(vazio("Nenhum plano cadastrado. Cadastre para poder matricular alunos.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Cadastrar plano", onclick: () => formularioPlano(null, recarregar) })));
    return;
  }

  const comAlunos = comNumeros.filter((x) => x.receita > 0);
  if (comAlunos.length) {
    raiz.appendChild(
      el("div", { class: "graficos graficos--larga" }, [
        graficoRosca(comAlunos.map((x) => ({ rotulo: x.plano.nome, valor: x.receita })), {
          titulo: "De onde vem o faturamento",
          sub: "Receita mensal prevista por plano",
          formatar: (v, curto) => curto ? "R$ " + Math.round(v) : dinheiro(v),
          centro: dinheiro(receitaTotal).replace("R$", "").trim(),
          centroRotulo: "por mês",
        }),
        (() => {
          const bloco = el("section", { class: "bloco" }, [
            el("h2", { class: "bloco__titulo", texto: "Quantos alunos em cada plano" }),
          ]);
          comNumeros.forEach((x, i) => {
            bloco.appendChild(barraProgresso(x.alunos, Math.max(totalAlunos, 1), {
              rotulo: `${x.plano.nome}, ${x.alunos} ${x.alunos === 1 ? "aluno" : "alunos"}`,
              cor: [OURO.claro, OURO.marca, OURO.fundo, OURO.escuro][Math.min(i, 3)],
            }));
          });
          return bloco;
        })(),
      ])
    );
  }

  raiz.appendChild(
    el("div", { class: "grade" }, comNumeros.map((x) =>
      el("article", { class: "ficha-cartao" }, [
        el("div", { class: "ficha-cartao__topo" }, [
          el("div", { style: "min-width:0" }, [
            el("strong", { texto: x.plano.nome }),
            el("p", { class: "obs", texto: `${x.plano.sessoes_semana}x na semana, ${x.plano.sessoes_mes} sessões no mês` }),
          ]),
          x.plano.ativo ? etiqueta("À venda", "ok") : etiqueta("Fora de linha", ""),
        ]),
        el("div", { class: "ficha-cartao__dados" }, [
          el("span", { class: "dado" }, [document.createTextNode("Mensalidade"), el("strong", { texto: dinheiro(x.plano.valor) })]),
          el("span", { class: "dado" }, [document.createTextNode("Por sessão"), el("strong", { texto: dinheiro(Number(x.plano.valor) / Math.max(x.plano.sessoes_mes || 1, 1)) })]),
          el("span", { class: "dado" }, [document.createTextNode("Alunos"), el("strong", { texto: String(x.alunos) })]),
          el("span", { class: "dado" }, [document.createTextNode("Receita"), el("strong", { texto: dinheiro(x.receita) })]),
        ]),
        el("p", { class: "obs", texto: receitaTotal
          ? `Representa ${Math.round((x.receita / receitaTotal) * 100)}% do faturamento previsto.`
          : "Ainda sem aluno matriculado neste plano." }),
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          el("button", { class: "bt bt--linha bt--peq", texto: "Editar", onclick: () => formularioPlano(x.plano, recarregar) }),
        ]),
      ])
    ))
  );
}
