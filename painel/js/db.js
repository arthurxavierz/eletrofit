/* ===================================================
   Acesso aos dados.

   Se config.js estiver preenchido, fala com o Supabase.
   Se estiver vazio, funciona em modo demonstracao, com
   dados de exemplo guardados no proprio navegador.
   O resto do painel nao precisa saber qual dos dois esta
   em uso: as funcoes abaixo respondem igual nos dois casos.
   =================================================== */

import { CONFIG } from "../config.js";
import {
  iso, primeiroDoMes, novoId, somarDias, hoje, somarMeses, DIAS_PROXIMA,
  competenciaCaiNoCiclo, fimDaCompetencia, vencimentoNoMes,
} from "./util.js";

export const DEMO = !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY;

const VERSOES_SDK = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm",
  "https://esm.sh/@supabase/supabase-js@2.116.0",
];

let cliente = null;

async function sb() {
  if (cliente) return cliente;
  let criar = null;
  let ultimoErro = null;
  for (const url of VERSOES_SDK) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      criar = mod.createClient;
      break;
    } catch (e) {
      ultimoErro = e;
    }
  }
  if (!criar) {
    throw new Error("Não foi possível carregar a biblioteca do Supabase. Verifique a internet. " + (ultimoErro ? ultimoErro.message : ""));
  }
  cliente = criar(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cliente;
}

function erro(res) {
  if (res.error) throw new Error(res.error.message || "Erro ao falar com o banco.");
  return res.data;
}

/* ===================================================
   Modo demonstracao
   =================================================== */

/* v2 trouxe periodicidade dos planos e historico de pagamentos.
   Demonstracoes gravadas na v1 nao tem esses campos, entao sao descartadas. */
const CHAVE = "eletrofit.demo.v2";
const CHAVES_ANTIGAS = ["eletrofit.demo.v1"];
let demo = null;

function salvarDemo() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(demo));
  } catch (e) {
    /* navegador sem espaco ou em aba anonima, segue em memoria */
  }
}

function semear() {
  const est = {
    id: "estudio-demo",
    nome: "Eletrofit Estúdio",
    whatsapp: "5534991208519",
    endereco: "Av. Jacinto Barbosa, 622, São Francisco, Patrocínio, MG",
    capacidade: 2,
    duracao_padrao: 30,
    intervalo_recuperacao: 24,
    abre: "07:00",
    fecha: "20:30",
    dias_semana: [1, 2, 3, 4, 5],
  };
  const planos = [
    { id: "p1", estudio_id: est.id, nome: "Plano 1x na semana", sessoes_semana: 1, sessoes_mes: 4, periodicidade: "mensal", valor: 240, ativo: true },
    { id: "p2", estudio_id: est.id, nome: "Plano 2x na semana", sessoes_semana: 2, sessoes_mes: 8, periodicidade: "mensal", valor: 380, ativo: true },
    { id: "p3", estudio_id: est.id, nome: "Plano 3x na semana", sessoes_semana: 3, sessoes_mes: 12, periodicidade: "mensal", valor: 490, ativo: true },
    { id: "p4", estudio_id: est.id, nome: "Trimestral 2x na semana", sessoes_semana: 2, sessoes_mes: 8, periodicidade: "trimestral", valor: 1020, ativo: true },
    { id: "p5", estudio_id: est.id, nome: "Anual 3x na semana", sessoes_semana: 3, sessoes_mes: 12, periodicidade: "anual", valor: 4680, ativo: true },
  ];
  const nomes = [
    ["Ana Paula Ribeiro", "34991110001", "Emagrecimento", "p2", true],
    ["Carlos Eduardo Melo", "34991110002", "Fortalecimento muscular", "p4", true],
    ["Juliana Faria", "34991110003", "Reabilitação ou alívio de dor", "p3", true],
    ["Marcos Vinicius Dias", "34991110004", "Condicionamento físico", "p1", true],
    ["Beatriz Camargo", "34991110005", "Emagrecimento", "p2", false],
    ["Rafael Andrade", "34991110006", "Fortalecimento muscular", "p5", true],
    ["Larissa Nunes", "34991110007", "Emagrecimento", "p4", true],
    ["Tiago Moreira", "34991110008", "Condicionamento físico", "p2", true],
  ];
  const alunos = [];
  const matriculas = [];

  /* Espalha os vencimentos em volta de hoje para que a demonstracao
     sempre tenha alguem pendente, alguem vencendo na semana e alguem
     mais adiante, sem inventar datas que briguem com o dia do plano.

     A conta so corre entre os planos mensais, que sao cobrados todos os
     meses. Trimestral e anual passam meses inteiros sem cobranca aberta,
     entao pegam um dia fixo e nao gastam um dos casos. */
  let mensalDemo = 0;
  const diaVencimentoDemo = (periodicidade) => {
    if (periodicidade !== "mensal") return 10;
    const desloc = [-14, 3, -5, 8][mensalDemo++ % 4];
    return Math.min(28, Math.max(1, hoje().getDate() + desloc));
  };
  // alguns aniversarios neste mes, para a demonstracao mostrar o bloco
  const mesAtual = new Date().getMonth();
  const aniversarios = {
    0: new Date(1994, mesAtual, 12),
    3: new Date(1990, mesAtual, 24),
    5: new Date(1998, mesAtual, new Date().getDate()),
  };
  nomes.forEach((n, i) => {
    const id = "a" + (i + 1);
    alunos.push({
      id, estudio_id: est.id, nome: n[0], telefone: n[1], email: "",
      nascimento: aniversarios[i] ? iso(aniversarios[i]) : (i % 2 ? iso(new Date(1995 - i, (mesAtual + 5) % 12, 8 + i)) : null),
      objetivo: n[2], status: i === 7 ? "experimental" : "ativo",
      saude_liberado: n[4], saude_restricoes: n[4] ? "" : "Aguardando liberação médica",
      saude_atualizado_em: n[4] ? iso(new Date()) : null,
      observacoes: "", criado_em: new Date().toISOString(),
    });
    if (i !== 7) {
      const plano = planos.find((p) => p.id === n[3]);
      matriculas.push({
        id: "m" + (i + 1), estudio_id: est.id, aluno_id: id, plano_id: plano.id,
        inicio: iso(somarMeses(hoje(), -(4 + (i % 3)))), fim: null,
        dia_vencimento: diaVencimentoDemo(plano.periodicidade),
        periodicidade: plano.periodicidade, valor: plano.valor, status: "ativa",
      });
    }
  });

  // agenda dos ultimos e proximos dias
  const sessoes = [];
  const base = hoje();
  for (let d = -7; d <= 7; d++) {
    const dia = somarDias(base, d);
    if (dia.getDay() === 0 || dia.getDay() === 6) continue;
    const horarios = [7, 8, 9, 17, 18, 19];
    horarios.forEach((h, idx) => {
      if ((d + idx) % 3 === 0) return;
      const aluno = alunos[(Math.abs(d) + idx) % 7];
      const inicio = new Date(dia);
      inicio.setHours(h, idx % 2 === 0 ? 0 : 30, 0, 0);
      sessoes.push({
        id: novoId(), estudio_id: est.id, aluno_id: aluno.id,
        inicio: inicio.toISOString(), duracao: 30,
        status: d < 0 ? (idx === 2 ? "falta" : "realizada") : "agendada",
        intensidade: d < 0 ? "Nivel 6, pernas 7" : "", observacao: "",
      });
    });
  }

  // cobrancas dos ultimos meses, respeitando o ciclo de cada plano,
  // e o historico de pagamentos correspondente
  const cobrancas = [];
  const pagamentos = [];
  const FORMAS_DEMO = ["Pix", "Cartão", "Dinheiro", "Transferência"];

  // contador das cobrancas que caem no mes atual, para distribuir as
  // situacoes entre elas: pendente, vencendo agora, paga e a vencer
  let noMesAtual = 0;

  matriculas.forEach((m, i) => {
    for (let offset = -6; offset <= 0; offset++) {
      const comp = primeiroDoMes(new Date(base.getFullYear(), base.getMonth() + offset, 1));
      if (comp < primeiroDoMes(m.inicio)) continue;
      if (!competenciaCaiNoCiclo(comp, m.inicio, m.periodicidade)) continue;

      const doMesAtual = offset === 0;
      const venc = vencimentoNoMes(comp, m.dia_vencimento);

      // o passado esta quitado; no mes corrente, parte ja foi paga
      const paga = !doMesAtual || noMesAtual++ % 3 === 2;
      // o passado nao recebe pagamento com data futura
      const pagoBruto = somarDias(venc, -(i % 3));
      const pagoEm = paga ? iso(pagoBruto > base ? base : pagoBruto) : null;
      const forma = paga ? FORMAS_DEMO[i % FORMAS_DEMO.length] : null;
      const id = novoId();

      cobrancas.push({
        id, estudio_id: est.id, aluno_id: m.aluno_id, matricula_id: m.id,
        competencia: iso(comp), competencia_fim: iso(fimDaCompetencia(comp, m.periodicidade)),
        periodicidade: m.periodicidade, vencimento: iso(venc), valor: m.valor,
        status: paga ? "paga" : "aberta", pago_em: pagoEm, forma, observacao: "",
      });

      if (paga) {
        pagamentos.push({
          id: novoId(), estudio_id: est.id, cobranca_id: id, aluno_id: m.aluno_id,
          valor: m.valor, pago_em: pagoEm, forma, observacao: "",
          estornado: false, estornado_em: null,
          registrado_em: new Date(pagoEm + "T12:00:00").toISOString(),
        });
      }
    }
  });

  const solicitacoes = [
    { id: novoId(), estudio_id: est.id, nome: "Fernanda Lopes", telefone: "34991110010", objetivo: "Emagrecimento", periodo: "Noite, 18h as 20h30", origem: "site", status: "nova", criado_em: new Date().toISOString() },
    { id: novoId(), estudio_id: est.id, nome: "Pedro Henrique Souza", telefone: "34991110011", objetivo: "Ainda não sei, quero entender", periodo: "Manha, 07h as 12h", origem: "site", status: "nova", criado_em: somarDias(new Date(), -1).toISOString() },
  ];

  return { estudio: est, planos, alunos, matriculas, sessoes, cobrancas, pagamentos, solicitacoes };
}

function carregarDemo() {
  if (demo) return demo;
  try {
    CHAVES_ANTIGAS.forEach((k) => localStorage.removeItem(k));
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const lido = JSON.parse(bruto);
      // guarda contra um dado gravado por uma versao incompleta
      if (lido && Array.isArray(lido.cobrancas) && Array.isArray(lido.pagamentos)) {
        demo = lido;
        return demo;
      }
    }
  } catch (e) {
    /* dado corrompido, comeca de novo */
  }
  demo = semear();
  salvarDemo();
  return demo;
}

export function reiniciarDemo() {
  demo = semear();
  salvarDemo();
}

function clonar(x) {
  return JSON.parse(JSON.stringify(x));
}

/* ===================================================
   Sessao e perfil
   =================================================== */

export async function entrar(email, senha) {
  if (DEMO) {
    localStorage.setItem("eletrofit.demo.logado", "1");
    return { nome: "Demonstração" };
  }
  const c = await sb();
  const res = await c.auth.signInWithPassword({ email, password: senha });
  if (res.error) {
    const m = res.error.message || "";
    if (/invalid/i.test(m)) throw new Error("E-mail ou senha não conferem.");
    throw new Error(m);
  }
  return res.data.user;
}

export async function sair() {
  if (DEMO) {
    localStorage.removeItem("eletrofit.demo.logado");
    return;
  }
  const c = await sb();
  await c.auth.signOut();
}

export async function temSessao() {
  if (DEMO) return localStorage.getItem("eletrofit.demo.logado") === "1";
  const c = await sb();
  const { data } = await c.auth.getSession();
  return !!(data && data.session);
}

export async function meuPerfil() {
  if (DEMO) {
    const d = carregarDemo();
    return { nome: "Demonstração", papel: "dono", estudio: clonar(d.estudio) };
  }
  const c = await sb();
  const perfil = erro(await c.from("perfis").select("nome, papel, estudio_id").single());
  const estudio = erro(await c.from("estudios").select("*").eq("id", perfil.estudio_id).single());
  return { nome: perfil.nome, papel: perfil.papel, estudio };
}

export async function salvarEstudio(dados) {
  if (DEMO) {
    const d = carregarDemo();
    Object.assign(d.estudio, dados);
    salvarDemo();
    return clonar(d.estudio);
  }
  const c = await sb();
  const estudio = await estudioId();
  return erro(await c.from("estudios").update(dados).eq("id", estudio).select().single());
}

let cacheEstudio = null;
async function estudioId() {
  if (DEMO) return "estudio-demo";
  if (cacheEstudio) return cacheEstudio;
  const c = await sb();
  const perfil = erro(await c.from("perfis").select("estudio_id").single());
  cacheEstudio = perfil.estudio_id;
  return cacheEstudio;
}

/* ===================================================
   Alunos
   =================================================== */

export async function listarAlunos({ busca = "", status = "" } = {}) {
  if (DEMO) {
    const d = carregarDemo();
    let lista = clonar(d.alunos);
    if (status) lista = lista.filter((a) => a.status === status);
    if (busca) {
      const b = busca.toLowerCase();
      lista = lista.filter((a) => a.nome.toLowerCase().includes(b) || String(a.telefone || "").includes(b));
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }
  const c = await sb();
  let q = c.from("alunos").select("*").order("nome");
  if (status) q = q.eq("status", status);
  if (busca) q = q.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`);
  return erro(await q);
}

export async function obterAluno(id) {
  if (DEMO) {
    const d = carregarDemo();
    const a = d.alunos.find((x) => x.id === id);
    return a ? clonar(a) : null;
  }
  const c = await sb();
  return erro(await c.from("alunos").select("*").eq("id", id).single());
}

export async function salvarAluno(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (dados.id) {
      const i = d.alunos.findIndex((x) => x.id === dados.id);
      d.alunos[i] = Object.assign(d.alunos[i], dados);
      salvarDemo();
      return clonar(d.alunos[i]);
    }
    const novo = Object.assign(
      { id: novoId(), estudio_id: "estudio-demo", status: "experimental", saude_liberado: false, criado_em: new Date().toISOString() },
      dados
    );
    d.alunos.push(novo);
    salvarDemo();
    return clonar(novo);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("alunos").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("alunos").insert({ ...dados, estudio_id: estudio }).select().single());
}

/* ===================================================
   Planos e matriculas
   =================================================== */

export async function listarPlanos({ apenasAtivos = false } = {}) {
  if (DEMO) {
    const d = carregarDemo();
    let l = clonar(d.planos);
    if (apenasAtivos) l = l.filter((p) => p.ativo);
    return l;
  }
  const c = await sb();
  let q = c.from("planos").select("*").order("periodicidade").order("sessoes_semana");
  if (apenasAtivos) q = q.eq("ativo", true);
  return erro(await q);
}

export async function salvarPlano(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (dados.id) {
      const i = d.planos.findIndex((p) => p.id === dados.id);
      d.planos[i] = Object.assign(d.planos[i], dados);
      salvarDemo();
      return clonar(d.planos[i]);
    }
    const novo = Object.assign({ id: novoId(), estudio_id: "estudio-demo", ativo: true }, dados);
    d.planos.push(novo);
    salvarDemo();
    return clonar(novo);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("planos").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("planos").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function matriculaDoAluno(alunoId) {
  if (DEMO) {
    const d = carregarDemo();
    const m = d.matriculas.find((x) => x.aluno_id === alunoId && x.status === "ativa");
    if (!m) return null;
    const plano = d.planos.find((p) => p.id === m.plano_id) || null;
    return Object.assign(clonar(m), { plano: plano ? clonar(plano) : null });
  }
  const c = await sb();
  const lista = erro(
    await c.from("matriculas").select("*, plano:planos(*)").eq("aluno_id", alunoId).eq("status", "ativa").limit(1)
  );
  return lista[0] || null;
}

export async function salvarMatricula(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (dados.id) {
      const i = d.matriculas.findIndex((m) => m.id === dados.id);
      d.matriculas[i] = Object.assign(d.matriculas[i], dados);
      salvarDemo();
      return clonar(d.matriculas[i]);
    }
    d.matriculas.forEach((m) => {
      if (m.aluno_id === dados.aluno_id && m.status === "ativa") m.status = "encerrada";
    });
    const novo = Object.assign(
      { id: novoId(), estudio_id: "estudio-demo", inicio: iso(new Date()), status: "ativa" },
      dados
    );
    d.matriculas.push(novo);
    salvarDemo();
    return clonar(novo);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("matriculas").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  await c.from("matriculas").update({ status: "encerrada" }).eq("aluno_id", dados.aluno_id).eq("status", "ativa");
  return erro(await c.from("matriculas").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function encerrarMatricula(id) {
  if (DEMO) {
    const d = carregarDemo();
    const m = d.matriculas.find((x) => x.id === id);
    if (m) m.status = "encerrada";
    salvarDemo();
    return;
  }
  const c = await sb();
  erro(await c.from("matriculas").update({ status: "encerrada", fim: iso(new Date()) }).eq("id", id).select());
}

/* ===================================================
   Sessoes
   =================================================== */

function entre(dataIso, ini, fim) {
  const t = new Date(dataIso).getTime();
  return t >= ini.getTime() && t < fim.getTime();
}

export async function sessoesEntre(inicio, fim) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.sessoes)
      .filter((s) => entre(s.inicio, inicio, fim))
      .map((s) => Object.assign(s, { aluno: clonar(d.alunos.find((a) => a.id === s.aluno_id) || {}) }))
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  }
  const c = await sb();
  return erro(
    await c.from("sessoes")
      .select("*, aluno:alunos(id, nome, telefone, status, saude_liberado)")
      .gte("inicio", inicio.toISOString())
      .lt("inicio", fim.toISOString())
      .order("inicio")
  );
}

export async function sessoesDoAluno(alunoId, limite = 20) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.sessoes)
      .filter((s) => s.aluno_id === alunoId)
      .sort((a, b) => new Date(b.inicio) - new Date(a.inicio))
      .slice(0, limite);
  }
  const c = await sb();
  return erro(
    await c.from("sessoes").select("*").eq("aluno_id", alunoId).order("inicio", { ascending: false }).limit(limite)
  );
}

export async function criarSessao(dados) {
  if (DEMO) {
    const d = carregarDemo();
    const nova = Object.assign(
      { id: novoId(), estudio_id: "estudio-demo", duracao: d.estudio.duracao_padrao, status: "agendada", criado_em: new Date().toISOString() },
      dados
    );
    d.sessoes.push(nova);
    salvarDemo();
    return clonar(nova);
  }
  const c = await sb();
  const estudio = await estudioId();
  return erro(await c.from("sessoes").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function atualizarSessao(id, dados) {
  if (DEMO) {
    const d = carregarDemo();
    const s = d.sessoes.find((x) => x.id === id);
    if (s) Object.assign(s, dados);
    salvarDemo();
    return s ? clonar(s) : null;
  }
  const c = await sb();
  return erro(await c.from("sessoes").update(dados).eq("id", id).select().single());
}

export async function removerSessao(id) {
  if (DEMO) {
    const d = carregarDemo();
    d.sessoes = d.sessoes.filter((s) => s.id !== id);
    salvarDemo();
    return;
  }
  const c = await sb();
  erro(await c.from("sessoes").delete().eq("id", id).select());
}

/* Ultima sessao contada do aluno, para o intervalo de recuperacao */
export async function ultimaSessaoDoAluno(alunoId) {
  const lista = await sessoesDoAluno(alunoId, 30);
  const validas = lista.filter((s) => s.status === "agendada" || s.status === "realizada");
  return validas[0] || null;
}

/* ===================================================
   Cobrancas
   =================================================== */

export async function cobrancasDoMes(competencia) {
  const comp = iso(primeiroDoMes(competencia));
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.cobrancas)
      .filter((x) => x.competencia === comp)
      .map((x) => Object.assign(x, { aluno: clonar(d.alunos.find((a) => a.id === x.aluno_id) || {}) }))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }
  const c = await sb();
  return erro(
    await c.from("cobrancas")
      .select("*, aluno:alunos(id, nome, telefone)")
      .eq("competencia", comp)
      .order("vencimento")
  );
}

export async function cobrancasEmAberto() {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.cobrancas)
      .filter((x) => x.status === "aberta")
      .map((x) => Object.assign(x, { aluno: clonar(d.alunos.find((a) => a.id === x.aluno_id) || {}) }))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }
  const c = await sb();
  return erro(
    await c.from("cobrancas").select("*, aluno:alunos(id, nome, telefone)").eq("status", "aberta").order("vencimento")
  );
}

export async function cobrancasDoAluno(alunoId, limite = 12) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.cobrancas)
      .filter((x) => x.aluno_id === alunoId)
      .sort((a, b) => b.competencia.localeCompare(a.competencia))
      .slice(0, limite);
  }
  const c = await sb();
  return erro(
    await c.from("cobrancas").select("*").eq("aluno_id", alunoId).order("competencia", { ascending: false }).limit(limite)
  );
}

export async function salvarCobranca(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (dados.id) {
      const i = d.cobrancas.findIndex((x) => x.id === dados.id);
      d.cobrancas[i] = Object.assign(d.cobrancas[i], dados);
      salvarDemo();
      return clonar(d.cobrancas[i]);
    }
    const nova = Object.assign({ id: novoId(), estudio_id: "estudio-demo", status: "aberta" }, dados);
    d.cobrancas.push(nova);
    salvarDemo();
    return clonar(nova);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("cobrancas").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("cobrancas").insert({ ...dados, estudio_id: estudio }).select().single());
}

/* Cria as mensalidades do mes para quem tem matricula ativa.
   Roda quantas vezes quiser, nao duplica.

   Quem esta em plano trimestral ou anual so e cobrado nos meses do
   proprio ciclo, contados a partir do inicio da matricula. Um trimestral
   que comecou em janeiro e cobrado em janeiro, abril, julho e outubro.
   Nos meses de intervalo ele ja esta pago e nao entra na geracao.

   Devolve quantas foram criadas e quantas ficaram de fora por estarem
   no meio de um ciclo ja pago. */
export async function gerarCobrancasDoMes(competencia) {
  const comp = primeiroDoMes(competencia);
  const compIso = iso(comp);
  const existentes = await cobrancasDoMes(comp);
  const jaTem = new Set(existentes.map((x) => x.matricula_id));

  let ativas;
  if (DEMO) {
    const d = carregarDemo();
    ativas = clonar(d.matriculas).filter((m) => m.status === "ativa");
  } else {
    const c = await sb();
    ativas = erro(await c.from("matriculas").select("*").eq("status", "ativa"));
  }

  const pendentes = ativas.filter((m) => !jaTem.has(m.id));
  // ja comecou, e o mes cai no ciclo do plano
  const criar = pendentes.filter((m) =>
    primeiroDoMes(m.inicio) <= comp && competenciaCaiNoCiclo(comp, m.inicio, m.periodicidade));

  for (const m of criar) {
    await salvarCobranca({
      aluno_id: m.aluno_id,
      matricula_id: m.id,
      competencia: compIso,
      competencia_fim: iso(fimDaCompetencia(comp, m.periodicidade)),
      periodicidade: m.periodicidade || "mensal",
      vencimento: iso(vencimentoNoMes(comp, m.dia_vencimento)),
      valor: m.valor,
      status: "aberta",
    });
  }

  const noMeioDoCiclo = pendentes.length - criar.length;
  return { criadas: criar.length, noMeioDoCiclo };
}

/* ===================================================
   Historico de pagamentos

   Dar baixa grava uma linha aqui e marca a cobranca como paga.
   Desfazer nao apaga a linha, marca como estornada, entao o
   historico continua mostrando o que aconteceu de verdade.
   =================================================== */

export async function registrarPagamento({ cobranca, pago_em, forma, observacao = "" }) {
  const dados = {
    cobranca_id: cobranca.id,
    aluno_id: cobranca.aluno_id,
    valor: Number(cobranca.valor || 0),
    pago_em,
    forma,
    observacao,
  };

  if (DEMO) {
    const d = carregarDemo();
    d.pagamentos.push(Object.assign({
      id: novoId(), estudio_id: "estudio-demo",
      estornado: false, estornado_em: null, registrado_em: new Date().toISOString(),
    }, dados));
    salvarDemo();
  } else {
    const c = await sb();
    const estudio = await estudioId();
    erro(await c.from("pagamentos").insert({ ...dados, estudio_id: estudio }).select().single());
  }

  const atualizacao = { id: cobranca.id, status: "paga", pago_em, forma };
  // so escreve a observacao quando ha texto, para nao apagar uma nota anterior
  if (observacao) atualizacao.observacao = observacao;
  return salvarCobranca(atualizacao);
}

/* Desfaz a baixa: a cobranca volta a ficar aberta e o pagamento fica
   no historico marcado como estornado. */
export async function estornarPagamento(cobrancaId) {
  const agora = new Date().toISOString();

  if (DEMO) {
    const d = carregarDemo();
    d.pagamentos
      .filter((x) => x.cobranca_id === cobrancaId && !x.estornado)
      .forEach((x) => { x.estornado = true; x.estornado_em = agora; });
    salvarDemo();
  } else {
    const c = await sb();
    erro(await c.from("pagamentos")
      .update({ estornado: true, estornado_em: agora })
      .eq("cobranca_id", cobrancaId).eq("estornado", false).select());
  }

  return salvarCobranca({ id: cobrancaId, status: "aberta", pago_em: null, forma: null });
}

export async function pagamentosDoAluno(alunoId, limite = 24) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.pagamentos)
      .filter((x) => x.aluno_id === alunoId)
      .sort((a, b) => b.pago_em.localeCompare(a.pago_em) || b.registrado_em.localeCompare(a.registrado_em))
      .slice(0, limite);
  }
  const c = await sb();
  return erro(
    await c.from("pagamentos").select("*").eq("aluno_id", alunoId)
      .order("pago_em", { ascending: false }).limit(limite)
  );
}

/* Tudo que entrou entre duas datas, para a aba de historico do financeiro */
export async function pagamentosEntre(inicio, fim) {
  const de = iso(inicio), ate = iso(fim);
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.pagamentos)
      .filter((x) => x.pago_em >= de && x.pago_em <= ate)
      .map((x) => Object.assign(x, { aluno: clonar(d.alunos.find((a) => a.id === x.aluno_id) || {}) }))
      .sort((a, b) => b.pago_em.localeCompare(a.pago_em));
  }
  const c = await sb();
  return erro(
    await c.from("pagamentos").select("*, aluno:alunos(id, nome, telefone)")
      .gte("pago_em", de).lte("pago_em", ate).order("pago_em", { ascending: false })
  );
}

/* ===================================================
   Solicitacoes vindas do site
   =================================================== */

export async function listarSolicitacoes(status = "nova") {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.solicitacoes)
      .filter((s) => (status ? s.status === status : true))
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
  }
  const c = await sb();
  let q = c.from("solicitacoes").select("*").order("criado_em", { ascending: false });
  if (status) q = q.eq("status", status);
  return erro(await q);
}

export async function atualizarSolicitacao(id, dados) {
  if (DEMO) {
    const d = carregarDemo();
    const s = d.solicitacoes.find((x) => x.id === id);
    if (s) Object.assign(s, dados);
    salvarDemo();
    return s ? clonar(s) : null;
  }
  const c = await sb();
  return erro(await c.from("solicitacoes").update(dados).eq("id", id).select().single());
}

/* ===================================================
   Numeros da tela inicial
   =================================================== */

export async function resumo() {
  const inicioHoje = hoje();
  const fimHoje = somarDias(inicioHoje, 1);
  const [sessoesHoje, abertas, alunos, solicitacoes] = await Promise.all([
    sessoesEntre(inicioHoje, fimHoje),
    cobrancasEmAberto(),
    listarAlunos({}),
    listarSolicitacoes("nova"),
  ]);

  const hojeIso = iso(inicioHoje);
  const atrasadas = abertas.filter((c) => c.vencimento < hojeIso);
  const venceSemana = abertas.filter((c) => c.vencimento >= hojeIso && c.vencimento <= iso(somarDias(inicioHoje, DIAS_PROXIMA)));

  const inicioMes = primeiroDoMes(inicioHoje);
  const doMes = await cobrancasDoMes(inicioMes);
  const recebido = doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0);
  const aReceber = doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0);

  // aniversariantes do mes, ordenados pelo dia
  const mes = inicioHoje.getMonth();
  const diaHoje = inicioHoje.getDate();
  const aniversariantes = alunos
    .filter((a) => a.nascimento && a.status !== "inativo")
    .map((a) => {
      const d = new Date(a.nascimento + "T12:00:00");
      return { aluno: a, mes: d.getMonth(), dia: d.getDate() };
    })
    .filter((x) => x.mes === mes)
    .sort((a, b) => a.dia - b.dia)
    .map((x) => ({ ...x.aluno, aniversario_dia: x.dia, aniversario_hoje: x.dia === diaHoje }));

  return {
    sessoesHoje,
    ativos: alunos.filter((a) => a.status === "ativo").length,
    experimentais: alunos.filter((a) => a.status === "experimental").length,
    atrasadas,
    venceSemana,
    recebido,
    aReceber,
    solicitacoes,
    aniversariantes,
  };
}
