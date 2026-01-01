import { state } from '../state/store.js';
import { money } from '../core/format.js';
import { cuotaDelMesCuotas } from '../core/finance.js';
import { computeAmortizationRows, latestCycleForToday, simulateNextPeriodInterest, pagoMinimoMonto } from '../core/tcEngine.js';

let deudaChart = null;
let timelineChart = null;

function groupByEntidad(gastos) {
  const map = new Map();
  gastos.forEach(g => {
    const k = (g.entidad || 'Genérico').trim() || 'Genérico';
    map.set(k, (map.get(k) || 0) + Number(g.monto || 0));
  });
  return map;
}

function monthlyLabels(months = 12, from = new Date()) {
  const base = new Date(from.getFullYear(), from.getMonth(), 1);
  const labels = [];
  for (let i=0;i<months;i++){
    const d = new Date(base.getFullYear(), base.getMonth()+i, 1);
    labels.push(d.toLocaleString('es-CO', { month: 'short', year: '2-digit' }));
  }
  return labels;
}

function cuotasPerMonth(gastos, months = 12, from = new Date()) {
  const base = new Date(from.getFullYear(), from.getMonth(), 1);
  const values = Array.from({ length: months }, () => 0);

  gastos.forEach(g => {
    const tipo = g.tipo || 'revolving';
    if (tipo === 'revolving') return;
    const n = Number(g.cuotas || 1);
    if (n <= 1) return;

    const start = new Date(g.fecha);
    const startIdx = (start.getFullYear()-base.getFullYear())*12 + (start.getMonth()-base.getMonth());
    const cuota = cuotaDelMesCuotas({ ...g, cuotasPagadas: 0 }, base);

    for (let k=0;k<n;k++){
      const idx = startIdx + k;
      if (idx >= 0 && idx < months) values[idx] += cuota;
    }
  });

  return values;
}

export function renderCharts() {
  renderDeudaEntidad();
  renderTimeline();
}

function renderDeudaEntidad() {
  const el = document.getElementById('chartDeudaEntidad');
  if (!el) return;

  const grouped = groupByEntidad(state.gastos || []);
  const labels = [...grouped.keys()];
  const values = [...grouped.values()];

  if (deudaChart) deudaChart.destroy();
  deudaChart = new Chart(el, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values }] },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${money(ctx.raw)}` } }
      }
    }
  });
}

function renderTimeline() {
  const el = document.getElementById('chartTimeline');
  if (!el) return;

  const months = 12;
  const labels = monthlyLabels(months, new Date());
  const cuotasVals = cuotasPerMonth(state.gastos || [], months, new Date());

  // estimación interés del próximo período (si pagas mínimo) -> lo ponemos en el mes del próximo corte
  const engine = computeAmortizationRows(state, new Date(), 18);
  const last = latestCycleForToday(engine.rows, new Date());
  let interesMesArr = Array.from({ length: months }, () => 0);

  if (last) {
    const saldoCorte = Number(last.saldoCorte || 0);
    const pagos = Number(last.pagosATiempo || 0);
    const minPay = pagoMinimoMonto(saldoCorte, state.config.pagoMinPct, state.config.pagoMinFijo);
    const extraToMin = Math.max(0, minPay - pagos);
    const simMin = simulateNextPeriodInterest(engine, last, extraToMin);

    const base = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const idx = (last.nextCut.getFullYear()-base.getFullYear())*12 + (last.nextCut.getMonth()-base.getMonth());
    if (idx >= 0 && idx < months) interesMesArr[idx] = simMin.interest;
  }

  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(el, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Cuotas (aprox)', data: cuotasVals },
        { label: 'Interés TC (estimado)', data: interesMesArr, type: 'line' }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}` } }
      }
    }
  });
}
