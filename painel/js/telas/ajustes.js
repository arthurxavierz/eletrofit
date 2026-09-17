/* Como o estúdio funciona: horário, capacidade, metas
   e o estado do sistema. Os planos ganharam tela própria. */

import { salvarEstudio, DEMO, reiniciarDemo, listarAlunos, listarPlanos, listarProtocolos, listarModelos } from "../db.js";
import { el, limpar, DIAS } from "../util.js";
import { campo, entradaTexto, entradaSelecao, lerFormulario, aviso, confirmar } from "../ui.js";
import { estado } from "../estado.js";

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const estudio = estado.perfil.estudio;
  const [alunos, planos, protocolos, modelos] = await Promise.all([
    listarAlunos({}), listarPlanos({}), listarProtocolos({}), listarModelos(),
  ]);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Ajustes" }),
        el("p", { class: "tela__sub", texto: "Como o estúdio funciona no dia a dia" }),
      ]),
    ])
  );

  /* ---------- dados do estúdio ---------- */
  const bloco = el("section", { class: "bloco" }, [el("h2", { class: "bloco__titulo", texto: "Estúdio" })]);
  const form = el("form", { class: "form" });
  form.append(
    campo("Nome", entradaTexto("nome", estudio.nome || "")),
    el("div", { class: "form__par" }, [
      campo("WhatsApp", entradaTexto("whatsapp", estudio.whatsapp || ""), "Com DDI e DDD, só números"),
      campo("Alunos ao mesmo tempo", entradaTexto("capacidade", estudio.capacidade ?? 2, { type: "number", min: 1, max: 20 }), "Quantos coletes atendem juntos"),
    ]),
    campo("Endereço", entradaTexto("endereco", estudio.endereco || "")),
    el("div", { class: "form__par" }, [
      campo("Duração da sessão", entradaSelecao("duracao_padrao", [20, 25, 30, 45, 60].map((v) => ({ valor: v, texto: v + " minutos" })), estudio.duracao_padrao || 30)),
      campo("Intervalo de recuperação", entradaSelecao("intervalo_recuperacao", [0, 12, 24, 36, 48, 72].map((v) => ({ valor: v, texto: v ? v + " horas" : "Sem controle" })), estudio.intervalo_recuperacao ?? 24), "O painel avisa se marcar antes disso"),
    ]),
    el("div", { class: "form__par" }, [
      campo("Abre às", entradaTexto("abre", (estudio.abre || "07:00").slice(0, 5), { type: "time" })),
      campo("Fecha às", entradaTexto("fecha", (estudio.fecha || "20:30").slice(0, 5), { type: "time" })),
    ])
  );

  const marcados = new Set((estudio.dias_semana || []).map(Number));
  const dias = el("div", { class: "dias" }, DIAS.map((nome, i) => {
    const marca = el("input", { type: "checkbox", class: "marcador", value: i });
    marca.checked = marcados.has(i);
    return el("label", { class: "dias__item" }, [marca, el("span", { texto: nome.slice(0, 3) })]);
  }));
  form.appendChild(el("div", { class: "campo" }, [el("span", { class: "campo__rotulo", texto: "Dias de atendimento" }), dias]));

  form.appendChild(el("p", { class: "bloco__titulo", style: "margin:.6rem 0 0", texto: "Metas do mês" }));
  form.appendChild(
    el("div", { class: "form__par" }, [
      campo("Meta de faturamento", entradaTexto("meta_faturamento", estudio.meta_faturamento ?? 0, { type: "number", min: 0, step: "50" }), "Aparece como barra no painel"),
      campo("Meta de alunos", entradaTexto("meta_alunos", estudio.meta_alunos ?? 0, { type: "number", min: 0 }), "Quantos alunos com plano ativo você quer chegar"),
    ])
  );

  const bt = el("button", { class: "bt bt--primario", type: "submit", texto: "Salvar ajustes" });
  form.appendChild(bt);

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const escolhidos = [...dias.querySelectorAll("input:checked")].map((i) => Number(i.value));
    bt.disabled = true;
    try {
      const salvo = await salvarEstudio({
        nome: d.nome, whatsapp: d.whatsapp, endereco: d.endereco,
        capacidade: Number(d.capacidade), duracao_padrao: Number(d.duracao_padrao),
        intervalo_recuperacao: Number(d.intervalo_recuperacao),
        abre: d.abre, fecha: d.fecha, dias_semana: escolhidos,
        meta_faturamento: Number(d.meta_faturamento), meta_alunos: Number(d.meta_alunos),
      });
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

  /* ---------- o que já está cadastrado ---------- */
  raiz.appendChild(
    el("section", { class: "bloco" }, [
      el("h2", { class: "bloco__titulo", texto: "O que já está cadastrado" }),
      el("div", { class: "ficha-cartao__dados" }, [
        el("span", { class: "dado" }, [document.createTextNode("Alunos"), el("strong", { texto: String(alunos.length) })]),
        el("span", { class: "dado" }, [document.createTextNode("Planos"), el("strong", { texto: String(planos.length) })]),
        el("span", { class: "dado" }, [document.createTextNode("Protocolos"), el("strong", { texto: String(protocolos.length) })]),
        el("span", { class: "dado" }, [document.createTextNode("Modelos de mensagem"), el("strong", { texto: String(modelos.length) })]),
      ]),
      el("div", { class: "linha-botoes linha-botoes--inicio" }, [
        el("a", { class: "bt bt--linha bt--peq", href: "#planos", texto: "Planos" }),
        el("a", { class: "bt bt--linha bt--peq", href: "#treinos", texto: "Protocolos de treino" }),
        el("a", { class: "bt bt--linha bt--peq", href: "#comunicacao", texto: "Modelos de mensagem" }),
      ]),
    ])
  );

  /* ---------- sistema ---------- */
  const blocoSistema = el("section", { class: "bloco" }, [el("h2", { class: "bloco__titulo", texto: "Sistema" })]);
  if (DEMO) {
    blocoSistema.append(
      el("p", { class: "obs", texto: "O painel está em modo demonstração. Os dados são de exemplo e ficam guardados apenas neste navegador. Para usar de verdade, preencha o arquivo config.js com os dados do Supabase." }),
      el("div", { class: "linha-botoes linha-botoes--inicio" }, [
        el("button", {
          class: "bt bt--linha bt--peq", texto: "Recarregar dados de exemplo",
          onclick: async () => {
            if (!(await confirmar("Apagar as alterações e voltar aos dados de exemplo?", { rotuloOk: "Recarregar", perigo: true }))) return;
            reiniciarDemo();
            aviso("Dados de exemplo recarregados.");
            location.reload();
          },
        }),
      ])
    );
  } else {
    blocoSistema.append(
      el("p", { class: "obs", texto: "Painel ligado ao banco de dados. Cada usuário enxerga apenas o próprio estúdio." }),
      el("p", { class: "obs", texto: "ID do estúdio: " + (estudio.id || "") })
    );
  }
  raiz.appendChild(blocoSistema);
}
