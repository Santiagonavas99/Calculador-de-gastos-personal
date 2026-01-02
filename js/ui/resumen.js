import { state } from '../state/store.js';
import { money, percent } from '../core/format.js';
import { deudaRestanteCuotas } from '../core/finance.js';
import { computeAmortizationRows, latestCycleForToday, pagoMinimoReal } from '../core/tcEngine.js';
import { byId, setKpiColor } from './helpers.js';

function clasificarRiesgo(deudaTotal, cupoTotal, umbrales = { verde: 0.6, amarillo: 0.85 }) {
  const cupo = Number(cupoTotal || 0);
  const deuda = Number(deudaTotal || 0);
  if (!cupo) return { clase: 'warn', label: 'Configura tu cupo', uso: 0 };
  const uso = deuda / cupo;
  if (uso <= umbrales.verde) return { clase: 'ok', label: 'Saludable', uso };
  if (uso <= umbrales.amarillo) return { clase: 'warn', label: 'Precauci�n', uso };
  return { clase: 'danger', label: 'Riesgo', uso };
}

function deudaCuotasTotal() {
  const hoy = new Date();
  return (state.gastos || [])
    .filter(g => {
      const tipo = g.tipo || 'una_cuota';
      return tipo === 'cuotas_sin_interes' || tipo === 'cuotas_con_interes';
    })
    .reduce((s,g)=>s + deudaRestanteCuotas(g, hoy), 0);
}

export function renderResumen() {
  const hoy = new Date();
  const engine = computeAmortizationRows(state, hoy, 18);
  const last = latestCycleForToday(engine.rows, hoy);

  const saldoCorte = last ? Number(last.saldoCorte || 0) : 0;
  const pagoMinimo = pagoMinimoReal(state, last);

  const balanceHoy = last ? engine.ledger[engine.ledger.length - 1]?.balance ?? 0 : 0;
  const deudaTotal = Math.max(0, Number(balanceHoy || 0)) + deudaCuotasTotal();

  const cupo = Number(state.config.cupoTotal || 0);
  const disponible = cupo - deudaTotal;

  const riesgo = clasificarRiesgo(deudaTotal, cupo, state.config.riesgo);

  byId('kpiEstado').textContent = money(saldoCorte);
  byId('kpiMinimo').textContent = money(pagoMinimo);

  const dispEl = byId('kpiDisponible');
  dispEl.textContent = money(disponible);
  setKpiColor(dispEl, riesgo.clase);

  const badge = byId('badgeRiesgo');
  badge.textContent = riesgo.label;
  badge.className = `badge ${riesgo.clase}`;

  byId('kpiUso').textContent = percent(deudaTotal, cupo);
  byId('kpiCiclo').textContent = last ? `Corte: ${last.cutDate.toISOString().slice(0,10)}  Vence: ${last.dueDate.toISOString().slice(0,10)}` : '';
}
