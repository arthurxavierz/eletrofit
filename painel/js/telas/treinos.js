/* Protocolos de treino: o que cada estímulo faz, com que
   frequência e para qual objetivo. É a receita que a
   equipe segue dentro do estúdio. */

import { listarProtocolos, salvarProtocolo, removerProtocolo, sessoesEntre } from "../db.js";
import { el, limpar, somarDias, hoje } from "../util.js";
import {
  abrirFolha, campo, entradaTexto, entradaSelecao, entradaArea, lerFormulario,
  aviso, confirmar, vazio, etiqueta, cartaoNumero,
} from "../ui.js";
import { graficoBarrasH } from "../graficos.js";

const FOCOS = ["Adaptação", "Emagrecimento", "Fortalecimento", "Postura", "Recuperação", "Condicionamento"];

function formularioProtocolo(protocolo, aoSalvar) {
  const novo = !protocolo;
  abrirFolha(novo ? "Novo protocolo" : "Editar protocolo", (corpo, fechar) => {
    const form = el("form", { class: "form" });
    form.append(
      campo("Nome", entradaTexto("nome", protocolo?.nome || "", { required: true, placeholder: "Força, membros inferiores" })),
      el("div", { class: "form__par" }, [
        campo("Objetivo", entradaSelecao("foco", FOCOS.map((f) => ({ valor: f, texto: f })), protocolo?.foco || FOCOS[1])),
        campo("Duração", entradaSelecao("duracao", [15, 20, 25, 30, 45].map((v) => ({ valor: v, texto: v + " minutos" })), protocolo?.duracao || 25)),
      ]),
      el("div", { class: "form__trio" }, [
        campo("Frequência", entradaTexto("frequencia", protocolo?.frequencia ?? 75, { type: "number", min: 1, max: 150 }), "Hz"),
        campo("Largura de pulso", entradaTexto("largura_pulso", protocolo?.largura_pulso ?? 350, { type: "number", min: 50, max: 600 }), "microssegundos"),
        campo("Nível sugerido", entradaTexto("nivel", protocolo?.nivel || "5 a 7", { placeholder: "5 a 7" })),
      ]),
      campo("Como aplicar", entradaArea("descricao", protocolo?.descricao || "", 4), "Exercícios, séries e cuidados que a equipe precisa lembrar"),
      campo("Situação", entradaSelecao("ativo", [
        { valor: "true", texto: "Em uso" },
        { valor: "false", texto: "Fora de uso" },
      ], String(protocolo?.ativo ?? true))),
      el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: novo ? "Cadastrar protocolo" : "Salvar" })
    );
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const d = lerFormulario(form);
      try {
        await salvarProtocolo({
          id: protocolo?.id,
          nome: d.nome.trim(), foco: d.foco, duracao: Number(d.duracao),
          frequencia: Number(d.frequencia), largura_pulso: Number(d.largura_pulso),
          nivel: d.nivel.trim(), descricao: d.descricao, ativo: d.ativo === "true",
        });
        aviso("Protocolo salvo.");
        fechar();
        aoSalvar();
      } catch (e) { aviso(e.message, "erro"); }
    });
    corpo.appendChild(form);
  });
}

export async function montar(raiz) {
  const recarregar = () => montar(raiz);
  const base = hoje();
  const [protocolos, sessoes] = await Promise.all([
    listarProtocolos({}),
    sessoesEntre(somarDias(base, -90), somarDias(base, 1)),
  ]);

  const uso = {};
  sessoes.filter((s) => s.status === "realizada").forEach((s) => {
    if (!s.protocolo_id) return;
    uso[s.protocolo_id] = (uso[s.protocolo_id] || 0) + 1;
  });
  const usados = protocolos
    .map((p) => ({ rotulo: p.nome, valor: uso[p.id] || 0 }))
    .filter((x) => x.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  limpar(raiz);

  raiz.appendChild(
    el("div", { class: "tela__topo" }, [
      el("div", {}, [
        el("h1", { class: "tela__titulo", texto: "Treinos" }),
        el("p", { class: "tela__sub", texto: "Os protocolos que a equipe segue dentro do estúdio" }),
      ]),
      el("button", { class: "bt bt--primario", texto: "Novo protocolo", onclick: () => formularioProtocolo(null, recarregar) }),
    ])
  );

  raiz.appendChild(
    el("div", { class: "cartoes" }, [
      cartaoNumero({ rotulo: "Protocolos em uso", valor: String(protocolos.filter((p) => p.ativo).length), icone: "raio" }),
      cartaoNumero({ rotulo: "Treinos aplicados", valor: String(Object.values(uso).reduce((s, v) => s + v, 0)), icone: "certo", nota: "nos últimos noventa dias" }),
      cartaoNumero({
        rotulo: "Mais aplicado", icone: "subiu",
        valor: usados[0] ? String(usados[0].valor) : "0",
        nota: usados[0] ? usados[0].rotulo : "nenhum registro ainda",
      }),
      cartaoNumero({
        rotulo: "Sessões sem protocolo", icone: "sino",
        valor: String(sessoes.filter((s) => s.status === "realizada" && !s.protocolo_id).length),
        nota: "marque o protocolo ao registrar a presença",
      }),
    ])
  );

  if (usados.length > 1) {
    raiz.appendChild(graficoBarrasH(usados, {
      titulo: "Protocolos mais aplicados",
      sub: "Treinos registrados nos últimos noventa dias",
      formatar: (v) => String(v) + (v === 1 ? " treino" : " treinos"),
    }));
  }

  if (!protocolos.length) {
    raiz.appendChild(vazio("Nenhum protocolo cadastrado ainda.",
      el("button", { class: "bt bt--primario bt--peq", texto: "Cadastrar o primeiro", onclick: () => formularioProtocolo(null, recarregar) })));
    return;
  }

  raiz.appendChild(
    el("div", { class: "grade" }, protocolos.map((p) =>
      el("article", { class: "ficha-cartao" }, [
        el("div", { class: "ficha-cartao__topo" }, [
          el("div", { style: "min-width:0" }, [
            el("strong", { texto: p.nome }),
            el("p", { class: "obs", texto: p.foco }),
          ]),
          p.ativo ? etiqueta("Em uso", "ok") : etiqueta("Fora de uso", ""),
        ]),
        el("div", { class: "ficha-cartao__dados" }, [
          el("span", { class: "dado" }, [document.createTextNode("Duração"), el("strong", { texto: (p.duracao || 25) + " min" })]),
          el("span", { class: "dado" }, [document.createTextNode("Frequência"), el("strong", { texto: (p.frequencia || 0) + " Hz" })]),
          el("span", { class: "dado" }, [document.createTextNode("Pulso"), el("strong", { texto: (p.largura_pulso || 0) + " µs" })]),
          el("span", { class: "dado" }, [document.createTextNode("Nível"), el("strong", { texto: p.nivel || "livre" })]),
        ]),
        p.descricao ? el("p", { class: "ficha-cartao__texto", texto: p.descricao }) : null,
        el("p", { class: "obs", texto: uso[p.id] ? `Aplicado ${uso[p.id]} ${uso[p.id] === 1 ? "vez" : "vezes"} nos últimos noventa dias.` : "Ainda não foi aplicado no período." }),
        el("div", { class: "linha-botoes linha-botoes--inicio" }, [
          el("button", { class: "bt bt--linha bt--peq", texto: "Editar", onclick: () => formularioProtocolo(p, recarregar) }),
          el("button", {
            class: "bt bt--perigo bt--peq", texto: "Apagar",
            onclick: async () => {
              if (!(await confirmar(`Apagar o protocolo ${p.nome}? As sessões já registradas continuam como estão.`, { rotuloOk: "Apagar", perigo: true }))) return;
              await removerProtocolo(p.id);
              aviso("Protocolo apagado.");
              recarregar();
            },
          }),
        ]),
      ])
    ))
  );
}
