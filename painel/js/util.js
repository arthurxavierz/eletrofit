/* Funcoes de apoio usadas em todas as telas */

export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function somarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

export function inicioDaSemana(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* 2026-09-09 */
export function iso(data) {
  const d = new Date(data);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

/* 09/09 */
export function dataCurta(data) {
  const d = new Date(data);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* 09/09/2026 */
export function dataBr(data) {
  if (!data) return "";
  const d = typeof data === "string" && data.length === 10 ? new Date(data + "T12:00:00") : new Date(data);
  return d.toLocaleDateString("pt-BR");
}

/* 18:30 */
export function hora(data) {
  return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/* setembro de 2026 */
export function mesPorExtenso(data) {
  const d = new Date(data);
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function primeiroDoMes(data) {
  const d = new Date(data);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function somarMeses(data, meses) {
  const d = new Date(data);
  return new Date(d.getFullYear(), d.getMonth() + meses, 1);
}

export function dinheiro(valor) {
  const n = Number(valor || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function soDigitos(texto) {
  return String(texto || "").replace(/\D/g, "");
}

export function telefoneBonito(texto) {
  const d = soDigitos(texto);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return texto || "";
}

/* Link do WhatsApp com a mensagem pronta */
export function linkWhats(telefone, mensagem) {
  let d = soDigitos(telefone);
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(mensagem)}`;
}

export function primeiroNome(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "";
}

export function iniciais(nome) {
  const partes = String(nome || "").trim().split(/\s+/);
  const a = partes[0] ? partes[0][0] : "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function idadeDe(nascimento) {
  if (!nascimento) return null;
  const n = new Date(nascimento + "T12:00:00");
  const h = new Date();
  let idade = h.getFullYear() - n.getFullYear();
  const m = h.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < n.getDate())) idade--;
  return idade;
}

export function novoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}


/* ===================================================
   Datas
   =================================================== */

/* Aceita "2026-09-01" ou Date. Datas soltas viram meio-dia local,
   assim o fuso nao empurra o dia para tras. */
export function dataDe(valor) {
  if (valor instanceof Date) return new Date(valor);
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(valor + "T12:00:00");
  return new Date(valor);
}

/* Quantos meses separam duas datas, ignorando o dia */
export function mesesEntre(de, ate) {
  const a = dataDe(de), b = dataDe(ate);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/* Quantos dias separam duas datas, ignorando a hora */
export function diasEntre(de, ate) {
  const a = dataDe(de), b = dataDe(ate);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b - a) / 864e5);
}

/* ===================================================
   Planos: mensal, trimestral, anual
   =================================================== */

export const PERIODICIDADES = [
  { valor: "mensal", rotulo: "Mensal", meses: 1, porCiclo: "por mês", cadaCiclo: "todo mês" },
  { valor: "trimestral", rotulo: "Trimestral", meses: 3, porCiclo: "por trimestre", cadaCiclo: "a cada 3 meses" },
  { valor: "anual", rotulo: "Anual", meses: 12, porCiclo: "por ano", cadaCiclo: "uma vez por ano" },
];

export function periodicidadeDe(valor) {
  return PERIODICIDADES.find((p) => p.valor === valor) || PERIODICIDADES[0];
}

export function mesesDoCiclo(valor) {
  return periodicidadeDe(valor).meses;
}

/* "Trimestral" */
export function rotuloPeriodicidade(valor) {
  return periodicidadeDe(valor).rotulo;
}

/* "por trimestre" */
export function porCiclo(valor) {
  return periodicidadeDe(valor).porCiclo;
}

/* Quanto o ciclo representa por mes, para comparar planos de periodos diferentes */
export function valorMensal(valor, periodicidade) {
  return Number(valor || 0) / mesesDoCiclo(periodicidade);
}

/* "R$ 1.020,00 por trimestre" e, quando nao e mensal, o equivalente por mes */
export function precoDoPlano(valor, periodicidade) {
  const base = `${dinheiro(valor)} ${porCiclo(periodicidade)}`;
  if (mesesDoCiclo(periodicidade) === 1) return base;
  return `${base}, ${dinheiro(valorMensal(valor, periodicidade))} por mês`;
}

/* ===================================================
   Ciclo de cobranca
   =================================================== */

/* O mes seguinte de cobranca de quem assinou em `competencia` */
export function proximaCompetencia(competencia, periodicidade) {
  return somarMeses(dataDe(competencia), mesesDoCiclo(periodicidade));
}

/* Ultimo mes coberto pela cobranca. Igual a competencia quando e mensal. */
export function fimDaCompetencia(competencia, periodicidade) {
  return somarMeses(dataDe(competencia), mesesDoCiclo(periodicidade) - 1);
}

/* Vencimento dentro do mes, respeitando meses curtos */
export function vencimentoNoMes(competencia, diaVencimento) {
  const c = primeiroDoMes(dataDe(competencia));
  const ultimoDia = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
  return new Date(c.getFullYear(), c.getMonth(), Math.min(Number(diaVencimento) || 1, ultimoDia));
}

/* A competencia cai no ciclo de quem comecou em `inicio`?
   Um plano trimestral iniciado em janeiro cobra em janeiro, abril, julho... */
export function competenciaCaiNoCiclo(competencia, inicio, periodicidade) {
  const passo = mesesDoCiclo(periodicidade);
  const diff = mesesEntre(primeiroDoMes(dataDe(inicio)), primeiroDoMes(dataDe(competencia)));
  return diff >= 0 && diff % passo === 0;
}

/* "setembro de 2026" no mensal, "setembro a novembro de 2026" no trimestral */
export function periodoPorExtenso(competencia, periodicidade) {
  const ini = dataDe(competencia);
  if (mesesDoCiclo(periodicidade) === 1) return mesPorExtenso(ini);
  const fim = fimDaCompetencia(competencia, periodicidade);
  if (ini.getFullYear() === fim.getFullYear()) {
    return `${MESES[ini.getMonth()]} a ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
  }
  return `${MESES[ini.getMonth()]} de ${ini.getFullYear()} a ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
}

/* Qual e a proxima cobranca do aluno e quando ela cai.

   Se existe cobranca em aberto, e ela. Se esta tudo pago, a proxima e
   prevista a partir da ultima competencia paga mais um ciclo, que e o
   que permite dizer "paga, a proxima vence em tal dia".

   Devolve null quando o aluno nao tem plano ativo. */
export function previsaoProximaCobranca(matricula, cobrancas = []) {
  if (!matricula || matricula.status !== "ativa") return null;

  const abertas = cobrancas
    .filter((c) => c.status === "aberta")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  if (abertas.length) return { cobranca: abertas[0], vencimento: abertas[0].vencimento, prevista: false };

  const pagas = cobrancas
    .filter((c) => c.status === "paga")
    .sort((a, b) => b.competencia.localeCompare(a.competencia));

  const periodicidade = matricula.periodicidade || "mensal";
  const base = pagas.length
    ? proximaCompetencia(pagas[0].competencia, pagas[0].periodicidade || periodicidade)
    : primeiroDoMes(dataDe(matricula.inicio));

  return {
    cobranca: null,
    vencimento: iso(vencimentoNoMes(base, matricula.dia_vencimento)),
    competencia: iso(primeiroDoMes(base)),
    prevista: true,
  };
}

/* A data em que a proxima cobranca desta mesma matricula deve cair,
   contada a partir da cobranca atual. Usada para dizer, em uma
   mensalidade ja paga, quando vem a proxima. */
export function vencimentoSeguinte(cobranca) {
  const proxima = proximaCompetencia(cobranca.competencia, cobranca.periodicidade);
  const dia = dataDe(cobranca.vencimento).getDate();
  return iso(vencimentoNoMes(proxima, dia));
}

/* ===================================================
   Situacao de uma cobranca
   =================================================== */

/* Quantos dias antes do vencimento a cobranca ja aparece como proxima */
export const DIAS_PROXIMA = 7;

/* Traduz status + vencimento em algo que a tela possa mostrar direto.
   chave: paga | atrasada | proxima | futura | cancelada */
export function situacaoCobranca(cobranca, referencia = hoje()) {
  const dias = diasEntre(referencia, cobranca.vencimento);

  if (cobranca.status === "cancelada") {
    return { chave: "cancelada", rotulo: "Cancelada", tom: "cinza", dias, detalhe: "Cancelada" };
  }

  if (cobranca.status === "paga") {
    return {
      chave: "paga", rotulo: "Paga", tom: "ok", dias,
      detalhe: cobranca.pago_em
        ? `Paga em ${dataBr(cobranca.pago_em)}${cobranca.forma ? " por " + cobranca.forma : ""}`
        : "Paga",
    };
  }

  if (dias < 0) {
    const atraso = Math.abs(dias);
    return {
      chave: "atrasada", rotulo: "Pendente", tom: "erro", dias,
      detalhe: `Venceu há ${atraso} dia${atraso === 1 ? "" : "s"}, em ${dataBr(cobranca.vencimento)}`,
    };
  }

  if (dias <= DIAS_PROXIMA) {
    return {
      chave: "proxima", rotulo: "Próxima", tom: "aviso", dias,
      detalhe: dias === 0
        ? `Vence hoje, ${dataBr(cobranca.vencimento)}`
        : `Vence em ${dias} dia${dias === 1 ? "" : "s"}, ${dataBr(cobranca.vencimento)}`,
    };
  }

  return {
    chave: "futura", rotulo: "Em aberto", tom: "cinza", dias,
    detalhe: `Vence ${dataBr(cobranca.vencimento)}`,
  };
}

/* Monta elementos sem escrever HTML na mao */
export function el(tag, attrs = {}, filhos = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "texto") e.textContent = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const f of [].concat(filhos)) {
    if (f === null || f === undefined || f === false) continue;
    e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
  }
  return e;
}

export function limpar(no) {
  while (no.firstChild) no.removeChild(no.firstChild);
  return no;
}
