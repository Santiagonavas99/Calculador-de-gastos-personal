export function money(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(n);
}

export function compactNumber(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
}

export function parseMoneyInput(str) {
  if (str === null || str === undefined) return 0;
  const cleaned = String(str).replace(/[^0-9]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

export function percent(n, d) {
  const dn = Number(d || 0);
  if (!dn) return '0%';
  return ((Number(n || 0) / dn) * 100).toFixed(1) + '%';
}

export function bindMoneyInput(inputEl) {
  if (!inputEl) return;
  const format = () => {
    const raw = parseMoneyInput(inputEl.value);
    inputEl.value = raw ? compactNumber(raw) : '';
  };
  inputEl.addEventListener('input', format);
  inputEl.addEventListener('blur', format);
  format();
}
