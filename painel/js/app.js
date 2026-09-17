/* Monta o painel, cuida da entrada e da troca de tela */

import { DEMO, temSessao, meuPerfil, entrar, sair, listarSolicitacoes, cobrancasEmAberto } from "./db.js";
import { el, limpar, iso, hoje } from "./util.js";
import { aviso, carregando, fecharFolha, icone } from "./ui.js";
import { estado } from "./estado.js";

import * as telaPainel from "./telas/painel.js";
import * as telaHoje from "./telas/hoje.js";
import * as telaAgenda from "./telas/agenda.js";
import * as telaAlunos from "./telas/alunos.js";
import * as telaAvaliacoes from "./telas/avaliacoes.js";
import * as telaTreinos from "./telas/treinos.js";
import * as telaFinanceiro from "./telas/financeiro.js";
import * as telaPlanos from "./telas/planos.js";
import * as telaSolicitacoes from "./telas/solicitacoes.js";
import * as telaComunicacao from "./telas/comunicacao.js";
import * as telaRelatorios from "./telas/relatorios.js";
import * as telaAjustes from "./telas/ajustes.js";

export const TELAS = [
  { id: "painel", nome: "Painel", grupo: "Acompanhar", icone: "painel", modulo: telaPainel },
  { id: "hoje", nome: "Hoje", grupo: "Acompanhar", icone: "relogio", modulo: telaHoje },
  { id: "agenda", nome: "Agenda", grupo: "Rotina", icone: "calendario", modulo: telaAgenda },
  { id: "alunos", nome: "Alunos", grupo: "Rotina", icone: "pessoas", modulo: telaAlunos },
  { id: "avaliacoes", nome: "Avaliações", grupo: "Rotina", icone: "regua", modulo: telaAvaliacoes },
  { id: "treinos", nome: "Treinos", grupo: "Rotina", icone: "raio", modulo: telaTreinos },
  { id: "financeiro", nome: "Financeiro", grupo: "Dinheiro", icone: "dinheiro", modulo: telaFinanceiro, marca: "atrasadas" },
  { id: "planos", nome: "Planos", grupo: "Dinheiro", icone: "etiquetaIcone", modulo: telaPlanos },
  { id: "solicitacoes", nome: "Pedidos", grupo: "Crescer", icone: "balao", modulo: telaSolicitacoes, marca: "pedidos" },
  { id: "comunicacao", nome: "Comunicação", grupo: "Crescer", icone: "whatsapp", modulo: telaComunicacao },
  { id: "relatorios", nome: "Relatórios", grupo: "Crescer", icone: "relatorio", modulo: telaRelatorios },
  { id: "ajustes", nome: "Ajustes", grupo: "Sistema", icone: "engrenagem", modulo: telaAjustes },
];

const ATALHOS = ["painel", "hoje", "agenda", "alunos", "financeiro"];
const GRUPOS = ["Acompanhar", "Rotina", "Dinheiro", "Crescer", "Sistema"];

/* ---------- entrada ---------- */

function telaLogin() {
  const app = document.getElementById("app");
  limpar(app);

  const form = el("form", { class: "login__form" });
  const email = el("input", { class: "entrada", type: "email", name: "email", placeholder: "seu@email.com", autocomplete: "email" });
  const senha = el("input", { class: "entrada", type: "password", name: "senha", placeholder: "Sua senha", autocomplete: "current-password" });
  const erro = el("p", { class: "login__erro", hidden: true });
  const bt = el("button", { class: "bt bt--primario bt--cheio", type: "submit", texto: "Entrar" });

  form.append(
    el("label", { class: "campo" }, [el("span", { class: "campo__rotulo", texto: "E-mail" }), email]),
    el("label", { class: "campo" }, [el("span", { class: "campo__rotulo", texto: "Senha" }), senha]),
    erro,
    bt
  );

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    erro.hidden = true;
    bt.disabled = true;
    bt.textContent = "Entrando";
    try {
      await entrar(email.value.trim(), senha.value);
      await iniciar();
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
      bt.disabled = false;
      bt.textContent = "Entrar";
    }
  });

  app.appendChild(
    el("div", { class: "login" }, [
      el("span", { class: "login__brilho", "aria-hidden": "true" }),
      el("div", { class: "login__caixa" }, [
        el("img", { class: "login__marca", src: "img/eletrofit-raio.png", alt: "Eletrofit" }),
        el("div", { class: "login__marca-nome", "aria-hidden": "true" }, [
          el("span", { texto: "ELETRO" }),
          el("span", { class: "ouro", texto: "FIT" }),
        ]),
        el("h1", { class: "login__titulo", texto: "Painel do estúdio" }),
        el("p", { class: "login__texto", texto: DEMO
          ? "Modo demonstração. Entre com qualquer e-mail e senha para conhecer o painel."
          : "Entre com o e-mail cadastrado no sistema." }),
        form,
      ]),
      el("p", { class: "login__rodape", texto: "Eletrofit Estúdio, Patrocínio MG" }),
    ])
  );

  if (DEMO) {
    email.value = "demonstracao@eletrofit.com";
    senha.value = "demonstracao";
  }
}

/* ---------- estrutura ---------- */

function itemDeMenu(t) {
  return el("a", { class: "menu__item", href: "#" + t.id, "data-tela": t.id }, [
    el("span", { class: "menu__icone", html: svgDoIcone(t.icone) }),
    el("span", { class: "menu__nome", texto: t.nome }),
    t.marca ? el("span", { class: "menu__marca", "data-marca": t.marca, hidden: true }) : null,
  ]);
}

function svgDoIcone(nome) {
  const base = icone(nome, 20);
  return base.innerHTML || "";
}

function abrirLateral(abrir) {
  const lateral = document.querySelector(".lateral");
  const cortina = document.querySelector(".lateral__cortina");
  if (!lateral) return;
  lateral.classList.toggle("aberta", abrir);
  if (cortina) cortina.classList.toggle("visivel", abrir);
  document.body.classList.toggle("travado", abrir && window.innerWidth < 1024);
}

function montarEstrutura() {
  const app = document.getElementById("app");
  limpar(app);

  const nomeEstudio = estado.perfil.estudio.nome;

  const cortina = el("div", { class: "lateral__cortina", onclick: () => abrirLateral(false) });

  const lateral = el("aside", { class: "lateral", "aria-label": "Seções do painel" }, [
    el("div", { class: "lateral__marca" }, [
      el("img", { src: "img/eletrofit-raio.png", alt: "" }),
      el("div", { class: "lateral__nome", "aria-hidden": "true" }, [
        el("span", { texto: "ELETRO" }),
        el("span", { class: "ouro", texto: "FIT" }),
      ]),
      el("button", { class: "lateral__x", "aria-label": "Fechar menu", texto: "×", onclick: () => abrirLateral(false) }),
    ]),
    ...GRUPOS.map((g) =>
      el("div", { class: "lateral__grupo" }, [
        el("p", { class: "lateral__titulo", texto: g }),
        el("nav", { class: "menu" }, TELAS.filter((t) => t.grupo === g).map(itemDeMenu)),
      ])
    ),
    el("div", { class: "lateral__rodape" }, [
      el("div", { class: "lateral__usuario" }, [
        el("span", { class: "avatar avatar--peq avatar--ouro", texto: (estado.perfil.nome || "E")[0].toUpperCase() }),
        el("div", {}, [
          el("strong", { texto: estado.perfil.nome }),
          el("span", { texto: estado.perfil.papel === "dono" ? "Dono do estúdio" : "Equipe" }),
        ]),
      ]),
      el("button", {
        class: "bt bt--linha bt--peq bt--cheio", texto: "Sair",
        onclick: async () => { await sair(); location.hash = ""; telaLogin(); },
      }),
    ]),
  ]);

  const busca = el("input", { class: "entrada", type: "search", placeholder: "Buscar aluno", "aria-label": "Buscar aluno" });
  busca.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();
    const termo = busca.value.trim();
    if (!termo) return;
    telaAlunos.definirBusca(termo);
    busca.value = "";
    irPara("alunos");
  });

  const barra = el("header", { class: "barra" }, [
    el("div", { class: "barra__interno" }, [
      el("button", { class: "barra__menu", "aria-label": "Abrir menu", onclick: () => abrirLateral(true) }, [icone("bolinhas", 20)]),
      el("div", { class: "barra__marca" }, [
        el("img", { src: "img/eletrofit-raio.png", alt: "" }),
        el("div", {}, [
          el("strong", { texto: nomeEstudio }),
          el("span", { texto: estado.perfil.nome }),
        ]),
      ]),
      el("div", { class: "barra__busca" }, [icone("busca", 16), busca]),
      DEMO ? el("span", { class: "selo-demo", texto: "Demonstração" }) : null,
    ]),
  ]);

  const conteudo = el("main", { class: "conteudo", id: "conteudo" });

  const atalhos = el("nav", { class: "atalhos", "aria-label": "Atalhos" },
    ATALHOS.map((id) => {
      const t = TELAS.find((x) => x.id === id);
      return el("a", { class: "atalhos__item", href: "#" + t.id, "data-tela": t.id }, [
        el("span", { class: "menu__icone", html: svgDoIcone(t.icone) }),
        el("span", { texto: t.nome }),
        t.marca ? el("span", { class: "atalhos__bolha", "data-marca": t.marca, hidden: true }) : null,
      ]);
    }).concat([
      el("button", { class: "atalhos__item", onclick: () => abrirLateral(true) }, [
        el("span", { class: "menu__icone", html: svgDoIcone("bolinhas") }),
        el("span", { texto: "Mais" }),
      ]),
    ])
  );

  app.append(cortina, lateral, barra, el("div", { class: "corpo" }, [conteudo]), atalhos);

  lateral.addEventListener("click", (ev) => {
    if (ev.target.closest(".menu__item") && window.innerWidth < 1024) abrirLateral(false);
  });
}

function marcarMenu(id) {
  document.querySelectorAll("[data-tela]").forEach((a) => {
    a.classList.toggle("ativo", a.dataset.tela === id);
  });
}

/* contadores de pendência que aparecem ao lado do nome da seção */
export async function atualizarMarcas() {
  try {
    const [pedidos, abertas] = await Promise.all([listarSolicitacoes("nova"), cobrancasEmAberto()]);
    const hojeIso = iso(hoje());
    const contas = {
      pedidos: pedidos.length,
      atrasadas: abertas.filter((c) => c.vencimento < hojeIso).length,
    };
    document.querySelectorAll("[data-marca]").forEach((e) => {
      const n = contas[e.dataset.marca] || 0;
      if (e.classList.contains("atalhos__bolha")) {
        e.hidden = n === 0;
      } else {
        e.textContent = n > 99 ? "99+" : String(n);
        e.hidden = n === 0;
      }
    });
  } catch (e) {
    /* contador é enfeite, se falhar o painel segue funcionando */
  }
}

export async function irPara(id) {
  const tela = TELAS.find((t) => t.id === id) || TELAS[0];
  if (location.hash !== "#" + tela.id) {
    location.hash = tela.id;
    return; /* o evento de hash chama de novo */
  }
  marcarMenu(tela.id);
  fecharFolha();
  const conteudo = document.getElementById("conteudo");
  if (!conteudo) return;
  carregando(conteudo);
  try {
    await tela.modulo.montar(conteudo);
  } catch (e) {
    limpar(conteudo).appendChild(
      el("div", { class: "vazio" }, [
        el("p", { texto: "Não foi possível carregar esta tela." }),
        el("p", { class: "vazio__detalhe", texto: e.message }),
      ])
    );
    aviso(e.message, "erro");
  }
  conteudo.scrollTop = 0;
  window.scrollTo(0, 0);
  atualizarMarcas();
}

async function iniciar() {
  try {
    if (!(await temSessao())) {
      telaLogin();
      return;
    }
    estado.perfil = await meuPerfil();
  } catch (e) {
    telaLogin();
    aviso(e.message, "erro");
    return;
  }
  montarEstrutura();
  const alvo = (location.hash || "#painel").slice(1);
  marcarMenu(alvo);
  await irPara(alvo);
}

window.addEventListener("hashchange", () => {
  if (!estado.perfil) return;
  irPara((location.hash || "#painel").slice(1));
});

iniciar();
