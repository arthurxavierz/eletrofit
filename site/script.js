/* Eletrofit Estúdio, interações */
(function () {
  "use strict";

  /* ---------- Navbar: invisível sobre o topo, barra preta depois ---------- */
  var nav = document.getElementById("nav");
  var hero = document.getElementById("inicio");
  var setSolid = function (solid) {
    nav.classList.toggle("solid", solid);
  };
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        setSolid(!entries[0].isIntersecting);
      },
      { rootMargin: "-76px 0px 0px 0px", threshold: 0 }
    ).observe(hero);
  } else if (hero) {
    var onScroll = function () {
      setSolid(window.scrollY > hero.offsetHeight - 76);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menu mobile ---------- */
  var toggle = document.getElementById("navToggle");
  var mobile = document.getElementById("navMobile");
  var closeMenu = function () {
    toggle.classList.remove("open");
    mobile.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };
  toggle.addEventListener("click", function () {
    var open = mobile.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  mobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------- Stagger: atrasa cada filho de .js-stagger ---------- */
  document.querySelectorAll(".js-stagger").forEach(function (group) {
    group.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.setProperty("--rd", (i * 0.08).toFixed(2) + "s");
    });
  });

  /* ---------- Reveal ao entrar na viewport ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ---------- Dúvidas: abre uma por vez ---------- */
  var qas = document.querySelectorAll(".qa");
  qas.forEach(function (qa) {
    qa.addEventListener("toggle", function () {
      if (!qa.open) return;
      qas.forEach(function (outro) {
        if (outro !== qa) outro.open = false;
      });
    });
  });

  /* ---------- Máscara simples de telefone ---------- */
  var tel = document.getElementById("f-celular");
  if (tel) {
    tel.addEventListener("input", function () {
      var d = tel.value.replace(/\D/g, "").slice(0, 11);
      var out = d;
      if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length > 6) {
        var corte = d.length > 10 ? 7 : 6;
        out = "(" + d.slice(0, 2) + ") " + d.slice(2, corte) + "-" + d.slice(corte);
      }
      tel.value = out;
    });
  }

  /* ---------- Registra o pedido no painel, quando configurado ---------- */
  var registrarPedido = function (dados) {
    var cfg = window.ELETROFIT_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !cfg.ESTUDIO_ID) return;
    try {
      fetch(cfg.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/solicitacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.SUPABASE_ANON_KEY,
          Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          estudio_id: cfg.ESTUDIO_ID,
          nome: dados.nome,
          telefone: dados.celular,
          objetivo: dados.objetivo,
          periodo: dados.periodo,
          origem: "site",
          status: "nova"
        }),
        keepalive: true
      }).catch(function () { /* sem internet, o WhatsApp ja resolve */ });
    } catch (e) { /* nada a fazer, o WhatsApp continua funcionando */ }
  };

  /* ---------- Formulário: envio para o WhatsApp ---------- */
  var form = document.getElementById("agendarForm");
  if (form) {
    var WHATS = "5534991208519"; // (34) 99120-8519 com DDI 55
    var okMsg = document.getElementById("agendarOk");

    var fieldOf = function (id) {
      return document.getElementById(id).closest(".field");
    };
    var valOf = function (id) {
      return (document.getElementById(id).value || "").trim();
    };
    var setErr = function (field, msg) {
      if (!field) return;
      field.classList.add("field--error");
      var e = field.querySelector("[data-err]");
      if (e) e.textContent = msg;
      var inp = field.querySelector("input,select");
      if (inp) inp.setAttribute("aria-invalid", "true");
    };
    var clearErr = function (field) {
      if (!field) return;
      field.classList.remove("field--error");
      var e = field.querySelector("[data-err]");
      if (e) e.textContent = "";
      var inp = field.querySelector("input,select");
      if (inp) inp.removeAttribute("aria-invalid");
    };

    form.querySelectorAll("input,select").forEach(function (inp) {
      var handler = function () {
        clearErr(inp.closest(".field"));
        if (okMsg) okMsg.hidden = true;
      };
      inp.addEventListener("input", handler);
      inp.addEventListener("change", handler);
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      var nome = valOf("f-nome");
      var celular = valOf("f-celular");
      var objetivo = valOf("f-objetivo");
      var periodo = valOf("f-periodo");

      var ok = true;
      if (!nome) { setErr(fieldOf("f-nome"), "Informe o seu nome."); ok = false; }
      if (!celular) { setErr(fieldOf("f-celular"), "Informe o seu celular."); ok = false; }
      else if (celular.replace(/\D/g, "").length < 10) { setErr(fieldOf("f-celular"), "Digite um número com DDD."); ok = false; }
      if (!objetivo) { setErr(fieldOf("f-objetivo"), "Escolha o seu objetivo."); ok = false; }
      if (!periodo) { setErr(fieldOf("f-periodo"), "Escolha um período."); ok = false; }

      if (!ok) {
        var first = form.querySelector(".field--error");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var linhas = [
        "Olá, Eletrofit! Quero agendar uma aula experimental.",
        "",
        "Nome: " + nome,
        "Celular: " + celular,
        "Objetivo: " + objetivo,
        "Melhor período: " + periodo
      ];

      var url = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(linhas.join("\n"));

      registrarPedido({ nome: nome, celular: celular, objetivo: objetivo, periodo: periodo });

      if (okMsg) okMsg.hidden = false;
      window.open(url, "_blank", "noopener");
    });
  }
})();
