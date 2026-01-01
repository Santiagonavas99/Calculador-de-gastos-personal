export function pmt(r, n, pv) {
  const nn = Number(n || 0);
  const rr = Number(r || 0);
  const pp = Number(pv || 0);
  if (nn <= 0) return 0;
  if (!rr) return pp / nn;
  return (rr * pp) / (1 - Math.pow(1 + rr, -nn));
}
export function saldoRestanteAmortizado(pv, r, n, k) {
  const nn = Number(n || 0);
  const kk = Number(k || 0);
  const rr = Number(r || 0);
  const pp = Number(pv || 0);
  if (kk <= 0) return pp;
  if (kk >= nn) return 0;
  if (!rr) {
    const pagado = (pp / nn) * kk;
    return Math.max(pp - pagado, 0);
  }
  const cuota = pmt(rr, nn, pp);
  const bk = pp * Math.pow(1 + rr, kk) - cuota * ((Math.pow(1 + rr, kk) - 1) / rr);
  return Math.max(bk, 0);
}
export function mesesEntre(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
export function cuotaDelMesCuotas(gasto, hoy = new Date()) {
  const n = Number(gasto.cuotas || 1);
  const pv = Number(gasto.monto || 0);
  if (n <= 1) return 0;
  if (gasto.tipo === 'cuotas_sin_interes') return pv / n;
  const r = (Number(gasto.tasaMensual || 0) / 100);
  const fecha = new Date(gasto.fecha);
  const estimado = Math.max(0, mesesEntre(fecha, hoy));
  const k = (gasto.cuotasPagadas ?? null) !== null && gasto.cuotasPagadas !== undefined ? Number(gasto.cuotasPagadas) : estimado;
  if (k >= n) return 0;
  return pmt(r, n, pv);
}
export function deudaRestanteCuotas(gasto, hoy = new Date()) {
  const n = Number(gasto.cuotas || 1);
  const pv = Number(gasto.monto || 0);
  if (n <= 1) return 0;
  const fecha = new Date(gasto.fecha);
  const estimado = Math.max(0, mesesEntre(fecha, hoy));
  const k = (gasto.cuotasPagadas ?? null) !== null && gasto.cuotasPagadas !== undefined ? Number(gasto.cuotasPagadas) : estimado;
  if (gasto.tipo === 'cuotas_sin_interes') {
    const pagado = (pv / n) * k;
    return Math.max(pv - pagado, 0);
  }
  const r = (Number(gasto.tasaMensual || 0) / 100);
  return saldoRestanteAmortizado(pv, r, n, k);
}
