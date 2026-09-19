/* Ficha do aluno: dados, saude, plano, historico e mensalidades.
   Usada pelas telas de alunos, hoje, agenda e financeiro. */

import {
  obterAluno, salvarAluno, matriculaDoAluno, salvarMatricula, encerrarMatricula,
  listarPlanos, sessoesDoAluno, cobrancasDoAluno, pagamentosDoAluno,
} from "../db.js";
import {
  el, dataBr, hora, dinheiro, telefoneBonito, linkWhats, primeiroNome,
  iniciais, idadeDe, iso,
  situacaoCobranca, periodoPorExtenso, precoDoPlano, rotuloPeriodicidade,
  periodicidadeDe, previsaoProximaCobranca,
} from "../util.js";
import {
  abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea,
  lerFormulario, aviso, confirmar, etiqueta, botaoComIcone,
} from "../ui.js";
import { abrirBaixa } from "./baixa.js";

export function textoLembrete(aluno, sessao) {
  return `Oi ${primeiroNome(aluno.nome)}, tudo bem? Passando para confirmar seu treino de ${dataBr(sessao.inicio)} às ${hora(sessao.inicio)} na Eletrofit. Pode confirmar para mim?`;
}

/* A mensagem muda conforme a cobranca ja venceu ou esta chegando,
   e nomeia o periodo certo: um mes no mensal, o intervalo no trimestral. */
export function textoCobranca(aluno, cobranca) {
  const s = situacaoCobranca(cobranca);
  const periodo = periodoPorExtenso(cobranca.competencia, cobranca.periodicidade);
  const mensal = periodicidadeDe(cobranca.periodicidade).meses === 1;
  const nome = mensal ? `Sua mensalidade de ${periodo}` : `Seu plano ${rotuloPeriodicidade(cobranca.periodicidade).toLowerCase()} de ${periodo}`;

  const meio = s.chave === "atrasada"
    ? `${nome} venceu dia ${dataBr(cobranca.vencimento)}`
    : s.dias === 0
      ? `${nome} vence hoje`
      : `${nome} vence dia ${dataBr(cobranca.vencimento)}`;

  return `Oi ${primeiroNome(aluno.nome)}, tudo bem? ${meio}, no valor de ${dinheiro(cobranca.valor)}. Qualquer dúvida é só chamar por aqui.`;
}

export function abrirWhats(telefone, mensagem) {
  const url = linkWhats(telefone, mensagem);
  if (!url) {
    aviso("Este aluno está sem telefone cadastrado.", "erro");
    return;
  }
  window.open(url, "_blank", "noopener");
}

/* ---------- formulario de cadastro e edicao ---------- */

export function abrirFormularioAluno(aluno, aoSalvar) {
  const novo = !aluno || !aluno.id;
  abrirFolha(novo ? "Novo aluno" : "Editar aluno", (corpo, fechar) => {
    const form = el("form", { class: "form" });
    form.append(
      campo("Nome completo", entradaTexto("nome", aluno?.nome || "", { required: true, placeholder: "Nome do aluno" })),
      el("div", { class: "form__par" }, [
        campo("Celular", entradaTexto("telefone", aluno?.telefone || "", { placeholder: "34990000000", inputmode: "tel" })),
        campo("Nascimento", entradaTexto("nascimento", aluno?.nascimento || "", { type: "date" })),
      ]),
      campo("E-mail", entradaTexto("email", aluno?.email || "", { type: "email", placeholder: "opcional" })),
      el("div", { class: "form__par" }, [
        campo("Objetivo", entradaSelecao("objetivo", [
          { valor: "", texto: "Não informado" },
          { valor: "Emagrecimento", texto: "Emagrecimento" },
          { valor: "Fortalecimento muscular", texto: "Fortalecimento muscular" },
          { valor: "Condicionamento físico", texto: "Condicionamento físico" },
          { valor: "Reabilitação ou alívio de dor", texto: "Reabilitação ou alívio de dor" },
        ], aluno?.objetivo || "")),
        campo("Situação", entradaSelecao("status", [
          { valor: "experimental", texto: "Experimental" },
          { valor: "ativo", texto: "Ativo" },
          { valor: "inativo", texto: "Inativo" },
        ], aluno?.status || "experimental")),
      ]),
      campo("Observações", entradaArea("observacoes", aluno?.observacoes || "", 2))
    );

    const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: novo ? "Cadastrar" : "Salvar" });
    form.appendChild(bt);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      if (!dados.nome.trim()) { aviso("Informe o nome.", "erro"); return; }
      if (!dados.nascimento) dados.nascimento = null;
      bt.disabled = true;
      try {
        const salvo = await salvarAluno(novo ? dados : { ...dados, id: aluno.id });
        aviso(novo ? "Aluno cadastrado." : "Dados salvos.");
        fechar();
        if (aoSalvar) aoSalvar(salvo);
      } catch (e) {
        aviso(e.message, "erro");
        bt.disabled = false;
      }
    });

    corpo.appendChild(form);
  });
}

/* ---------- ficha completa ---------- */

export async function abrirFicha(alunoId, aoMudar) {
  const aluno = await obterAluno(alunoId);
  if (!aluno) { aviso("Aluno não encontrado.", "erro"); return; }

  abrirFolha(aluno.nome, async (corpo, fechar) => {
    const recarregar = async () => { fechar(); await abrirFicha(alunoId, aoMudar); if (aoMudar) aoMudar(); };

    const [matricula, planos, sessoes, cobrancas, pagamentos] = await Promise.all([
      matriculaDoAluno(alunoId), listarPlanos({ apenasAtivos: true }),
      sessoesDoAluno(alunoId, 8), cobrancasDoAluno(alunoId, 12),
      pagamentosDoAluno(alunoId, 12),
    ]);

    const proxima = previsaoProximaCobranca(matricula, cobrancas);

    const idade = idadeDe(aluno.nascimento);

    /* cabecalho */
    corpo.appendChild(
      el("div", { class: "ficha__topo" }, [
        el("div", { class: "avatar", texto: iniciais(aluno.nome) }),
        el("div", {}, [
          el("div", { class: "ficha__etiquetas" }, [
            etiqueta(aluno.status === "ativo" ? "Ativo" : aluno.status === "experimental" ? "Experimental" : "Inativo",
              aluno.status === "ativo" ? "ok" : aluno.status === "experimental" ? "aviso" : "cinza"),
            aluno.saude_liberado ? etiqueta("Saúde liberada", "ok") : etiqueta("Saúde pendente", "erro"),
          ]),
          el("p", { class: "ficha__linha", texto: [telefoneBonito(aluno.telefone), idade ? idade + " anos" : "", aluno.objetivo].filter(Boolean).join("  ·  ") }),
        ]),
      ])
    );

    corpo.appendChild(
      el("div", { class: "linha-botoes linha-botoes--inicio" }, [
        botaoComIcone("whatsapp", "WhatsApp", () => abrirWhats(aluno.telefone, `Oi ${primeiroNome(aluno.nome)}, tudo bem?`), "bt--linha bt--peq"),
        el("button", { class: "bt bt--linha bt--peq", texto: "Editar dados", onclick: () => abrirFormularioAluno(aluno, recarregar) }),
      ])
    );

    /* saude */
    const blocoSaude = el("div", { class: "bloco" }, [
      el("h3", { class: "bloco__titulo", texto: "Ficha de saúde" }),
    ]);
    const formSaude = el("form", { class: "form" });
    const marcaLiberado = el("input", { type: "checkbox", name: "saude_liberado", class: "marcador" });
    marcaLiberado.checked = !!aluno.saude_liberado;
    formSaude.append(
      el("label", { class: "campo campo--marcador" }, [
        marcaLiberado,
        el("span", { texto: "Liberado para treinar" }),
      ]),
      campo("Restrições, uso de marca-passo, gravidez, lesões", entradaArea("saude_restricoes", aluno.saude_restricoes || "", 2)),
      el("button", { class: "bt bt--linha bt--peq", type: "submit", texto: "Salvar ficha de saúde" })
    );
    formSaude.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(formSaude);
      try {
        await salvarAluno({ id: aluno.id, saude_liberado: dados.saude_liberado, saude_restricoes: dados.saude_restricoes, saude_atualizado_em: iso(new Date()) });
        aviso("Ficha de saúde salva.");
        await recarregar();
      } catch (e) { aviso(e.message, "erro"); }
    });
    blocoSaude.appendChild(formSaude);
    if (aluno.saude_atualizado_em) {
      blocoSaude.appendChild(el("p", { class: "obs", texto: "Atualizada em " + dataBr(aluno.saude_atualizado_em) }));
    }
    corpo.appendChild(blocoSaude);

    /* plano */
    const blocoPlano = el("div", { class: "bloco" }, [el("h3", { class: "bloco__titulo", texto: "Plano" })]);
    if (matricula) {
      const per = matricula.periodicidade || "mensal";
      blocoPlano.appendChild(
        el("div", { class: "resumo-plano" }, [
          el("div", {}, [
            el("div", { class: "resumo-plano__nome" }, [
              el("strong", { texto: matricula.plano ? matricula.plano.nome : "Plano" }),
              etiqueta(rotuloPeriodicidade(per), "cinza"),
            ]),
            el("span", { texto: precoDoPlano(matricula.valor, per) }),
            el("span", { class: "obs", texto: `Cobrado ${periodicidadeDe(per).cadaCiclo}, sempre no dia ${matricula.dia_vencimento}` }),
          ]),
          el("button", {
            class: "bt bt--linha bt--peq", texto: "Encerrar",
            onclick: async () => {
              if (!(await confirmar("Encerrar o plano deste aluno? As mensalidades já geradas continuam registradas.", { rotuloOk: "Encerrar", perigo: true }))) return;
              await encerrarMatricula(matricula.id);
              aviso("Plano encerrado.");
              await recarregar();
            },
          }),
        ])
      );

      /* a proxima data de pagamento, em destaque */
      if (proxima) {
        const s = proxima.cobranca ? situacaoCobranca(proxima.cobranca) : null;
        blocoPlano.appendChild(
          el("div", { class: "proxima-cobranca proxima-cobranca--" + (s ? s.chave : "prevista") }, [
            el("span", { class: "proxima-cobranca__rotulo", texto: s ? s.rotulo : "Tudo em dia" }),
            el("strong", { texto: s && s.chave === "atrasada"
              ? `Venceu em ${dataBr(proxima.vencimento)}`
              : `Próxima cobrança em ${dataBr(proxima.vencimento)}` }),
            el("span", { class: "obs", texto: proxima.cobranca
              ? `${dinheiro(proxima.cobranca.valor)}, referente a ${periodoPorExtenso(proxima.cobranca.competencia, proxima.cobranca.periodicidade)}`
              : `${dinheiro(matricula.valor)} previstos, referente a ${periodoPorExtenso(proxima.competencia, per)}` }),
            proxima.cobranca && (s.chave === "atrasada" || s.chave === "proxima")
              ? botaoComIcone("whatsapp", s.chave === "atrasada" ? "Cobrar" : "Lembrar",
                  () => abrirWhats(aluno.telefone, textoCobranca(aluno, proxima.cobranca)), "bt--linha bt--peq")
              : null,
          ])
        );
      }
    } else {
      blocoPlano.appendChild(el("p", { class: "obs", texto: "Este aluno ainda não tem plano." }));
    }

    const formPlano = el("form", { class: "form form--linha" });
    const selecaoPlano = entradaSelecao("plano_id", planos.map((p) => ({
      valor: p.id,
      texto: `${p.nome}  ${rotuloPeriodicidade(p.periodicidade)}, ${dinheiro(p.valor)}`,
    })), matricula?.plano_id || "");

    /* a dica embaixo do seletor acompanha o plano escolhido */
    const dicaPlano = el("p", { class: "obs form__dica-larga" });
    const atualizarDica = () => {
      const p = planos.find((x) => x.id === selecaoPlano.value);
      dicaPlano.textContent = p
        ? `${precoDoPlano(p.valor, p.periodicidade)}. Cobrado ${periodicidadeDe(p.periodicidade).cadaCiclo}.`
        : "Cadastre um plano em Ajustes primeiro.";
    };
    selecaoPlano.addEventListener("change", atualizarDica);
    atualizarDica();

    formPlano.append(
      campo("Plano", selecaoPlano),
      campo("Dia do vencimento", entradaSelecao("dia_vencimento",
        Array.from({ length: 28 }, (_, i) => ({ valor: i + 1, texto: "Dia " + (i + 1) })), matricula?.dia_vencimento || 10)),
      el("button", { class: "bt bt--primario bt--peq", type: "submit", texto: matricula ? "Trocar" : "Definir" })
    );
    formPlano.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const dados = lerFormulario(formPlano);
      const plano = planos.find((p) => p.id === dados.plano_id);
      if (!plano) { aviso("Cadastre um plano em Ajustes primeiro.", "erro"); return; }
      try {
        await salvarMatricula({
          aluno_id: aluno.id, plano_id: plano.id,
          dia_vencimento: Number(dados.dia_vencimento),
          // copiada do plano, para uma mudanca de preco nao reescrever o passado
          periodicidade: plano.periodicidade || "mensal",
          valor: plano.valor,
        });
        if (aluno.status === "experimental") await salvarAluno({ id: aluno.id, status: "ativo" });
        aviso("Plano definido.");
        await recarregar();
      } catch (e) { aviso(e.message, "erro"); }
    });
    formPlano.appendChild(dicaPlano);
    blocoPlano.appendChild(formPlano);
    corpo.appendChild(blocoPlano);

    /* mensalidades */
    const blocoCob = el("div", { class: "bloco" }, [el("h3", { class: "bloco__titulo", texto: "Mensalidades" })]);
    if (!cobrancas.length) {
      blocoCob.appendChild(el("p", { class: "obs", texto: "Nenhuma mensalidade gerada ainda." }));
    } else {
      blocoCob.appendChild(
        el("ul", { class: "lista-simples" }, cobrancas.map((c) => {
          const s = situacaoCobranca(c);
          return el("li", {}, [
            el("div", {}, [
              el("strong", { texto: periodoPorExtenso(c.competencia, c.periodicidade) }),
              el("span", { texto: `${dinheiro(c.valor)}  ·  ${s.detalhe}` }),
            ]),
            etiqueta(s.rotulo, s.tom),
            c.status === "aberta"
              ? el("button", {
                  class: "bt bt--linha bt--peq", texto: "Dar baixa",
                  onclick: () => abrirBaixa(c, aluno, recarregar),
                })
              : null,
          ]);
        }))
      );
    }
    corpo.appendChild(blocoCob);

    /* historico de pagamentos: o que ja entrou, como e quando */
    const blocoPag = el("div", { class: "bloco" }, [el("h3", { class: "bloco__titulo", texto: "Histórico de pagamentos" })]);
    const valendo = pagamentos.filter((x) => !x.estornado);
    if (!pagamentos.length) {
      blocoPag.appendChild(el("p", { class: "obs", texto: "Nenhum pagamento registrado até agora." }));
    } else {
      const total = valendo.reduce((soma, x) => soma + Number(x.valor), 0);
      blocoPag.appendChild(el("p", { class: "obs", texto: `${valendo.length} pagamento${valendo.length === 1 ? "" : "s"}, somando ${dinheiro(total)}.` }));
      blocoPag.appendChild(
        el("ul", { class: "lista-simples" }, pagamentos.map((x) =>
          el("li", { class: x.estornado ? "estornado" : "" }, [
            el("div", {}, [
              el("strong", { texto: dataBr(x.pago_em) }),
              el("span", { texto: [x.forma, x.observacao].filter(Boolean).join("  ·  ") }),
            ]),
            el("span", { class: "lista-simples__valor", texto: dinheiro(x.valor) }),
            x.estornado ? etiqueta("Estornado", "cinza") : etiqueta("Recebido", "ok"),
          ])
        ))
      );
    }
    corpo.appendChild(blocoPag);

    /* historico */
    const blocoHist = el("div", { class: "bloco" }, [el("h3", { class: "bloco__titulo", texto: "Últimas sessões" })]);
    if (!sessoes.length) {
      blocoHist.appendChild(el("p", { class: "obs", texto: "Nenhuma sessão registrada." }));
    } else {
      blocoHist.appendChild(
        el("ul", { class: "lista-simples" }, sessoes.map((s) =>
          el("li", {}, [
            el("div", {}, [
              el("strong", { texto: `${dataBr(s.inicio)} às ${hora(s.inicio)}` }),
              el("span", { texto: s.intensidade || "Sem anotação de intensidade" }),
            ]),
            etiqueta(
              s.status === "realizada" ? "Feita" : s.status === "falta" ? "Falta" : s.status === "cancelada" ? "Cancelada" : "Agendada",
              s.status === "realizada" ? "ok" : s.status === "falta" ? "erro" : "cinza"
            ),
          ])
        ))
      );
    }
    corpo.appendChild(blocoHist);
  }, { largura: "larga" });
}
