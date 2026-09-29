/* Eletrofit, confirmação de aula pelo link do WhatsApp.

   O link traz um código da sessão (?c=...). A página mostra o dia
   e a hora e o aluno responde se vem. A regra do prazo mora no
   banco: aqui só se mostra o que ele devolve.

   Com o config.js vazio, lê a demonstração do painel guardada no
   navegador, para dar para testar o fluxo inteiro localmente. */
(function () {
  "use strict";

  var cfg = window.ELETROFIT_CONFIG || {};
  var conectado = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  var api = conectado ? cfg.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/rpc/" : "";
  var DEMO_CHAVE = "eletrofit.demo.v2";
  var WHATS_PADRAO = "5534991208519";
  var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  var token = new URLSearchParams(location.search).get("c") || "";
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var hora = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  var mesmoDia = function (a, b) { return a.toDateString() === b.toDateString(); };

  var mostrar = function (id) {
    ["estadoCarregando", "estadoPergunta", "estadoCertezaNao", "estadoFim"].forEach(function (e) {
      $(e).hidden = e !== id;
    });
    var alvo = $(id).querySelector("h1, button");
    if (alvo && id !== "estadoCarregando") {
      if (alvo.tagName === "H1") alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
    }
  };

  var sessao = null;

  /* ---------- acesso aos dados ---------- */
  var rpc = function (nome, corpo) {
    return fetch(api + nome, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY
      },
      body: JSON.stringify(corpo)
    }).then(function (r) {
      if (!r.ok) throw new Error("rpc " + r.status);
      return r.json();
    });
  };

  var lerDemo = function () {
    try { return JSON.parse(localStorage.getItem(DEMO_CHAVE) || "null"); } catch (e) { return null; }
  };

  var buscar = function () {
    if (conectado) return rpc("sessao_para_confirmar", { p_token: token });
    var d = lerDemo();
    if (!d) return Promise.resolve(null);
    var s = (d.sessoes || []).filter(function (x) { return x.token === token; })[0];
    if (!s) return Promise.resolve(null);
    var a = (d.alunos || []).filter(function (x) { return x.id === s.aluno_id; })[0] || {};
    var ant = Number(d.estudio.antecedencia_cancelamento ?? 3);
    return Promise.resolve({
      nome: String(a.nome || "").trim().split(/\s+/)[0], inicio: s.inicio, duracao: s.duracao,
      status: s.status, confirmacao: s.confirmacao, reposicao_direito: s.reposicao_direito,
      antecedencia: ant, prazo: new Date(new Date(s.inicio).getTime() - ant * 36e5).toISOString(),
      estudio: d.estudio.nome, whatsapp: d.estudio.whatsapp
    });
  };

  /* Mesma regra da função responder_sessao do banco */
  var responderDemo = function (vai) {
    var d = lerDemo();
    var s = d && (d.sessoes || []).filter(function (x) { return x.token === token; })[0];
    if (!s) return { resultado: "nao_encontrada" };
    var agora = new Date();
    var inicio = new Date(s.inicio);
    var ant = Number(d.estudio.antecedencia_cancelamento ?? 3);
    var noPrazo = agora <= new Date(inicio.getTime() - ant * 36e5);
    if (inicio <= agora) return { resultado: "passou" };
    if (s.confirmacao === "recusada") return { resultado: "ja_recusou", reposicao_direito: s.reposicao_direito };
    if (s.status !== "agendada") return { resultado: "indisponivel" };
    s.confirmacao_por = "aluno";
    s.confirmacao_em = agora.toISOString();
    if (vai) {
      s.confirmacao = "confirmada";
    } else {
      s.confirmacao = "recusada";
      s.status = "cancelada";
      s.reposicao_direito = noPrazo;
    }
    try { localStorage.setItem(DEMO_CHAVE, JSON.stringify(d)); } catch (e) { /* sem espaço */ }
    return vai ? { resultado: "confirmada" } : { resultado: noPrazo ? "recusada" : "recusada_fora_do_prazo", reposicao_direito: noPrazo };
  };

  var responder = function (vai) {
    if (conectado) return rpc("responder_sessao", { p_token: token, p_vai: vai });
    return Promise.resolve(responderDemo(vai));
  };

  /* ---------- telas ---------- */
  var linkWhats = function (texto) {
    var n = String((sessao && sessao.whatsapp) || WHATS_PADRAO).replace(/\D/g, "");
    if (n.length <= 11) n = "55" + n;
    return "https://wa.me/" + n + (texto ? "?text=" + encodeURIComponent(texto) : "");
  };

  var quandoCurto = function () {
    var d = new Date(sessao.inicio);
    return DIAS[d.getDay()] + ", " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " às " + hora(d);
  };

  var fim = function (tipo, titulo, texto, whats) {
    var selo = $("fimSelo");
    selo.className = "conf__selo conf__selo--" + tipo;
    $("fimTitulo").textContent = titulo;
    $("fimTexto").textContent = texto;
    var a = $("fimWhats");
    if (whats) { a.href = linkWhats(whats); a.hidden = false; } else { a.hidden = true; }
    mostrar("estadoFim");
  };

  var erroGeral = function () {
    fim("erro", "Não deu certo agora", "Não conseguimos registrar a sua resposta. Tente de novo em instantes ou fale com o estúdio pelo WhatsApp.", "Olá! Tentei responder a confirmação da minha aula pelo link e não consegui.");
  };

  var tratarResultado = function (r) {
    var res = r && r.resultado;
    if (res === "confirmada") {
      fim("ok", "Presença confirmada!", "Te esperamos " + quandoCurto() + ". Venha com roupa de treino, tênis e uma garrafinha de água.");
    } else if (res === "recusada") {
      fim("aviso", "Aula desmarcada", "Obrigado por avisar a tempo. Você tem direito a repor essa aula: o estúdio vai combinar o novo horário com você.", "Olá! Desmarquei minha aula de " + quandoCurto() + " e quero combinar a reposição.");
    } else if (res === "recusada_fora_do_prazo") {
      fim("erro", "Aula desmarcada", "Recebemos o seu aviso, mas ele chegou depois do prazo de " + (sessao.antecedencia || 3) + " horas antes da aula. Por isso, esta aula não tem reposição.", "Olá! Desmarquei minha aula de " + quandoCurto() + " em cima da hora.");
    } else if (res === "ja_recusou") {
      fim("aviso", "Você já desmarcou esta aula", r.reposicao_direito ? "A reposição está garantida. Se mudou de ideia e quer vir, fale com o estúdio." : "Se mudou de ideia e quer vir, fale com o estúdio para ver se ainda há vaga.", "Olá! Desmarquei minha aula de " + quandoCurto() + " mas mudei de ideia.");
    } else if (res === "passou") {
      fim("erro", "Esta aula já começou", "O horário desta aula já passou, então não dá mais para responder por aqui.", "Olá! Sobre a minha aula de " + quandoCurto() + ".");
    } else if (res === "indisponivel") {
      fim("erro", "Esta aula não está mais na agenda", "Ela pode ter sido remarcada ou cancelada pelo estúdio. Fale com a gente para confirmar o seu horário.", "Olá! O link da minha aula diz que ela não está mais na agenda.");
    } else {
      naoEncontrada();
    }
  };

  var naoEncontrada = function () {
    fim("erro", "Link não encontrado", "Não achamos a aula deste link. Ele pode estar incompleto. Fale com o estúdio pelo WhatsApp.", "Olá! O link de confirmação da minha aula não abriu.");
  };

  var mostrarPergunta = function () {
    var d = new Date(sessao.inicio);
    var hoje = new Date();
    var amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
    $("saudacao").textContent = "Oi, " + (sessao.nome || "tudo bem") + "!";
    var diaTxt = (mesmoDia(d, hoje) ? "Hoje, " : mesmoDia(d, amanha) ? "Amanhã, " : "") +
      DIAS[d.getDay()] + ", " + d.getDate() + " de " + MESES[d.getMonth()];
    $("quandoDia").textContent = diaTxt.charAt(0).toUpperCase() + diaTxt.slice(1);
    $("quandoHora").textContent = hora(d);
    $("quandoDur").textContent = (sessao.duracao || 30) + " minutos";

    var prazo = new Date(sessao.prazo);
    var ant = Number(sessao.antecedencia || 0);
    if (ant > 0) {
      var quando = hora(prazo) + (mesmoDia(prazo, d) ? "" : " de " + pad(prazo.getDate()) + "/" + pad(prazo.getMonth() + 1));
      $("prazo").textContent = new Date() <= prazo
        ? "Se não puder vir, avise até " + quando + " (" + ant + "h antes) para ter direito à reposição."
        : "O prazo para desmarcar com reposição terminou às " + quando + ".";
      $("prazo").classList.toggle("conf__prazo--fora", new Date() > prazo);
    } else {
      $("prazo").textContent = "";
    }

    if (sessao.confirmacao === "confirmada") {
      $("btSim").textContent = "Já confirmei, estarei lá";
      $("btSim").classList.add("is-feito");
    }
    mostrar("estadoPergunta");
  };

  var ocupado = false;
  var enviar = function (vai, botao) {
    if (ocupado) return;
    ocupado = true;
    botao.classList.add("is-loading");
    responder(vai).then(function (r) {
      ocupado = false;
      botao.classList.remove("is-loading");
      tratarResultado(r);
    }).catch(function () {
      ocupado = false;
      botao.classList.remove("is-loading");
      erroGeral();
    });
  };

  $("btSim").addEventListener("click", function () { enviar(true, $("btSim")); });
  $("btNao").addEventListener("click", function () {
    var prazo = new Date(sessao.prazo);
    $("certezaTexto").textContent = new Date() <= prazo
      ? "O seu horário de " + quandoCurto() + " será liberado. Como você está avisando dentro do prazo, a aula fica com direito a reposição."
      : "O seu horário de " + quandoCurto() + " será liberado. O prazo para desmarcar com reposição já passou, então esta aula não será reposta.";
    mostrar("estadoCertezaNao");
  });
  $("btVoltar").addEventListener("click", mostrarPergunta);
  $("btConfirmaNao").addEventListener("click", function () { enviar(false, $("btConfirmaNao")); });

  /* ---------- início ---------- */
  if (!/^[0-9a-f-]{8,64}$/i.test(token)) {
    naoEncontrada();
    return;
  }
  buscar().then(function (s) {
    if (!s) { naoEncontrada(); return; }
    sessao = s;
    var inicio = new Date(s.inicio);
    if (inicio <= new Date()) { tratarResultado({ resultado: "passou" }); return; }
    if (s.confirmacao === "recusada") { tratarResultado({ resultado: "ja_recusou", reposicao_direito: s.reposicao_direito }); return; }
    if (s.status !== "agendada") { tratarResultado({ resultado: "indisponivel" }); return; }
    mostrarPergunta();
  }).catch(function () {
    fim("erro", "Sem conexão", "Não conseguimos carregar a sua aula. Confira a internet e abra o link de novo.", null);
  });
})();
