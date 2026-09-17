/* Relatórios: o que aconteceu no período escolhido.
   Serve para fechar o mês e para decidir o que mudar. */

import { listarMatriculas, cobrancasDesde, sessoesEntre, listarAlunos, listarPlanos } from "../db.js";
import {
  el, limpar, dinheiro, iso, hoje, primeiroDoMes, somarMeses, somarDias,
  mesPorExtenso, MESES, DIAS_CURTO,
} from "../util.js";
import { cartaoNumero, vazio, etiqueta } from "../ui.js";
import { graficoBarras, graficoBarrasH, graficoLinha, barraProgresso, OURO } from "../graficos.js";

let meses = 6;

function reais(v, curto) {
  const n = Number(v) || 0;
  if (!curto) return dinheiro(n);
  if (n >= 1000) return "R$ " + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + " mil";
  return "R$ " + Math.round(n);
}
const inteiro = (v) => String(Math.round(Number(v) || 0));

function tabela(colunas, linhas) {
  return el("div", { class: "gr__tabela", style: "margin-top:0" }, [
    el("table", { class: "tabela" }, [
      el("thead", {}, [el("tr", {}, colunas.map((c) => el("th", { texto: c })))]),
      el("tbody", {}, linhas.map((l) => el("tr", {}, l.map((c) => el("td", {}, [typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c]))))),
    ]),
  ]);
}

export async function montar(raiz) {
  const base = hoje();
  const primeiroMes = primeiroDoMes(somarMeses(base, -(meses - 1)));
  const diasNoPeriodo = Math.round((base - primeiroMes) / 864e5) + 31;

  const [matriculas, cobrancas, sessoes, alunos, planos] = await Promise.all([
    listarMatriculas(),
    cobrancasDesde(iso(primeiroMes)),
    sessoesEntre(primeiroMes, somarDias(base, 1)),
    listarAlunos({}),
    listarPlanos({}),
  ]);

  const linhasMes = [];
  for (let k = meses - 1; k >= 0; k--) {
    const mes = primeiroDoMes(somarMeses(base, -k));
    const compIso = iso(mes);
    const primeiroDia = compIso;
    const ultimoDia = iso(new Date(mes.getFullYear(), mes.getMonth() + 1, 0));
    const doMes = cobrancas.filter((c) => c.competencia === compIso);
    const sessoesDoMes = sessoes.filter((s) => {
      const d = iso(s.inicio);
      return d >= primeiroDia && d <= ultimoDia;
    });
    linhasMes.push({
      rotulo: MESES[mes.getMonth()].slice(0, 3),
      competencia: compIso,
      porExtenso: mesPorExtenso(mes),
      recebido: doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0),
      aberto: doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0),
      entradas: matriculas.filter((m) => m.inicio >= primeiroDia && m.inicio <= ultimoDia).length,
      saidas: matriculas.filter((m) => m.fim && m.fim >= primeiroDia && m.fim <= ultimoDia).length,
      realizadas: sessoesDoMes.filter((s) => s.status === "realizada").length,
      faltas: sessoesDoMes.filter((s) => s.status === "falta").length,
    });
  }

  const totalRecebido = linhasMes.reduce((s, l) => s + l.recebido, 0);
  const totalAberto = linhasMes.reduce((s, l) => s + l.aberto, 0);
  const totalEntradas = linhasMes.reduce((s, l) => s + l.entradas, 0);
  const totalSaidas = linhasMes.reduce((s, l) => s + l.saidas, 0);
  const totalRealizadas = linhasMes.reduce((s, l) => s + l.realizadas, 0);
  const totalFaltas = linhasMes.reduce((s, l) => s + l.faltas, 0);
  const taxaPresenca = totalRealizadas + totalFaltas ? Math.round((totalRealizadas / (totalRealizadas + totalFaltas)) * 100) : 0;

  /* dias da semana mais movimentados */
  const porDia = {};
  sessoes.filter((s) => s.status === "realizada").forEach((s) => {
    const d = new Date(s.inicio).getDay();
    porDia[d] = (porDia[d] || 0) + 1;
  });
  const dias = Object.entries(porDia)
    .map(([d, v]) => ({ rotulo: DIAS_CURTO[Number(d)], valor: v }))
    .sort((a, b) => b.valor - a.valor);

  /* alunos que mais treinaram */
  const porAluno = {};
  sessoes.filter((s) => s.status === "realizada").forEach((s) => {
    porAluno[s.aluno_id] = (porAluno[s.aluno_id] || 0) + 1;
  });
  const ranking = Object.entries(porAluno)
    .map(([id, v]) => ({ aluno: alunos.find((a) => a.id === id) || { nome: "Aluno" }, valor: v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  /* recebido por forma de pagamento */
  const porForma = {};
  cobrancas.filter((c) => c.status === "paga").forEach((c) => {
    const f = c.forma || "Não informado";
    porForma[f] = (porForma[f] || 0) + Number(c.valor);
  });
  const formas = Object.entries(porForma).map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);

  /* faltas por aluno, quem mais desmarca */
  const faltasPorAluno = {};
  sessoes.filter((s) => s.status === "falta").forEach((s) => {
    faltasPorAluno[s.aluno_id] = (faltasPorAluno[s.aluno_id] || 0) + 1;
  });
  const maisFaltam = Object.entries(faltasPorAluno)
    .map(([id, v]) => ({ aluno: alunos.find((a) => a.id === id) || { nome: "Aluno" }, valor: v }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Relatórios" }),
        el("p", { class: "tela__sub", texto: `De ${mesPorExtenso(primeiroMes)} até ${mesPorExtenso(base)}` }),
      ]),
    ])
  );

  raiz.appendChild(
    el("div", { class: "abas" }, [3, 6, 12].map((m) =>
      el("button", {
        class: "abas__item " + (meses === m ? "ativo" : ""),
        texto: "Últimos " + m + " meses",
        onclick: () => { meses = m; montar(raiz); },
      })
    ))
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Recebido no período", valor: dinheiro(totalRecebido), icone: "dinheiro", tom: "ok",
        nota: `média de ${dinheiro(totalRecebido / meses)} por mês` }),
      cartaoNumero({ rotulo: "Ainda em aberto", valor: dinheiro(totalAberto), icone: "relogio",
        tom: totalAberto ? "alerta" : "" }),
      cartaoNumero({ rotulo: "Entraram e saíram", valor: `${totalEntradas} e ${totalSaidas}`, icone: "pessoas",
        nota: `saldo de ${totalEntradas - totalSaidas > 0 ? "+" : ""}${totalEntradas - totalSaidas} alunos` }),
      cartaoNumero({ rotulo: "Presença", valor: taxaPresenca + "%", icone: "certo",
        nota: `${totalRealizadas} treinos e ${totalFaltas} faltas` }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "graficos graficos--larga" }, [
      graficoBarras(linhasMes, {
        titulo: "Mensalidades mês a mês",
        sub: "O que entrou e o que ficou em aberto",
        formatar: reais,
        partes: [
          { chave: "recebido", rotulo: "Recebido", cor: OURO.medio },
          { chave: "aberto", rotulo: "Em aberto", cor: OURO.escuro },
        ],
      }),
      formas.length
        ? graficoBarrasH(formas, { titulo: "Como o dinheiro entra", sub: "Recebido por forma de pagamento", formatar: reais })
        : el("div", { class: "gr" }, [vazio("Nenhum recebimento no período.")]),
    ])
  );

  raiz.appendChild(
    el("div", { class: "graficos" }, [
      graficoBarras(linhasMes.map((l) => ({ rotulo: l.rotulo, valor: l.entradas })), {
        titulo: "Alunos que entraram", sub: "Matrículas abertas em cada mês", formatar: inteiro,
      }),
      graficoBarras(linhasMes.map((l) => ({ rotulo: l.rotulo, valor: l.saidas })), {
        titulo: "Alunos que saíram", sub: "Matrículas encerradas em cada mês", formatar: inteiro,
      }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "graficos graficos--larga" }, [
      graficoLinha(linhasMes.map((l) => ({ rotulo: l.rotulo, valor: l.realizadas })), {
        titulo: "Treinos realizados", sub: "Sessões marcadas que viraram treino", formatar: inteiro,
      }),
      dias.length
        ? graficoBarrasH(dias, { titulo: "Dias mais movimentados", sub: "Treinos realizados por dia da semana", formatar: (v) => inteiro(v) + (v === 1 ? " treino" : " treinos") })
        : el("div", { class: "gr" }, [vazio("Nenhum treino registrado no período.")]),
    ])
  );

  /* fechamento mês a mês */
  raiz.appendChild(
    el("section", { class: "bloco" }, [
      el("h2", { class: "bloco__titulo", texto: "Fechamento mês a mês" }),
      tabela(
        ["Mês", "Recebido", "Em aberto", "Entraram", "Saíram", "Treinos", "Faltas"],
        linhasMes.slice().reverse().map((l) => [
          l.porExtenso, dinheiro(l.recebido), dinheiro(l.aberto),
          String(l.entradas), String(l.saidas), String(l.realizadas), String(l.faltas),
        ])
      ),
    ])
  );

  const lado = el("div", { class: "graficos" });

  const blocoRanking = el("section", { class: "bloco" }, [
    el("h2", { class: "bloco__titulo", texto: "Alunos mais presentes" }),
  ]);
  if (!ranking.length) {
    blocoRanking.appendChild(el("p", { class: "obs", texto: "Nenhum treino registrado no período." }));
  } else {
    ranking.forEach((r, i) => {
      blocoRanking.appendChild(barraProgresso(r.valor, ranking[0].valor, {
        rotulo: `${i + 1}. ${r.aluno.nome}, ${r.valor} ${r.valor === 1 ? "treino" : "treinos"}`,
        cor: i === 0 ? OURO.claro : i < 3 ? OURO.marca : OURO.fundo,
      }));
    });
  }
  lado.appendChild(blocoRanking);

  const blocoFaltas = el("section", { class: "bloco" }, [
    el("h2", { class: "bloco__titulo", texto: "Quem mais falta" }),
    el("p", { class: "obs", texto: "Vale uma conversa antes de virar cancelamento." }),
  ]);
  if (!maisFaltam.length) {
    blocoFaltas.appendChild(el("p", { class: "obs", style: "margin-top:.6rem", texto: "Nenhuma falta registrada no período. Ótimo sinal." }));
  } else {
    blocoFaltas.appendChild(
      el("ul", { class: "lista-simples" }, maisFaltam.map((f) =>
        el("li", {}, [
          el("div", {}, [
            el("strong", { texto: f.aluno.nome }),
            el("span", { texto: `${f.valor} ${f.valor === 1 ? "falta" : "faltas"} no período` }),
          ]),
          etiqueta(f.valor >= 4 ? "Atenção" : "Acompanhar", f.valor >= 4 ? "erro" : "aviso"),
        ])
      ))
    );
  }
  lado.appendChild(blocoFaltas);
  raiz.appendChild(lado);

  raiz.appendChild(
    el("p", { class: "obs obs--centro", texto:
      `Período de ${diasNoPeriodo} dias, ${alunos.length} alunos cadastrados e ${planos.filter((p) => p.ativo).length} planos à venda.` })
  );
}
