import { state } from '../state/store.js';
import { money, percent } from '../core/format.js';
import { deudaRestanteCuotas } from '../core/finance.js';
import { computeAmortizationRows, latestCycleForToday, pagoMinimoMonto, simulateNextPeriodInterest } from '../core/tcEngine.js';
import { byId, setKpiColor } from './helpers.js';

function clasificarRiesgo(deudaTotal, cupoTotal, umbrales = { verde: 0.6, amarillo: 0.85 }) {
  const cupo = Number(cupoTotal || 0);
  const deuda = Number(deudaTotal || 0);
  if (!cupo) return { clase: 'warn', label: 'Configura tu cupo', uso: 0 };
  const uso = deuda / cupo;
  if (uso <= umbrales.verde) return { clase: 'ok', label: 'Saludable', uso };
  if (uso <= umbrales.amarillo) return { clase: 'warn', label: 'Precaución', uso };
  return { clase: 'danger', label: 'Riesgo', uso };
}

function deudaCuotasTotal() {
  const hoy = new Date();
  return (state.gastos || [])
    .filter(g => (g.tipo || 'revolving') !== 'revolving')
    .reduce((s,g)=>s + deudaRestanteCuotas(g, hoy), 0);
}

export function renderResumen() {
  const hoy = new Date();

  // Engine TC
  const engine = computeAmortizationRows(state, hoy, 18);
  const last = latestCycleForToday(engine.rows, hoy);

  const saldoCorte = last ? Number(last.saldoCorte || 0) : 0;
  const pagosATiempo = last ? Number(last.pagosATiempo || 0) : 0;
  const financed = Math.max(0, saldoCorte - pagosATiempo);

  const pagoMinimo = pagoMinimoMonto(saldoCorte, state.config.pagoMinPct, state.config.pagoMinFijo);

  // Simulación: si hoy aún no es vencimiento, asumir pagos a tiempo actuales = pagos registrados (ya incluidos en pagosATiempo),
  // y simular pago extra en el vencimiento.
  let extraToPayTotal = Math.max(0, saldoCorte - pagosATiempo);
  let extraToPayMin = Math.max(0, pagoMinimo - pagosATiempo);

  const simTotal = simulateNextPeriodInterest(engine, last, extraToPayTotal);
  const simMin = simulateNextPeriodInterest(engine, last, extraToPayMin);

  // Interés “esperado” del próximo período (si pagas solo mínimo)
  const interesProx = simMin.interest;

  // Deuda total = revolving (balance actual) + cuotas restantes
  const balanceHoy = last ? engine.ledger[engine.ledger.length - 1]?.balance ?? 0 : 0; // ledger llega hasta ~+2 meses, pero incluye hoy
  const deudaTotal = Math.max(0, Number(balanceHoy || 0)) + deudaCuotasTotal();

  const cupo = Number(state.config.cupoTotal || 0);
  const disponible = cupo - deudaTotal;

  const riesgo = clasificarRiesgo(deudaTotal, cupo, state.config.riesgo);

  byId('kpiEstado').textContent = money(saldoCorte);
  byId('kpiPagos').textContent = money(pagosATiempo);
  byId('kpiFinanciado').textContent = money(financed);

  byId('kpiMinimo').textContent = money(pagoMinimo);

  byId('kpiInteres').textContent = money(interesProx);
  byId('kpiInteresInfo').textContent = last ? `Período: ${last.cutDate.toISOString().slice(0,10)} → ${last.nextCut.toISOString().slice(0,10)}` : '—';

  const dispEl = byId('kpiDisponible');
  dispEl.textContent = money(disponible);
  setKpiColor(dispEl, riesgo.clase);

  const badge = byId('badgeRiesgo');
  badge.textContent = riesgo.label;
  badge.className = `badge ${riesgo.clase}`;

  byId('kpiUso').textContent = percent(deudaTotal, cupo);

  byId('kpiCiclo').textContent = last ? `Corte: ${last.cutDate.toISOString().slice(0,10)} • Vence: ${last.dueDate.toISOString().slice(0,10)}` : '—';
  byId('kpiPagoHasta').textContent = last ? `Pagos contados hasta: ${last.dueDate.toISOString().slice(0,10)}` : '—';

  // sim results
  byId('simTotalInteres').textContent = money(simTotal.interest);
  byId('simTotalFin').textContent = money(simTotal.financed);

  byId('simMinInteres').textContent = money(simMin.interest);
  byId('simMinFin').textContent = money(simMin.financed);
}
