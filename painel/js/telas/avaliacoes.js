/* Avaliações físicas: peso, gordura e medidas, com a
   evolução de cada aluno desde a primeira medição. */

import { listarAvaliacoes, avaliacoesDoAluno, salvarAvaliacao, removerAvaliacao, listarAlunos, obterAluno } from "../db.js";
import { el, limpar, dataBr, iso, iniciais, primeiroNome } from "../util.js";
import {
  abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea, lerFormulario,
  aviso, confirmar, vazio, etiqueta, cartaoNumero,
} from "../ui.js";
import { graficoLinha } from "../graficos.js";
import { abrirFicha } from "./ficha.js";

const um = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

export function imc(peso, altura) {
  const p = um(peso), a = um(altura);
  if (!p || !a) return null;
  return +(p / (a * a)).toFixed(1);
}

function lerImc(valor) {
  if (valor === null) return "";
  if (valor < 18.5) return "abaixo do peso";
  if (valor < 25) return "peso adequado";
  if (valor < 30) return "sobrepeso";
  return "obesidade";
}

function diferenca(atual, anterior, unidade = " kg", menorEMelhor = true) {
  const a = um(atual), b = um(anterior);
  if (a === null || b === null) return null;
  const d = +(a - b).toFixed(1);
  if (d === 0) return { texto: "sem mudança", tom: "" };
  const melhorou = menorEMelhor ? d < 0 : d > 0;
  return { texto: (d > 0 ? "+" : "") + String(d).replace(".", ",") + unidade, tom: melhorou ? "ok" : "erro" };
}

/* ---------- formulário ---------- */

export function abrirFormularioAvaliacao(avaliacao, alunoFixo, aoSalvar) {
  const nova = !avaliacao;
  abrirFolha(nova ? "Nova avaliação" : "Editar avaliação", async (corpo, fechar) => {
    const alunos = (await listarAlunos({})).filter((a) => a.status !== "inativo");
    if (!alunos.length) {
      corpo.appendChild(el("p", { class: "obs", texto: "Cadastre um aluno antes de lançar uma avaliação." }));
      return;
    }
    const anteriores = await avaliacoesDoAluno(avaliacao?.aluno_id || alunoFixo || alunos[0].id);
    const ultima = anteriores.find((a) => a.id !== avaliacao?.id) || null;

    const form = el("form", { class: "form" });
    form.append(
      el("div", { class: "form__par" }, [
        campo("Aluno", entradaSelecao("aluno_id", alunos.map((a) => ({ valor: a.id, texto: a.nome })),
          avaliacao?.aluno_id || alunoFixo || alunos[0].id)),
        campo("Data", entradaTexto("data", avaliacao?.data || iso(new Date()), { type: "date", required: true })),
      ]),
      el("div", { class: "form__trio" }, [
        campo("Peso", entradaTexto("peso", avaliacao?.peso ?? "", { type: "number", step: "0.1", min: 0, placeholder: "kg" })),
        campo("Altura", entradaTexto("altura", avaliacao?.altura ?? ultima?.altura ?? "", { type: "number", step: "0.01", min: 0, placeholder: "m" })),
        campo("Gordura", entradaTexto("gordura", avaliacao?.gordura ?? "", { type: "number", step: "0.1", min: 0, placeholder: "%" })),
      ]),
      el("div", { class: "form__trio" }, [
        campo("Massa magra", entradaTexto("massa_magra", avaliacao?.massa_magra ?? "", { type: "number", step: "0.1", min: 0, placeholder: "kg" })),
        campo("Cintura", entradaTexto("cintura", avaliacao?.cintura ?? "", { type: "number", step: "0.1", min: 0, placeholder: "cm" })),
        campo("Quadril", entradaTexto("quadril", avaliacao?.quadril ?? "", { type: "number", step: "0.1", min: 0, placeholder: "cm" })),
      ]),
      el("div", { class: "form__par" }, [
        campo("Braço", entradaTexto("braco", avaliacao?.braco ?? "", { type: "number", step: "0.1", min: 0, placeholder: "cm" })),
        campo("Coxa", entradaTexto("coxa", avaliacao?.coxa ?? "", { type: "number", step: "0.1", min: 0, placeholder: "cm" })),
      ]),
      campo("Observação", entradaArea("observacao", avaliacao?.observacao || "", 2), "O que mudou desde a última medição, como o aluno está se sentindo")
    );

    if (ultima) {
      form.appendChild(el("p", { class: "obs", texto:
        `Última medição em ${dataBr(ultima.data)}: ${ultima.peso ? ultima.peso + " kg" : "sem peso"}${ultima.gordura ? ", " + ultima.gordura + "% de gordura" : ""}.` }));
    }

    const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: nova ? "Lançar avaliação" : "Salvar" });
    form.appendChild(bt);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = lerFormulario(form);
      bt.disabled = true;
      try {
        await salvarAvaliacao({
          id: avaliacao?.id,
          aluno_id: d.aluno_id, data: d.data,
          peso: um(d.peso), altura: um(d.altura), gordura: um(d.gordura), massa_magra: um(d.massa_magra),
          cintura: um(d.cintura), quadril: um(d.quadril), braco: um(d.braco), coxa: um(d.coxa),
          observacao: d.observacao,
        });
        aviso("Avaliação salva.");
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

/* ---------- histórico de um aluno ---------- */

export async function abrirHistorico(alunoId, aoMudar) {
  const aluno = await obterAluno(alunoId);
  abrirFolha(aluno ? aluno.nome : "Avaliações", async (corpo, fechar) => {
    const lista = await avaliacoesDoAluno(alunoId);
    const recarregar = async () => { fechar(); await abrirHistorico(alunoId, aoMudar); if (aoMudar) aoMudar(); };

    corpo.appendChild(
      el("div", { class: "linha-botoes linha-botoes--inicio" }, [
        el("button", { class: "bt bt--primario bt--peq", texto: "Nova avaliação", onclick: () => { fechar(); abrirFormularioAvaliacao(null, alunoId, aoMudar); } }),
        el("button", { class: "bt bt--linha bt--peq", texto: "Ver ficha", onclick: () => { fechar(); abrirFicha(alunoId, aoMudar); } }),
      ])
    );

    if (!lista.length) {
      corpo.appendChild(vazio("Este aluno ainda não tem avaliação lançada."));
      return;
    }

    const emOrdem = lista.slice().reverse();
    const comPeso = emOrdem.filter((a) => um(a.peso) !== null);
    if (comPeso.length > 1) {
      corpo.appendChild(graficoLinha(
        comPeso.map((a) => ({ rotulo: dataBr(a.data).slice(0, 5), valor: Number(a.peso) })),
        { titulo: "Peso", sub: "Cada ponto é uma avaliação", formatar: (v, curto) => (curto ? Math.round(v) + " kg" : String(v).replace(".", ",") + " kg") }
      ));
    }
    const comGordura = emOrdem.filter((a) => um(a.gordura) !== null);
    if (comGordura.length > 1) {
      corpo.appendChild(graficoLinha(
        comGordura.map((a) => ({ rotulo: dataBr(a.data).slice(0, 5), valor: Number(a.gordura) })),
        { titulo: "Percentual de gordura", sub: "Cada ponto é uma avaliação", formatar: (v) => String(v).replace(".", ",") + "%" }
      ));
    }

    lista.forEach((a, i) => {
      const anterior = lista[i + 1] || null;
      const valorImc = imc(a.peso, a.altura);
      const bloco = el("div", { class: "bloco" }, [
        el("div", { class: "bloco__topo" }, [
          el("h3", { class: "bloco__titulo", texto: dataBr(a.data) }),
          el("div", { class: "linha-botoes" }, [
            el("button", { class: "bt bt--linha bt--peq", texto: "Editar", onclick: () => { fechar(); abrirFormularioAvaliacao(a, alunoId, aoMudar); } }),
            el("button", {
              class: "bt bt--perigo bt--peq", texto: "Apagar",
              onclick: async () => {
                if (!(await confirmar("Apagar esta avaliação? Não dá para desfazer.", { rotuloOk: "Apagar", perigo: true }))) return;
                await removerAvaliacao(a.id);
                aviso("Avaliação apagada.");
                await recarregar();
              },
            }),
          ]),
        ]),
        el("div", { class: "ficha-cartao__dados" }, [
          a.peso ? el("span", { class: "dado" }, [document.createTextNode("Peso"), el("strong", { texto: String(a.peso).replace(".", ",") + " kg" })]) : null,
          valorImc ? el("span", { class: "dado" }, [document.createTextNode("IMC"), el("strong", { texto: String(valorImc).replace(".", ",") })]) : null,
          a.gordura ? el("span", { class: "dado" }, [document.createTextNode("Gordura"), el("strong", { texto: String(a.gordura).replace(".", ",") + "%" })]) : null,
          a.massa_magra ? el("span", { class: "dado" }, [document.createTextNode("Massa magra"), el("strong", { texto: String(a.massa_magra).replace(".", ",") + " kg" })]) : null,
          a.cintura ? el("span", { class: "dado" }, [document.createTextNode("Cintura"), el("strong", { texto: String(a.cintura).replace(".", ",") + " cm" })]) : null,
          a.quadril ? el("span", { class: "dado" }, [document.createTextNode("Quadril"), el("strong", { texto: String(a.quadril).replace(".", ",") + " cm" })]) : null,
          a.braco ? el("span", { class: "dado" }, [document.createTextNode("Braço"), el("strong", { texto: String(a.braco).replace(".", ",") + " cm" })]) : null,
          a.coxa ? el("span", { class: "dado" }, [document.createTextNode("Coxa"), el("strong", { texto: String(a.coxa).replace(".", ",") + " cm" })]) : null,
        ]),
      ]);

      if (anterior) {
        const dp = diferenca(a.peso, anterior.peso, " kg");
        const dg = diferenca(a.gordura, anterior.gordura, " pontos de gordura");
        const dm = diferenca(a.massa_magra, anterior.massa_magra, " kg de massa magra", false);
        const marcas = [dp, dg, dm].filter(Boolean);
        if (marcas.length) {
          bloco.appendChild(el("div", { class: "ficha__etiquetas", style: "margin-top:.6rem" },
            marcas.map((m) => etiqueta(m.texto + " desde a anterior", m.tom))));
        }
      }
      if (valorImc) {
        bloco.appendChild(el("p", { class: "obs", style: "margin-top:.5rem", texto: "Leitura do IMC: " + lerImc(valorImc) + "." }));
      }
      if (a.observacao) bloco.appendChild(el("p", { class: "ficha-cartao__texto", style: "margin-top:.5rem", texto: a.observacao }));
      corpo.appendChild(bloco);
    });
  }, { largura: "larga" });
}

/* ---------- tela ---------- */

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const [todas, alunos] = await Promise.all([listarAvaliacoes(400), listarAlunos({})]);

  /* a mais recente e a mais antiga de cada aluno */
  const porAluno = {};
  todas.forEach((a) => {
    if (!porAluno[a.aluno_id]) porAluno[a.aluno_id] = { lista: [], aluno: a.aluno };
    porAluno[a.aluno_id].lista.push(a);
  });
  const fichas = Object.entries(porAluno).map(([id, x]) => {
    const ordenada = x.lista.slice().sort((a, b) => b.data.localeCompare(a.data));
    return { alunoId: id, aluno: x.aluno || alunos.find((y) => y.id === id) || {}, ultima: ordenada[0], primeira: ordenada[ordenada.length - 1], quantas: ordenada.length };
  }).sort((a, b) => b.ultima.data.localeCompare(a.ultima.data));

  const perdas = fichas.map((f) => um(f.ultima.peso) !== null && um(f.primeira.peso) !== null ? f.ultima.peso - f.primeira.peso : null).filter((v) => v !== null);
  const perdaMedia = perdas.length ? perdas.reduce((s, v) => s + v, 0) / perdas.length : 0;
  const semAvaliacao = alunos.filter((a) => a.status === "ativo" && !porAluno[a.id]);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Avaliações" }),
        el("p", { class: "tela__sub", texto: "Peso, gordura e medidas de cada aluno ao longo do tempo" }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Nova avaliação", onclick: () => abrirFormularioAvaliacao(null, null, recarregar) }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Alunos avaliados", valor: String(fichas.length), icone: "pessoas" }),
      cartaoNumero({ rotulo: "Avaliações lançadas", valor: String(todas.length), icone: "regua" }),
      cartaoNumero({
        rotulo: "Variação média de peso", icone: "subiu",
        valor: (perdaMedia > 0 ? "+" : "") + perdaMedia.toFixed(1).replace(".", ",") + " kg",
        tom: perdaMedia <= 0 ? "ok" : "",
        nota: "da primeira até a última medição",
      }),
      cartaoNumero({
        rotulo: "Sem avaliação", valor: String(semAvaliacao.length), icone: "sino",
        tom: semAvaliacao.length ? "alerta" : "",
        nota: "alunos ativos que nunca mediram",
      }),
    ])
  );

  if (semAvaliacao.length) {
    raiz.appendChild(
      el("div", { class: "avisos" }, [
        el("div", { class: "avisos__item" }, [
          el("span", { texto: `${semAvaliacao.length} ${semAvaliacao.length === 1 ? "aluno ativo nunca foi avaliado" : "alunos ativos nunca foram avaliados"}: ${semAvaliacao.slice(0, 4).map((a) => primeiroNome(a.nome)).join(", ")}${semAvaliacao.length > 4 ? " e outros" : ""}.` }),
          el("button", { class: "bt bt--linha bt--peq", texto: "Lançar agora", onclick: () => abrirFormularioAvaliacao(null, semAvaliacao[0].id, recarregar) }),
        ]),
      ])
    );
  }

  if (!fichas.length) {
    raiz.appendChild(vazio("Nenhuma avaliação lançada até agora.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Lançar a primeira", onclick: () => abrirFormularioAvaliacao(null, null, recarregar) })));
    return;
  }

  raiz.appendChild(
    el("div", { class: "grade" }, fichas.map((f) => {
      const dp = diferenca(f.ultima.peso, f.primeira.peso, " kg");
      const dg = diferenca(f.ultima.gordura, f.primeira.gordura, " pontos");
      const valorImc = imc(f.ultima.peso, f.ultima.altura);
      return el("article", { class: "ficha-cartao" }, [
        el("div", { class: "ficha-cartao__topo" }, [
          el("div", { style: "display:flex;align-items:center;gap:.55rem;min-width:0" }, [
            el("span", { class: "avatar avatar--peq", texto: iniciais(f.aluno.nome) }),
            el("div", { style: "min-width:0" }, [
              el("strong", { texto: f.aluno.nome || "Aluno" }),
              el("p", { class: "obs", texto: `${f.quantas} ${f.quantas === 1 ? "avaliação" : "avaliações"}, última em ${dataBr(f.ultima.data)}` }),
            ]),
          ]),
        ]),
        el("div", { class: "ficha-cartao__dados" }, [
          f.ultima.peso ? el("span", { class: "dado" }, [document.createTextNode("Peso"), el("strong", { texto: String(f.ultima.peso).replace(".", ",") + " kg" })]) : null,
          valorImc ? el("span", { class: "dado" }, [document.createTextNode("IMC"), el("strong", { texto: String(valorImc).replace(".", ",") })]) : null,
          f.ultima.gordura ? el("span", { class: "dado" }, [document.createTextNode("Gordura"), el("strong", { texto: String(f.ultima.gordura).replace(".", ",") + "%" })]) : null,
        ]),
        (dp || dg) ? el("div", { class: "ficha__etiquetas" }, [
          dp ? etiqueta(dp.texto + " no total", dp.tom) : null,
          dg ? etiqueta(dg.texto + " de gordura", dg.tom) : null,
        ]) : null,
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          el("button", { class: "bt bt--linha bt--peq", texto: "Ver evolução", onclick: () => abrirHistorico(f.alunoId, recarregar) }),
          el("button", { class: "bt bt--linha bt--peq", texto: "Nova medição", onclick: () => abrirFormularioAvaliacao(null, f.alunoId, recarregar) }),
        ]),
      ]);
    }))
  );
}
