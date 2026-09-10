/* Funcoes de apoio usadas em todas as telas */

export const DIAS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
export const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
export const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho",
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
