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
    mobile.hidden = true;
    mobile.inert = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };
  toggle.addEventListener("click", function () {
    var open = mobile.classList.toggle("open");
    mobile.hidden = !open;
    mobile.inert = !open;
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  mobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !mobile.hidden) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (!mobile.hidden && !nav.contains(e.target)) closeMenu();
  });
  window.matchMedia("(min-width:960px)").addEventListener("change", function (e) {
    if (e.matches) closeMenu();
  });

  /* Marca a seção visível sem interferir na navegação por âncoras. */
  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
          if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ---------- Stagger: atrasa cada filho de .js-stagger ---------- */
  document.querySelectorAll(".js-stagger").forEach(function (group) {
    group.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.setProperty("--rd", (i * 0.08).toFixed(2) + "s");
    });
  });

  /* ---------- Reveal ao entrar na viewport ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("motion-ready");
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

  /* Galeria: o link continua abrindo a foto se dialog não estiver disponível. */
  var gallery = document.getElementById("galleryDialog");
  var photos = Array.from(document.querySelectorAll("[data-gallery]"));
  var photoIndex = 0;
  var photoTrigger = null;
  var showPhoto = function (index) {
    photoIndex = (index + photos.length) % photos.length;
    var source = photos[photoIndex].querySelector("img");
    var target = document.getElementById("galleryImage");
    target.src = photos[photoIndex].href;
    target.alt = source.alt;
    document.getElementById("galleryCount").textContent = (photoIndex + 1) + " / " + photos.length;
    document.getElementById("galleryCaption").textContent = source.alt;
  };
  if (gallery && typeof gallery.showModal === "function") {
    photos.forEach(function (link, index) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        photoTrigger = link;
        showPhoto(index);
        gallery.showModal();
        document.body.classList.add("gallery-open");
      });
    });
    document.getElementById("galleryClose").addEventListener("click", function () { gallery.close(); });
    document.getElementById("galleryPrev").addEventListener("click", function () { showPhoto(photoIndex - 1); });
    document.getElementById("galleryNext").addEventListener("click", function () { showPhoto(photoIndex + 1); });
    gallery.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        showPhoto(photoIndex + (e.key === "ArrowRight" ? 1 : -1));
      }
    });
    gallery.addEventListener("click", function (e) {
      if (e.target !== gallery) return;
      var rect = gallery.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) gallery.close();
    });
    gallery.addEventListener("close", function () {
      document.body.classList.remove("gallery-open");
      if (photoTrigger) photoTrigger.focus({ preventScroll: true });
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
  var loadMap = document.getElementById("loadMap");
  if (loadMap) loadMap.addEventListener("click", function () {
    var map = document.getElementById("studioMap");
    map.src = map.dataset.src;
    map.hidden = false;
    document.querySelector(".map-external").focus({ preventScroll: true });
    document.getElementById("mapPreview").hidden = true;
  });

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


  /* =====================================================
     Agenda da aula experimental

     Mostra os dias de atendimento e os horários livres.
     Com o config.js preenchido, a ocupação vem do painel
     (só horários, nunca nomes). Vazio, usa o horário padrão
     do estúdio, e o pedido segue pelo WhatsApp como antes.
     ===================================================== */
  var WHATS = "5534991208519"; // (34) 99120-8519 com DDI 55
  var DIAS_SEM = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  var DIAS_NOME = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var MESES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  var DIAS_A_FRENTE = 21;
  var ANTECEDENCIA_MIN = 2; // horas entre agora e a aula mais cedo que dá para pedir
  var DEMO_CHAVE = "eletrofit.demo.v2";

  var cfg = window.ELETROFIT_CONFIG || {};
  var conectado = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.ESTUDIO_ID);
  var apiBase = conectado ? cfg.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" : "";
  var apiHeaders = conectado ? {
    "Content-Type": "application/json",
    apikey: cfg.SUPABASE_ANON_KEY,
    Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY
  } : null;

  var pad = function (n) { return String(n).padStart(2, "0"); };
  var isoDia = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var hhmm = function (min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); };
  var paraMin = function (t) { var p = String(t || "0:0").split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); };
  var quandoTexto = function (dia, hora) {
    var d = new Date(dia + "T12:00:00");
    return DIAS_NOME[d.getDay()] + ", " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " às " + hora;
  };

  /* Demonstração: o painel local guarda os dados no navegador.
     Ler e escrever lá deixa testar o fluxo inteiro sem banco. */
  var lerDemo = function () {
    try { var b = localStorage.getItem(DEMO_CHAVE); return b ? JSON.parse(b) : null; } catch (e) { return null; }
  };
  var gravarDemo = function (d) {
    try { localStorage.setItem(DEMO_CHAVE, JSON.stringify(d)); } catch (e) { /* segue sem gravar */ }
  };

  var PADRAO = { abre: "07:00", fecha: "20:30", dias_semana: [1, 2, 3, 4, 5], duracao: 30, capacidade: 2, ocupados: [] };

  var carregarAgenda = function () {
    if (conectado) {
      return fetch(apiBase + "rpc/agenda_publica", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ p_estudio: cfg.ESTUDIO_ID, p_de: isoDia(new Date()), p_dias: DIAS_A_FRENTE })
      }).then(function (r) {
        if (!r.ok) throw new Error("agenda " + r.status);
        return r.json();
      });
    }
    var demo = lerDemo();
    if (demo && demo.estudio) {
      var e = demo.estudio;
      var ocupados = (demo.sessoes || [])
        .filter(function (s) { return s.status === "agendada" || s.status === "realizada"; })
        .map(function (s) { return { inicio: s.inicio, duracao: s.duracao || 30 }; });
      (demo.solicitacoes || []).forEach(function (q) {
        if (q.status === "nova" && q.data_desejada && q.horario_desejado) {
          ocupados.push({ inicio: new Date(q.data_desejada + "T" + String(q.horario_desejado).slice(0, 5) + ":00").toISOString(), duracao: e.duracao_padrao || 30 });
        }
      });
      if (e.agenda_no_site === false) return Promise.resolve(null);
      return Promise.resolve({
        abre: String(e.abre || "07:00").slice(0, 5), fecha: String(e.fecha || "20:30").slice(0, 5),
        dias_semana: e.dias_semana || PADRAO.dias_semana, duracao: e.duracao_padrao || 30,
        capacidade: e.capacidade || 2, ocupados: ocupados
      });
    }
    return Promise.resolve(PADRAO);
  };

  /* Monta os dias e, em cada dia, os horários com vaga */
  var montarGrade = function (ag) {
    var agora = new Date();
    var limite = new Date(agora.getTime() + ANTECEDENCIA_MIN * 36e5);
    var abre = paraMin(ag.abre), fecha = paraMin(ag.fecha);
    var dur = Number(ag.duracao) || 30;
    var cap = Math.max(1, Number(ag.capacidade) || 1);
    var diasAbertos = (ag.dias_semana || PADRAO.dias_semana).map(Number);
    var ocup = (ag.ocupados || []).map(function (o) {
      var i = new Date(o.inicio).getTime();
      return { i: i, f: i + (Number(o.duracao) || dur) * 60000 };
    });
    var dias = [];
    var base = new Date(); base.setHours(0, 0, 0, 0);
    for (var n = 0; n < DIAS_A_FRENTE; n++) {
      var d = new Date(base); d.setDate(base.getDate() + n);
      if (diasAbertos.indexOf(d.getDay()) === -1) continue;
      var horas = [];
      for (var m = abre; m + dur <= fecha; m += 30) {
        var ini = new Date(d); ini.setHours(Math.floor(m / 60), m % 60, 0, 0);
        var fim = ini.getTime() + dur * 60000;
        var usados = ocup.filter(function (o) { return o.i < fim && o.f > ini.getTime(); }).length;
        horas.push({ hora: hhmm(m), min: m, livre: ini >= limite && usados < cap, passou: ini < limite });
      }
      var livres = horas.filter(function (h) { return h.livre; }).length;
      if (n === 0 && !livres) continue; // hoje já sem horário: nem mostra
      dias.push({ data: d, iso: isoDia(d), horas: horas, livres: livres });
    }
    return dias;
  };

  var form = document.getElementById("agendarForm");
  var escolha = { dia: "", hora: "" };
  var modoPeriodo = false;

  if (form) {
    var diasBox = document.getElementById("agendaDias");
    var horasBox = document.getElementById("agendaHoras");
    var btAntes = document.getElementById("diasAntes");
    var btDepois = document.getElementById("diasDepois");
    var resumo = document.getElementById("agendarResumo");
    var resumoTexto = document.getElementById("resumoTexto");
    var grade = [];

    var atualizarSetas = function () {
      btAntes.disabled = diasBox.scrollLeft <= 4;
      btDepois.disabled = diasBox.scrollLeft + diasBox.clientWidth >= diasBox.scrollWidth - 4;
    };
    var rolar = function (dir) {
      diasBox.scrollBy({ left: dir * Math.max(diasBox.clientWidth * 0.8, 160), behavior: "smooth" });
    };
    btAntes.addEventListener("click", function () { rolar(-1); });
    btDepois.addEventListener("click", function () { rolar(1); });
    diasBox.addEventListener("scroll", atualizarSetas, { passive: true });

    var atualizarResumo = function () {
      if (escolha.dia && escolha.hora) {
        resumoTexto.textContent = quandoTexto(escolha.dia, escolha.hora);
        resumo.hidden = false;
        resumo.classList.remove("pulse"); void resumo.offsetWidth; resumo.classList.add("pulse");
      } else {
        resumo.hidden = true;
      }
    };

    var desenharHoras = function (dia) {
      horasBox.innerHTML = "";
      var grupos = [
        { nome: "Manhã", de: 0, ate: 12 * 60 },
        { nome: "Tarde", de: 12 * 60, ate: 18 * 60 },
        { nome: "Noite", de: 18 * 60, ate: 24 * 60 }
      ];
      var algum = false;
      grupos.forEach(function (g, gi) {
        var lista = dia.horas.filter(function (h) { return h.min >= g.de && h.min < g.ate && !h.passou; });
        if (!lista.length) return;
        algum = true;
        var bloco = document.createElement("div");
        bloco.className = "horas__grupo";
        bloco.style.setProperty("--gi", gi);
        var t = document.createElement("span");
        t.className = "horas__nome";
        var livres = lista.filter(function (h) { return h.livre; }).length;
        t.textContent = g.nome + (livres ? "" : " · lotado");
        bloco.appendChild(t);
        var wrap = document.createElement("div");
        wrap.className = "horas__lista";
        wrap.setAttribute("role", "radiogroup");
        wrap.setAttribute("aria-label", "Horários da " + g.nome.toLowerCase());
        lista.forEach(function (h, i) {
          var id = "h-" + dia.iso + "-" + h.hora.replace(":", "");
          var lab = document.createElement("label");
          lab.className = "hora" + (h.livre ? "" : " hora--ocupada");
          lab.style.setProperty("--i", i);
          lab.setAttribute("for", id);
          var inp = document.createElement("input");
          inp.type = "radio"; inp.name = "hora"; inp.value = h.hora; inp.id = id;
          inp.disabled = !h.livre;
          if (escolha.dia === dia.iso && escolha.hora === h.hora) inp.checked = true;
          inp.addEventListener("change", function () {
            escolha.hora = h.hora;
            limparErro(document.getElementById("erro-horario"));
            atualizarResumo();
          });
          var sp = document.createElement("span");
          sp.textContent = h.hora;
          lab.append(inp, sp);
          if (!h.livre) lab.title = "Horário ocupado";
          wrap.appendChild(lab);
        });
        bloco.appendChild(wrap);
        horasBox.appendChild(bloco);
      });
      if (!algum || !dia.livres) {
        horasBox.innerHTML = '<p class="agenda__dica">Este dia está lotado. Escolha outro dia.</p>';
      }
    };

    var desenharDias = function () {
      diasBox.innerHTML = "";
      grade.forEach(function (dia, i) {
        var id = "d-" + dia.iso;
        var lab = document.createElement("label");
        lab.className = "dia" + (dia.livres ? "" : " dia--lotado");
        lab.style.setProperty("--i", i);
        lab.setAttribute("for", id);
        var inp = document.createElement("input");
        inp.type = "radio"; inp.name = "dia"; inp.value = dia.iso; inp.id = id;
        inp.disabled = !dia.livres;
        inp.addEventListener("change", function () {
          escolha.dia = dia.iso;
          escolha.hora = "";
          desenharHoras(dia);
          atualizarResumo();
        });
        var hoje = isoDia(new Date()) === dia.iso;
        lab.innerHTML = '<span class="dia__sem"></span><strong class="dia__num"></strong><span class="dia__mes"></span><small class="dia__vagas"></small>';
        lab.querySelector(".dia__sem").textContent = hoje ? "HOJE" : DIAS_SEM[dia.data.getDay()];
        lab.querySelector(".dia__num").textContent = pad(dia.data.getDate());
        lab.querySelector(".dia__mes").textContent = MESES_CURTO[dia.data.getMonth()];
        lab.querySelector(".dia__vagas").textContent = dia.livres ? dia.livres + (dia.livres === 1 ? " livre" : " livres") : "lotado";
        lab.insertBefore(inp, lab.firstChild);
        diasBox.appendChild(lab);
      });
      atualizarSetas();
    };

    var usarPeriodo = function () {
      modoPeriodo = true;
      document.getElementById("agenda").hidden = true;
      document.getElementById("campoPeriodo").hidden = false;
      document.getElementById("passoDadosNum").textContent = "2";
    };

    carregarAgenda().then(function (ag) {
      if (!ag) { usarPeriodo(); return; }
      grade = montarGrade(ag);
      if (!grade.some(function (d) { return d.livres; })) { usarPeriodo(); return; }
      desenharDias();
    }).catch(function () { usarPeriodo(); });

    /* ---------- validação ---------- */
    var fieldOf = function (id) { return document.getElementById(id).closest(".field"); };
    var valOf = function (id) { return (document.getElementById(id).value || "").trim(); };
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
    var limparErro = function (span) {
      span.textContent = "";
      document.getElementById("agenda").classList.remove("agenda--erro");
    };

    form.querySelectorAll(".field input, .field select").forEach(function (inp) {
      var handler = function () { clearErr(inp.closest(".field")); };
      inp.addEventListener("input", handler);
      inp.addEventListener("change", handler);
    });

    var enviar = document.getElementById("agendarEnviar");
    var sucesso = document.getElementById("agendarSucesso");

    var gravarPedido = function (dados) {
      var corpo = {
        estudio_id: cfg.ESTUDIO_ID, nome: dados.nome, telefone: dados.celular,
        objetivo: dados.objetivo, periodo: dados.periodo, origem: "site", status: "nova"
      };
      if (dados.dia) { corpo.data_desejada = dados.dia; corpo.horario_desejado = dados.hora; }
      var post = function (b) {
        return fetch(apiBase + "solicitacoes", {
          method: "POST",
          headers: Object.assign({ Prefer: "return=minimal" }, apiHeaders),
          body: JSON.stringify(b),
          keepalive: true
        });
      };
      return post(corpo).then(function (r) {
        if (r.ok) return true;
        // banco sem as colunas novas: grava ao menos o pedido
        if (dados.dia) {
          var velho = Object.assign({}, corpo);
          delete velho.data_desejada; delete velho.horario_desejado;
          return post(velho).then(function (r2) { return r2.ok; });
        }
        return false;
      }).catch(function () { return false; });
    };

    var gravarNaDemo = function (dados) {
      var demo = lerDemo();
      if (!demo || !Array.isArray(demo.solicitacoes)) return;
      demo.solicitacoes.push({
        id: "site-" + Date.now().toString(36), estudio_id: "estudio-demo",
        nome: dados.nome, telefone: dados.celular, objetivo: dados.objetivo, periodo: dados.periodo,
        data_desejada: dados.dia || null, horario_desejado: dados.hora || null,
        origem: "site", status: "nova", criado_em: new Date().toISOString()
      });
      gravarDemo(demo);
    };

    var mostrarSucesso = function (dados, url, gravado) {
      form.hidden = true;
      sucesso.hidden = false;
      document.getElementById("sucessoQuando").textContent = dados.dia ? quandoTexto(dados.dia, dados.hora) : dados.periodo;
      document.getElementById("sucessoTitulo").textContent = gravado ? "Pedido enviado!" : "Quase lá!";
      document.getElementById("sucessoTexto").textContent = gravado
        ? "O estúdio já recebeu o seu pedido e vai confirmar a aula com você pelo WhatsApp."
        : "Abrimos o WhatsApp com a mensagem pronta. É só enviar para o estúdio confirmar o seu horário.";
      var wa = document.getElementById("sucessoWhats");
      wa.href = url;
      wa.firstChild.textContent = gravado ? "Falar no WhatsApp agora " : "Abrir o WhatsApp de novo ";
      sucesso.focus({ preventScroll: true });
      sucesso.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    document.getElementById("sucessoNovo").addEventListener("click", function () {
      sucesso.hidden = true;
      form.hidden = false;
      escolha.hora = "";
      var marcado = form.querySelector('input[name="hora"]:checked');
      if (marcado) marcado.checked = false;
      atualizarResumo();
      // recarrega a agenda com o horário que acabou de ser pedido
      carregarAgenda().then(function (ag) {
        if (!ag) return;
        grade = montarGrade(ag);
        desenharDias();
        var dia = grade.filter(function (d) { return d.iso === escolha.dia; })[0];
        if (dia) {
          var r = document.getElementById("d-" + dia.iso);
          if (r && !r.disabled) { r.checked = true; desenharHoras(dia); }
        }
      }).catch(function () {});
      var alvo = diasBox.querySelector("input:checked") || diasBox.querySelector("input:not([disabled])");
      if (alvo) alvo.focus({ preventScroll: true });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      var nome = valOf("f-nome");
      var celular = valOf("f-celular");
      var objetivo = valOf("f-objetivo");
      var periodo = modoPeriodo ? valOf("f-periodo") : "";

      var ok = true;
      var primeiro = null;
      if (!modoPeriodo && (!escolha.dia || !escolha.hora)) {
        var span = document.getElementById("erro-horario");
        span.textContent = escolha.dia ? "Escolha um horário." : "Escolha o dia e o horário da aula.";
        document.getElementById("agenda").classList.add("agenda--erro");
        primeiro = form.querySelector('input[name="hora"]:not([disabled])') || form.querySelector('input[name="dia"]:not([disabled])');
        ok = false;
      }
      if (modoPeriodo && !periodo) { setErr(fieldOf("f-periodo"), "Escolha um período."); ok = false; primeiro = primeiro || document.getElementById("f-periodo"); }
      if (nome.length < 2 || nome.length > 120) { setErr(fieldOf("f-nome"), "Informe seu nome, com 2 a 120 caracteres."); ok = false; primeiro = primeiro || document.getElementById("f-nome"); }
      if (!celular) { setErr(fieldOf("f-celular"), "Informe o seu celular."); ok = false; primeiro = primeiro || document.getElementById("f-celular"); }
      else if (celular.replace(/\D/g, "").length < 10) { setErr(fieldOf("f-celular"), "Digite um número com DDD."); ok = false; primeiro = primeiro || document.getElementById("f-celular"); }
      if (!objetivo) { setErr(fieldOf("f-objetivo"), "Escolha o seu objetivo."); ok = false; primeiro = primeiro || document.getElementById("f-objetivo"); }

      if (!ok) {
        if (primeiro) primeiro.focus();
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
        return;
      }

      var dados = {
        nome: nome, celular: celular, objetivo: objetivo,
        dia: modoPeriodo ? "" : escolha.dia, hora: modoPeriodo ? "" : escolha.hora,
        periodo: modoPeriodo ? periodo : quandoTexto(escolha.dia, escolha.hora)
      };

      var linhas = [
        "Olá, Eletrofit! Quero agendar uma aula experimental.",
        "",
        "Nome: " + nome,
        "Celular: " + celular,
        "Objetivo: " + objetivo,
        (modoPeriodo ? "Melhor período: " : "Horário escolhido no site: ") + dados.periodo
      ];
      var url = "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(linhas.join("\n"));
      document.getElementById("agendarLink").href = url;

      if (!conectado) {
        gravarNaDemo(dados);
        window.open(url, "_blank", "noopener");
        mostrarSucesso(dados, url, false);
        return;
      }

      enviar.disabled = true;
      enviar.classList.add("is-loading");
      gravarPedido(dados).then(function (gravado) {
        enviar.disabled = false;
        enviar.classList.remove("is-loading");
        if (!gravado) window.open(url, "_blank", "noopener");
        mostrarSucesso(dados, url, gravado);
      });
    });
  }

  /* =====================================================
     Movimento

     Tudo aqui é enfeite: sem JavaScript ou com redução de
     movimento ligada, o conteúdo aparece igual, parado.
     ===================================================== */
  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Título do topo: letra por letra, com o nome inteiro para leitores de tela */
  document.querySelectorAll("[data-split]").forEach(function (h) {
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    var i = 0;
    var quebrar = function (no) {
      Array.from(no.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          var frag = document.createDocumentFragment();
          filho.textContent.split("").forEach(function (ch) {
            var s = document.createElement("span");
            s.className = "ch";
            s.setAttribute("aria-hidden", "true");
            s.style.setProperty("--ci", i++);
            s.textContent = ch;
            frag.appendChild(s);
          });
          no.replaceChild(frag, filho);
        } else if (filho.nodeType === 1 && filho.tagName !== "SMALL") {
          quebrar(filho);
        } else if (filho.nodeType === 1) {
          filho.setAttribute("aria-hidden", "true");
        }
      });
    };
    quebrar(h);
  });
  requestAnimationFrame(function () { document.documentElement.classList.add("is-loaded"); });

  /* Barra de progresso, parallax do topo e trilho do método num só laço */
  var barra = document.getElementById("scrollProgress");
  var heroImg = document.querySelector(".hero__img");
  var heroFrame = document.querySelector(".hero__frame");
  var trilho = document.getElementById("metodoTrilho");
  var metodo = document.getElementById("metodo");
  var agendado = false;
  var quadro = function () {
    agendado = false;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = window.scrollY;
    if (barra) barra.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (calmo) return;
    if (heroImg && heroFrame && y < heroFrame.offsetHeight) {
      heroImg.style.setProperty("--py", (y * 0.22).toFixed(1) + "px");
      heroFrame.style.setProperty("--fade", Math.min(y / heroFrame.offsetHeight, 1).toFixed(3));
    }
    if (trilho && metodo) {
      var r = metodo.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height * 0.8);
      trilho.style.transform = "scaleX(" + Math.max(0, Math.min(p, 1)).toFixed(3) + ")";
    }
  };
  window.addEventListener("scroll", function () {
    if (!agendado) { agendado = true; requestAnimationFrame(quadro); }
  }, { passive: true });
  window.addEventListener("resize", quadro);
  quadro();

  if (!calmo) {
    /* Botões principais seguem o dedo/mouse de leve */
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".btn--primary, .btn--dark, .btn--nav").forEach(function (b) {
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          b.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
          b.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + "px");
          b.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + "px");
        });
        b.addEventListener("pointerleave", function () {
          b.style.setProperty("--tx", "0px");
          b.style.setProperty("--ty", "0px");
        });
      });

      /* Cartões de benefício acendem onde o mouse passa */
      document.querySelectorAll(".card").forEach(function (c) {
        c.addEventListener("pointermove", function (e) {
          var r = c.getBoundingClientRect();
          c.style.setProperty("--gx", (e.clientX - r.left) + "px");
          c.style.setProperty("--gy", (e.clientY - r.top) + "px");
        });
      });
    }

    /* Dúvidas abrem e fecham deslizando */
    document.querySelectorAll(".qa").forEach(function (qa) {
      var summary = qa.querySelector("summary");
      var corpo = qa.querySelector("p");
      summary.addEventListener("click", function (e) {
        e.preventDefault();
        if (qa.dataset.animando) return;
        var abrir = !qa.open;
        qa.dataset.animando = "1";
        if (abrir) {
          qa.open = true;
          var alvo = corpo.offsetHeight;
          corpo.animate([{ height: "0px", opacity: 0 }, { height: alvo + "px", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" })
            .onfinish = function () { delete qa.dataset.animando; };
        } else {
          corpo.animate([{ height: corpo.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 240, easing: "ease-in" })
            .onfinish = function () { qa.open = false; delete qa.dataset.animando; };
        }
      });
    });
  }
})();
