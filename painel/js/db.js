/* ===================================================
   Acesso aos dados.

   Se config.js estiver preenchido, fala com o Supabase.
   Se estiver vazio, funciona em modo demonstracao, com
   dados de exemplo guardados no proprio navegador.
   O resto do painel nao precisa saber qual dos dois esta
   em uso: as funcoes abaixo respondem igual nos dois casos.
   =================================================== */

import { CONFIG } from "../config.js";
import { iso, primeiroDoMes, novoId, somarDias, somarMeses, hoje, MESES } from "./util.js";

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

const CHAVE = "eletrofit.demo.v5";
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
    meta_faturamento: 9000,
    meta_alunos: 26,
  };

  const planos = [
    { id: "p1", estudio_id: est.id, nome: "Plano 1x na semana", sessoes_semana: 1, sessoes_mes: 4, valor: 240, ativo: true },
    { id: "p2", estudio_id: est.id, nome: "Plano 2x na semana", sessoes_semana: 2, sessoes_mes: 8, valor: 380, ativo: true },
    { id: "p3", estudio_id: est.id, nome: "Plano 3x na semana", sessoes_semana: 3, sessoes_mes: 12, valor: 490, ativo: true },
  ];

  const protocolos = [
    { id: "t1", estudio_id: est.id, nome: "Base, adaptação", foco: "Adaptação", duracao: 20, frequencia: 60, largura_pulso: 350, nivel: "3 a 5", ativo: true,
      descricao: "Para as quatro primeiras sessões. Estímulo curto e intensidade baixa, o aluno aprende a contrair junto com o pulso antes de subir carga." },
    { id: "t2", estudio_id: est.id, nome: "Queima, circuito contínuo", foco: "Emagrecimento", duracao: 25, frequencia: 85, largura_pulso: 350, nivel: "5 a 7", ativo: true,
      descricao: "Pulso curto e pausa curta, movimento sem parar. Agachamento, remada, prancha e passada, sem descanso entre as trocas." },
    { id: "t3", estudio_id: est.id, nome: "Força, membros inferiores", foco: "Fortalecimento", duracao: 25, frequencia: 75, largura_pulso: 400, nivel: "6 a 8", ativo: true,
      descricao: "Pulso longo com pausa para recuperar. Agachamento, avanço, elevação de quadril e panturrilha em quatro séries." },
    { id: "t4", estudio_id: est.id, nome: "Centro do corpo e postura", foco: "Postura", duracao: 20, frequencia: 70, largura_pulso: 300, nivel: "4 a 6", ativo: true,
      descricao: "Abdômen, lombar e glúteo. Indicado para quem passa o dia sentado ou chega reclamando de dor nas costas." },
    { id: "t5", estudio_id: est.id, nome: "Recuperação, pulso baixo", foco: "Recuperação", duracao: 15, frequencia: 7, largura_pulso: 250, nivel: "2 a 4", ativo: true,
      descricao: "Frequência baixa para soltar a musculatura. Usado depois de treino pesado ou em semana de dor muscular." },
  ];

  const modelos = [
    { id: "mm1", estudio_id: est.id, titulo: "Lembrete de treino", categoria: "Agenda",
      texto: "Oi {nome}, tudo bem? Passando para confirmar seu treino de {data} às {hora} na Eletrofit. Pode confirmar para mim?" },
    { id: "mm2", estudio_id: est.id, titulo: "Cobrança sem constrangimento", categoria: "Financeiro",
      texto: "Oi {nome}, tudo bem? Sua mensalidade de {valor} venceu dia {vencimento}. Se ficar mais fácil eu mando o Pix por aqui mesmo." },
    { id: "mm3", estudio_id: est.id, titulo: "Convite para aula experimental", categoria: "Vendas",
      texto: "Oi {nome}, aqui é da Eletrofit. A aula experimental é gratuita e dura trinta minutos. Qual dia dessa semana fica melhor para você?" },
    { id: "mm4", estudio_id: est.id, titulo: "Aluno sumido", categoria: "Retenção",
      texto: "Oi {nome}, senti sua falta no estúdio essa semana. Quer que eu já separe um horário para você?" },
    { id: "mm5", estudio_id: est.id, titulo: "Parabéns de aniversário", categoria: "Relacionamento",
      texto: "Feliz aniversário, {nome}! Toda a equipe da Eletrofit deseja um dia excelente." },
    { id: "mm6", estudio_id: est.id, titulo: "Depois da primeira aula", categoria: "Vendas",
      texto: "Oi {nome}, como ficou o corpo depois da primeira sessão? Qualquer dúvida é só chamar por aqui." },
  ];

  /* semente fixa, para a demonstração abrir sempre igual.
     Contas com Math.imul para o número não estourar a precisão. */
  let s = 20260917 >>> 0;
  const sorte = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const pessoas = [
    ["Ana Paula Ribeiro", "34991110001", "Emagrecimento", "p2", true, 14, "ativo"],
    ["Carlos Eduardo Melo", "34991110002", "Fortalecimento muscular", "p2", true, 13, "ativo"],
    ["Juliana Faria", "34991110003", "Reabilitação ou alívio de dor", "p3", true, 12, "ativo"],
    ["Marcos Vinícius Dias", "34991110004", "Condicionamento físico", "p1", true, 11, "ativo"],
    ["Beatriz Camargo", "34991110005", "Emagrecimento", "p2", false, 10, "ativo"],
    ["Rafael Andrade", "34991110006", "Fortalecimento muscular", "p3", true, 10, "ativo"],
    ["Larissa Nunes", "34991110007", "Emagrecimento", "p1", true, 8, "ativo"],
    ["Tiago Moreira", "34991110008", "Condicionamento físico", "p2", true, 7, "ativo"],
    ["Camila Resende", "34991110009", "Emagrecimento", "p2", true, 6, "ativo"],
    ["Gustavo Peixoto", "34991110012", "Fortalecimento muscular", "p3", true, 5, "ativo"],
    ["Patrícia Alvarenga", "34991110013", "Reabilitação ou alívio de dor", "p1", true, 4, "ativo"],
    ["Diego Fonseca", "34991110014", "Condicionamento físico", "p2", true, 3, "ativo"],
    ["Renata Villela", "34991110015", "Emagrecimento", "p2", true, 2, "ativo"],
    ["Bruno Sampaio", "34991110016", "Fortalecimento muscular", "p3", true, 1, "ativo"],
    ["Sofia Bertolucci", "34991110017", "Emagrecimento", "p1", true, 1, "ativo"],
    ["Helena Prado", "34991110018", "Condicionamento físico", "p2", true, 12, "inativo"],
    ["Otávio Lemos", "34991110019", "Fortalecimento muscular", "p1", true, 13, "inativo"],
    ["Vinícius Toledo", "34991110020", "Ainda não sei, quero entender", "", false, 0, "experimental"],
  ];

  const base = hoje();
  const mesAtual = base.getMonth();
  const alunos = [];
  const matriculas = [];

  pessoas.forEach((p, i) => {
    const [nome, telefone, objetivo, planoId, liberado, mesesAtras, situacao] = p;
    const id = "a" + (i + 1);
    const entrada = new Date(base.getFullYear(), base.getMonth() - mesesAtras, 3 + (i % 20));
    /* três aniversários caem neste mês, para o bloco aparecer na demonstração */
    const mesNascimento = i === 0 ? mesAtual : i === 4 ? mesAtual : i === 9 ? mesAtual : (mesAtual + 2 + i) % 12;
    const diaNascimento = i === 4 ? base.getDate() : 3 + ((i * 7) % 25);

    alunos.push({
      id, estudio_id: est.id, nome, telefone, email: "",
      nascimento: iso(new Date(1986 + (i % 16), mesNascimento, diaNascimento)),
      objetivo, status: situacao,
      saude_liberado: liberado,
      saude_restricoes: liberado ? "" : "Aguardando liberação médica",
      saude_atualizado_em: liberado ? iso(entrada) : null,
      observacoes: "", criado_em: entrada.toISOString(),
    });

    if (!planoId) return;
    const plano = planos.find((x) => x.id === planoId);
    const saiu = situacao === "inativo";
    const fim = saiu ? iso(new Date(base.getFullYear(), base.getMonth() - (i === 15 ? 4 : 7), 20)) : null;
    matriculas.push({
      id: "m" + (i + 1), estudio_id: est.id, aluno_id: id, plano_id: plano.id,
      inicio: iso(entrada), fim,
      dia_vencimento: [5, 10, 15, 20][i % 4], valor: plano.valor,
      status: saiu ? "encerrada" : "ativa",
    });
  });

  /* cada aluno tem a rotina dele, por isso alguns horários vivem cheios */
  const faixas = [];
  for (let h = 7; h <= 19; h++) { faixas.push(h * 60); faixas.push(h * 60 + 30); }
  /* madrugada cedo e fim de tarde pesam mais, como num estúdio de verdade */
  const procurados = [
    420, 420, 450, 450, 480, 480,
    1020, 1020, 1050, 1050, 1080, 1080, 1110, 1110, 1140,
    540, 570, 720,
  ];
  const rotina = {};
  matriculas.forEach((m) => {
    const primeiro = procurados[Math.floor(sorte() * procurados.length)];
    const vizinhos = faixas.filter((f) => Math.abs(f - primeiro) <= 60 && f !== primeiro);
    const resto = faixas.filter((f) => f !== primeiro && !vizinhos.includes(f));
    rotina[m.aluno_id] = [primeiro, ...vizinhos, ...resto];
  });

  const sessoes = [];
  const anotacoes = [
    "Nível 6, pernas 7, sem queixa", "Nível 5, subiu bem no fim", "Nível 7, aguentou o circuito inteiro",
    "Nível 4, primeira semana de adaptação", "Nível 6, reclamou de lombar, reduzimos o pulso",
    "Nível 8, melhor sessão até agora", "Nível 6, cansaço de trabalho, manteve o ritmo",
  ];

  for (let d = -92; d <= 14; d++) {
    const dia = somarDias(base, d);
    if (!est.dias_semana.includes(dia.getDay())) continue;
    const diaIso = iso(dia);
    const ocupacao = {};
    const doDia = matriculas.filter((m) => m.inicio <= diaIso && (!m.fim || m.fim >= diaIso));

    doDia.forEach((m) => {
      const plano = planos.find((x) => x.id === m.plano_id);
      if (sorte() > plano.sessoes_semana / 5) return;
      const vaga = rotina[m.aluno_id].find((min) => (ocupacao[min] || 0) < est.capacidade);
      if (vaga === undefined) return;
      ocupacao[vaga] = (ocupacao[vaga] || 0) + 1;

      const inicio = new Date(dia);
      inicio.setHours(Math.floor(vaga / 60), vaga % 60, 0, 0);
      const passado = d < 0 || (d === 0 && inicio < new Date());
      const faltou = passado && sorte() < 0.08;
      const protocolo = protocolos[Math.floor(sorte() * (protocolos.length - 1))];

      sessoes.push({
        id: novoId(), estudio_id: est.id, aluno_id: m.aluno_id,
        inicio: inicio.toISOString(), duracao: est.duracao_padrao,
        protocolo_id: protocolo.id,
        status: passado ? (faltou ? "falta" : "realizada") : "agendada",
        intensidade: passado && !faltou ? anotacoes[Math.floor(sorte() * anotacoes.length)] : "",
        observacao: "",
      });
    });
  }

  /* mensalidades dos últimos doze meses */
  const cobrancas = [];
  const formas = ["Pix", "Pix", "Pix", "Cartão", "Dinheiro", "Transferência"];
  for (let k = 11; k >= 0; k--) {
    const comp = new Date(base.getFullYear(), base.getMonth() - k, 1);
    const compIso = iso(comp);
    matriculas.forEach((m, i) => {
      if (m.inicio > iso(new Date(comp.getFullYear(), comp.getMonth() + 1, 0))) return;
      if (m.fim && m.fim < compIso) return;
      const venc = new Date(comp.getFullYear(), comp.getMonth(), m.dia_vencimento);
      const atual = k === 0;
      const atrasada = atual && i % 5 === 0;
      const aberta = atual && (atrasada || i % 3 !== 0);
      cobrancas.push({
        id: novoId(), estudio_id: est.id, aluno_id: m.aluno_id, matricula_id: m.id,
        competencia: compIso,
        vencimento: iso(atrasada ? somarDias(base, -(6 + (i % 9))) : venc),
        valor: m.valor,
        status: aberta ? "aberta" : "paga",
        pago_em: aberta ? null : iso(somarDias(venc, Math.floor(sorte() * 4) - 1)),
        forma: aberta ? null : formas[Math.floor(sorte() * formas.length)],
        observacao: "",
      });
    });
  }

  /* avaliações físicas, três por aluno de casa */
  const avaliacoes = [];
  matriculas.filter((m) => m.status === "ativa").slice(0, 10).forEach((m, i) => {
    const pesoInicial = 62 + (i % 5) * 7 + Math.floor(sorte() * 6);
    const gorduraInicial = 24 + (i % 4) * 3;
    for (let k = 2; k >= 0; k--) {
      const quando = new Date(base.getFullYear(), base.getMonth() - k * 2, 8 + (i % 16));
      if (iso(quando) < m.inicio) continue;
      avaliacoes.push({
        id: novoId(), estudio_id: est.id, aluno_id: m.aluno_id,
        data: iso(quando),
        peso: +(pesoInicial - (2 - k) * 1.4).toFixed(1),
        altura: 1.58 + (i % 5) * 0.045,
        gordura: +(gorduraInicial - (2 - k) * 1.1).toFixed(1),
        massa_magra: +(pesoInicial * 0.68 + (2 - k) * 0.6).toFixed(1),
        cintura: +(82 + (i % 6) * 3 - (2 - k) * 1.5).toFixed(1),
        quadril: +(96 + (i % 5) * 3 - (2 - k) * 0.8).toFixed(1),
        braco: +(29 + (i % 4) + (2 - k) * 0.4).toFixed(1),
        coxa: +(52 + (i % 5) + (2 - k) * 0.5).toFixed(1),
        observacao: k === 0 ? "Evolução dentro do esperado, seguir com o mesmo protocolo." : "",
      });
    }
  });

  const solicitacoes = [
    { id: novoId(), estudio_id: est.id, nome: "Fernanda Lopes", telefone: "34991110010", objetivo: "Emagrecimento", periodo: "Noite, 18h às 20h30", origem: "site", status: "nova", criado_em: new Date().toISOString() },
    { id: novoId(), estudio_id: est.id, nome: "Pedro Henrique Souza", telefone: "34991110011", objetivo: "Ainda não sei, quero entender", periodo: "Manhã, 07h às 12h", origem: "site", status: "nova", criado_em: somarDias(new Date(), -1).toISOString() },
    { id: novoId(), estudio_id: est.id, nome: "Aline Barcelos", telefone: "34991110021", objetivo: "Reabilitação ou alívio de dor", periodo: "Tarde, 12h às 18h", origem: "site", status: "nova", criado_em: somarDias(new Date(), -3).toISOString() },
    { id: novoId(), estudio_id: est.id, nome: "Rodrigo Caixeta", telefone: "34991110022", objetivo: "Condicionamento físico", periodo: "Noite, 18h às 20h30", origem: "indicacao", status: "atendida", criado_em: somarDias(new Date(), -12).toISOString() },
  ];

  return { estudio: est, planos, protocolos, modelos, alunos, matriculas, sessoes, cobrancas, avaliacoes, solicitacoes };
}

function carregarDemo() {
  if (demo) return demo;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      demo = JSON.parse(bruto);
      return demo;
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
  let q = c.from("planos").select("*").order("sessoes_semana");
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
   Roda quantas vezes quiser, nao duplica. */
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

  const criar = ativas.filter((m) => !jaTem.has(m.id));
  for (const m of criar) {
    const venc = new Date(comp.getFullYear(), comp.getMonth(), m.dia_vencimento);
    await salvarCobranca({
      aluno_id: m.aluno_id,
      matricula_id: m.id,
      competencia: compIso,
      vencimento: iso(venc),
      valor: m.valor,
      status: "aberta",
    });
  }
  return criar.length;
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
   Protocolos de treino
   =================================================== */

export async function listarProtocolos({ apenasAtivos = false } = {}) {
  if (DEMO) {
    const d = carregarDemo();
    let l = clonar(d.protocolos || []);
    if (apenasAtivos) l = l.filter((p) => p.ativo);
    return l;
  }
  const c = await sb();
  let q = c.from("protocolos").select("*").order("nome");
  if (apenasAtivos) q = q.eq("ativo", true);
  return erro(await q);
}

export async function salvarProtocolo(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (!d.protocolos) d.protocolos = [];
    if (dados.id) {
      const i = d.protocolos.findIndex((p) => p.id === dados.id);
      d.protocolos[i] = Object.assign(d.protocolos[i], dados);
      salvarDemo();
      return clonar(d.protocolos[i]);
    }
    const novo = Object.assign({ id: novoId(), estudio_id: "estudio-demo", ativo: true }, dados);
    d.protocolos.push(novo);
    salvarDemo();
    return clonar(novo);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("protocolos").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("protocolos").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function removerProtocolo(id) {
  if (DEMO) {
    const d = carregarDemo();
    d.protocolos = (d.protocolos || []).filter((p) => p.id !== id);
    salvarDemo();
    return;
  }
  const c = await sb();
  erro(await c.from("protocolos").delete().eq("id", id).select());
}

/* ===================================================
   Modelos de mensagem
   =================================================== */

export async function listarModelos() {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.modelos || []);
  }
  const c = await sb();
  return erro(await c.from("modelos_mensagem").select("*").order("categoria"));
}

export async function salvarModelo(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (!d.modelos) d.modelos = [];
    if (dados.id) {
      const i = d.modelos.findIndex((m) => m.id === dados.id);
      d.modelos[i] = Object.assign(d.modelos[i], dados);
      salvarDemo();
      return clonar(d.modelos[i]);
    }
    const novo = Object.assign({ id: novoId(), estudio_id: "estudio-demo" }, dados);
    d.modelos.push(novo);
    salvarDemo();
    return clonar(novo);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("modelos_mensagem").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("modelos_mensagem").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function removerModelo(id) {
  if (DEMO) {
    const d = carregarDemo();
    d.modelos = (d.modelos || []).filter((m) => m.id !== id);
    salvarDemo();
    return;
  }
  const c = await sb();
  erro(await c.from("modelos_mensagem").delete().eq("id", id).select());
}

/* ===================================================
   Avaliações físicas
   =================================================== */

export async function avaliacoesDoAluno(alunoId) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.avaliacoes || [])
      .filter((a) => a.aluno_id === alunoId)
      .sort((a, b) => b.data.localeCompare(a.data));
  }
  const c = await sb();
  return erro(await c.from("avaliacoes").select("*").eq("aluno_id", alunoId).order("data", { ascending: false }));
}

export async function listarAvaliacoes(limite = 200) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.avaliacoes || [])
      .map((a) => Object.assign(a, { aluno: clonar(d.alunos.find((x) => x.id === a.aluno_id) || {}) }))
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, limite);
  }
  const c = await sb();
  return erro(await c.from("avaliacoes").select("*, aluno:alunos(id, nome, telefone)").order("data", { ascending: false }).limit(limite));
}

export async function salvarAvaliacao(dados) {
  if (DEMO) {
    const d = carregarDemo();
    if (!d.avaliacoes) d.avaliacoes = [];
    if (dados.id) {
      const i = d.avaliacoes.findIndex((a) => a.id === dados.id);
      d.avaliacoes[i] = Object.assign(d.avaliacoes[i], dados);
      salvarDemo();
      return clonar(d.avaliacoes[i]);
    }
    const nova = Object.assign({ id: novoId(), estudio_id: "estudio-demo" }, dados);
    d.avaliacoes.push(nova);
    salvarDemo();
    return clonar(nova);
  }
  const c = await sb();
  if (dados.id) {
    const { id, ...resto } = dados;
    return erro(await c.from("avaliacoes").update(resto).eq("id", id).select().single());
  }
  const estudio = await estudioId();
  return erro(await c.from("avaliacoes").insert({ ...dados, estudio_id: estudio }).select().single());
}

export async function removerAvaliacao(id) {
  if (DEMO) {
    const d = carregarDemo();
    d.avaliacoes = (d.avaliacoes || []).filter((a) => a.id !== id);
    salvarDemo();
    return;
  }
  const c = await sb();
  erro(await c.from("avaliacoes").delete().eq("id", id).select());
}

/* ===================================================
   Listas usadas pelos números e relatórios
   =================================================== */

export async function listarMatriculas() {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.matriculas).map((m) => Object.assign(m, {
      plano: clonar(d.planos.find((p) => p.id === m.plano_id) || {}),
      aluno: clonar(d.alunos.find((a) => a.id === m.aluno_id) || {}),
    }));
  }
  const c = await sb();
  return erro(await c.from("matriculas").select("*, plano:planos(*), aluno:alunos(id, nome, telefone, status)"));
}

export async function cobrancasDesde(competenciaIso) {
  if (DEMO) {
    const d = carregarDemo();
    return clonar(d.cobrancas)
      .filter((x) => x.competencia >= competenciaIso)
      .map((x) => Object.assign(x, { aluno: clonar(d.alunos.find((a) => a.id === x.aluno_id) || {}) }))
      .sort((a, b) => a.competencia.localeCompare(b.competencia));
  }
  const c = await sb();
  return erro(
    await c.from("cobrancas").select("*, aluno:alunos(id, nome, telefone)")
      .gte("competencia", competenciaIso).order("competencia")
  );
}

/* ===================================================
   Números da tela inicial
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
  const venceSemana = abertas.filter((c) => c.vencimento >= hojeIso && c.vencimento <= iso(somarDias(inicioHoje, 7)));

  const inicioMes = primeiroDoMes(inicioHoje);
  const doMes = await cobrancasDoMes(inicioMes);
  const recebido = doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0);
  const aReceber = doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0);

  return {
    sessoesHoje,
    ativos: alunos.filter((a) => a.status === "ativo").length,
    experimentais: alunos.filter((a) => a.status === "experimental").length,
    atrasadas,
    venceSemana,
    recebido,
    aReceber,
    solicitacoes,
    aniversariantes: aniversariantesDe(alunos, inicioHoje),
  };
}

function aniversariantesDe(alunos, referencia) {
  const mes = referencia.getMonth();
  const diaHoje = referencia.getDate();
  return alunos
    .filter((a) => a.nascimento && a.status !== "inativo")
    .map((a) => {
      const d = new Date(a.nascimento + "T12:00:00");
      return { aluno: a, mes: d.getMonth(), dia: d.getDate() };
    })
    .filter((x) => x.mes === mes)
    .sort((a, b) => a.dia - b.dia)
    .map((x) => ({ ...x.aluno, aniversario_dia: x.dia, aniversario_hoje: x.dia === diaHoje }));
}

/* ===================================================
   Tudo que o painel de números precisa, de uma vez só
   =================================================== */

export async function numerosDoPainel({ meses = 12, diasDeHistorico = 90 } = {}) {
  const base = hoje();
  const primeiroMes = primeiroDoMes(somarMeses(base, -(meses - 1)));
  const desde = somarDias(base, -diasDeHistorico);

  const [alunos, matriculas, planos, cobrancas, sessoes, solicitacoes, sessoesHoje] = await Promise.all([
    listarAlunos({}),
    listarMatriculas(),
    listarPlanos({}),
    cobrancasDesde(iso(primeiroMes)),
    sessoesEntre(desde, somarDias(base, 15)),
    listarSolicitacoes("nova"),
    sessoesEntre(base, somarDias(base, 1)),
  ]);

  const hojeIso = iso(base);
  const abertas = cobrancas.filter((c) => c.status === "aberta");
  const atrasadas = abertas.filter((c) => c.vencimento < hojeIso);
  const venceSemana = abertas.filter((c) => c.vencimento >= hojeIso && c.vencimento <= iso(somarDias(base, 7)));

  /* evolução de alunos com plano ativo, mês a mês */
  const serieAlunos = [];
  const serieFaturamento = [];
  for (let k = meses - 1; k >= 0; k--) {
    const mes = primeiroDoMes(somarMeses(base, -k));
    const compIso = iso(mes);
    const ultimoDia = iso(new Date(mes.getFullYear(), mes.getMonth() + 1, 0));
    const rotulo = MESES[mes.getMonth()].slice(0, 3);

    serieAlunos.push({
      rotulo,
      competencia: compIso,
      valor: matriculas.filter((m) => m.inicio <= ultimoDia && (!m.fim || m.fim >= compIso)).length,
    });

    const doMes = cobrancas.filter((c) => c.competencia === compIso);
    serieFaturamento.push({
      rotulo,
      competencia: compIso,
      recebido: doMes.filter((c) => c.status === "paga").reduce((s, c) => s + Number(c.valor), 0),
      aberto: doMes.filter((c) => c.status === "aberta").reduce((s, c) => s + Number(c.valor), 0),
    });
  }

  /* repartição por plano, do mais leve para o mais pesado */
  const ativas = matriculas.filter((m) => m.status === "ativa");
  const porPlano = planos
    .slice()
    .sort((a, b) => (a.sessoes_semana || 0) - (b.sessoes_semana || 0))
    .map((p) => ({ rotulo: p.nome, valor: ativas.filter((m) => m.plano_id === p.id).length }))
    .filter((x) => x.valor > 0);

  /* horários mais procurados */
  const contaHora = {};
  sessoes.filter((s) => s.status !== "cancelada" && new Date(s.inicio) <= base).forEach((s) => {
    const d = new Date(s.inicio);
    const chave = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    contaHora[chave] = (contaHora[chave] || 0) + 1;
  });
  const horarios = Object.entries(contaHora)
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 7);

  /* presença: quanto do que foi marcado virou treino */
  const passadas = sessoes.filter((s) => new Date(s.inicio) <= base && s.status !== "cancelada" && s.status !== "agendada");
  const realizadas = passadas.filter((s) => s.status === "realizada").length;
  const faltas = passadas.filter((s) => s.status === "falta").length;

  /* quem parou de aparecer */
  const ultimaPorAluno = {};
  sessoes.filter((s) => s.status === "realizada").forEach((s) => {
    const t = new Date(s.inicio).getTime();
    if (!ultimaPorAluno[s.aluno_id] || t > ultimaPorAluno[s.aluno_id]) ultimaPorAluno[s.aluno_id] = t;
  });
  const sumidos = alunos
    .filter((a) => a.status === "ativo")
    .map((a) => ({ ...a, dias: ultimaPorAluno[a.id] ? Math.floor((base - ultimaPorAluno[a.id]) / 864e5) : null }))
    .filter((a) => a.dias === null || a.dias >= 12)
    .sort((a, b) => (b.dias ?? 999) - (a.dias ?? 999))
    .slice(0, 6);

  /* ocupação da agenda da semana que vem */
  const estudio = DEMO ? carregarDemo().estudio : null;

  const mesAtual = serieFaturamento[serieFaturamento.length - 1] || { recebido: 0, aberto: 0 };
  const mesPassado = serieFaturamento[serieFaturamento.length - 2] || { recebido: 0, aberto: 0 };
  const alunosAgora = serieAlunos[serieAlunos.length - 1] || { valor: 0 };
  const alunosAntes = serieAlunos[serieAlunos.length - 2] || { valor: 0 };

  return {
    alunos, matriculas, planos, solicitacoes, atrasadas, venceSemana, estudio,
    sessoesHoje: sessoesHoje.filter((s) => s.status !== "cancelada"),
    proximas: sessoes
      .filter((s) => s.status === "agendada" && new Date(s.inicio) > base)
      .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
      .slice(0, 6),
    serieAlunos, serieFaturamento, porPlano, horarios, sumidos,
    aniversariantes: aniversariantesDe(alunos, base),
    presenca: {
      realizadas, faltas,
      taxa: realizadas + faltas ? Math.round((realizadas / (realizadas + faltas)) * 100) : 0,
    },
    kpis: {
      ativos: alunos.filter((a) => a.status === "ativo").length,
      experimentais: alunos.filter((a) => a.status === "experimental").length,
      recebido: mesAtual.recebido,
      aReceber: mesAtual.aberto,
      atrasado: atrasadas.reduce((s, c) => s + Number(c.valor), 0),
      ticket: ativas.length ? ativas.reduce((s, m) => s + Number(m.valor), 0) / ativas.length : 0,
      previsto: ativas.reduce((s, m) => s + Number(m.valor), 0),
      variacaoFaturamento: mesPassado.recebido
        ? Math.round(((mesAtual.recebido - mesPassado.recebido) / mesPassado.recebido) * 100)
        : 0,
      variacaoAlunos: alunosAntes.valor ? alunosAgora.valor - alunosAntes.valor : 0,
      sessoesNoPeriodo: passadas.length,
    },
  };
}
