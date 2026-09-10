/* Monta o painel, cuida do login e troca de tela */

import { DEMO, temSessao, meuPerfil, entrar, sair } from "./db.js";
import { el, limpar } from "./util.js";
import { aviso, carregando, fecharFolha } from "./ui.js";
import { estado } from "./estado.js";

import * as telaHoje from "./telas/hoje.js";
import * as telaAgenda from "./telas/agenda.js";
import * as telaAlunos from "./telas/alunos.js";
import * as telaFinanceiro from "./telas/financeiro.js";
import * as telaSolicitacoes from "./telas/solicitacoes.js";
import * as telaAjustes from "./telas/ajustes.js";

export const TELAS = [
  { id: "hoje", nome: "Hoje", modulo: telaHoje, icone: "M4 6h16M4 12h16M4 18h10" },
  { id: "agenda", nome: "Agenda", modulo: telaAgenda, icone: "M7 3v3M17 3v3M3 9h18M5 5h14v16H5z" },
  { id: "alunos", nome: "Alunos", modulo: telaAlunos, icone: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-6 8-6s8 2 8 6" },
  { id: "financeiro", nome: "Financeiro", modulo: telaFinanceiro, icone: "M3 7h18v12H3zM3 11h18M7 15h4" },
  { id: "solicitacoes", nome: "Pedidos", modulo: telaSolicitacoes, icone: "M4 5h16v11H8l-4 4z" },
  { id: "ajustes", nome: "Ajustes", modulo: telaAjustes, icone: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 12h2M18 12h2M12 4v2M12 18v2" },
];

/* ---------- login ---------- */

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

/* ---------- estrutura do painel ---------- */

function montarEstrutura() {
  const app = document.getElementById("app");
  limpar(app);

  const nomeEstudio = estado.perfil.estudio.nome;

  const barra = el("header", { class: "barra" }, [
    el("div", { class: "barra__interno" }, [
      el("div", { class: "barra__marca" }, [
        el("img", { src: "img/eletrofit-raio.png", alt: "" }),
        el("div", {}, [
          el("strong", { texto: nomeEstudio }),
          el("span", { texto: estado.perfil.nome }),
        ]),
      ]),
      DEMO ? el("span", { class: "selo-demo", texto: "Demonstração" }) : null,
      el("button", { class: "bt bt--linha bt--peq", texto: "Sair", onclick: async () => { await sair(); location.hash = ""; telaLogin(); } }),
    ]),
  ]);

  const menu = el("nav", { class: "menu", "aria-label": "Seções" },
    TELAS.map((t) =>
      el("a", { class: "menu__item", href: "#" + t.id, "data-tela": t.id }, [
        el("span", { class: "menu__icone", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${t.icone}"/></svg>` }),
        el("span", { class: "menu__nome", texto: t.nome }),
      ])
    )
  );

  const conteudo = el("main", { class: "conteudo", id: "conteudo" });

  app.append(barra, el("div", { class: "corpo" }, [menu, conteudo]));
}

function marcarMenu(id) {
  document.querySelectorAll(".menu__item").forEach((a) => {
    a.classList.toggle("ativo", a.dataset.tela === id);
  });
}

export async function irPara(id) {
  const tela = TELAS.find((t) => t.id === id) || TELAS[0];
  if (location.hash !== "#" + tela.id) {
    location.hash = tela.id;
    return; // o evento de hash chama de novo
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
  const alvo = (location.hash || "#hoje").slice(1);
  marcarMenu(alvo);
  await irPara(alvo);
}

window.addEventListener("hashchange", () => {
  if (!estado.perfil) return;
  irPara((location.hash || "#hoje").slice(1));
});

iniciar();
