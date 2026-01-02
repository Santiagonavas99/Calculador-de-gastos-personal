import { clampDay, addDays, startOfDay, iso, betweenInclusive } from './dates.js';

// EA -> tasa efectiva diaria (365)
export function dailyRateFromEA(tasaEA_pct) {
  const ea = Math.max(0, Number(tasaEA_pct || 0)) / 100;
  return Math.pow(1 + ea, 1/365) - 1;
}

export function buildCycles(config, fromDate, toDate) {
  const diaCorte = Number(config.diaCorte || 25);
  const diaPago = Number(config.diaPago || 5);

  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);

  const start = new Date(from.getFullYear(), from.getMonth() - 2, 1);
  const end = new Date(to.getFullYear(), to.getMonth() + 2, 1);

  const cutDates = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const mStart = (y === start.getFullYear()) ? start.getMonth() : 0;
    const mEnd = (y === end.getFullYear()) ? end.getMonth() : 11;
    for (let m = mStart; m <= mEnd; m++) {
      cutDates.push(startOfDay(clampDay(y, m, diaCorte)));
    }
  }
  cutDates.sort((a,b)=>a-b);

  const cycles = [];
  for (let i = 1; i < cutDates.length; i++) {
    const cutDate = cutDates[i];
    const prevCut = cutDates[i-1];
    const periodStart = addDays(prevCut, 1);
    const periodEnd = cutDate;

    const dueMonthRaw = (diaPago > diaCorte) ? cutDate.getMonth() : (cutDate.getMonth() + 1);
    const dueYear = (dueMonthRaw > 11) ? (cutDate.getFullYear() + 1) : cutDate.getFullYear();
    const dueMonth = (dueMonthRaw > 11) ? (dueMonthRaw - 12) : dueMonthRaw;
    const dueDate = startOfDay(clampDay(dueYear, dueMonth, diaPago));

    cycles.push({ cutDate, dueDate, periodStart, periodEnd, key: iso(cutDate) });
  }

  const filtered = cycles.filter(c => c.periodEnd >= from && c.periodStart <= to);
  return filtered;
}

export function normalizeTransactions(state) {
  const tx = [];
  for (const g of (state.gastos || [])) {
    const tipo = g.tipo || 'revolving';
    if (tipo === 'revolving') {
      tx.push({
        date: startOfDay(new Date(g.fecha)),
        amount: Number(g.monto || 0),
        kind: 'purchase',
        id: g.id,
        entidad: g.entidad || 'Genérico'
      });
    }
  }
  for (const p of (state.pagos || [])) {
    tx.push({
      date: startOfDay(new Date(p.fecha)),
      amount: -Math.abs(Number(p.monto || 0)),
      kind: 'payment',
      id: p.id
    });
  }
  tx.sort((a,b)=>a.date-b.date);
  return tx;
}

export function ledgerDaily(transactions, fromDate, toDate) {
  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);

  const deltaByDay = new Map();
  for (const t of transactions) {
    const k = iso(t.date);
    deltaByDay.set(k, (deltaByDay.get(k) || 0) + Number(t.amount || 0));
  }

  const out = [];
  let bal = 0;
  for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
    const k = iso(d);
    bal += (deltaByDay.get(k) || 0);
    out.push({ date: startOfDay(d), delta: deltaByDay.get(k) || 0, balance: bal });
  }
  return out;
}

export function balanceAt(ledger, date) {
  const k = iso(date);
  const row = ledger.find(r => iso(r.date) === k);
  return row ? Number(row.balance || 0) : 0;
}

export function sumPayments(transactions, start, end) {
  return transactions
    .filter(t => t.kind === 'payment' && betweenInclusive(t.date, start, end))
    .reduce((s,t)=>s + Math.abs(Number(t.amount || 0)), 0);
}

export function interestBetween(ledger, dailyRate, start, end, extraPayment = 0, extraPaymentDate = null) {
  let sum = 0;
  for (const r of ledger) {
    if (!betweenInclusive(r.date, start, end)) continue;
    let bal = Number(r.balance || 0);
    if (extraPaymentDate && startOfDay(r.date) >= startOfDay(extraPaymentDate)) {
      bal -= Number(extraPayment || 0);
    }
    sum += Math.max(0, bal) * dailyRate;
  }
  return sum;
}

export function computeAmortizationRows(state, today = new Date(), monthsBack = 18) {
  const t = startOfDay(today);
  const from = new Date(t.getFullYear(), t.getMonth() - monthsBack, 1);
  const to = new Date(t.getFullYear(), t.getMonth() + 2, 28);

  const dailyRate = dailyRateFromEA(state.config?.tasaEA ?? 0);
  const cycles = buildCycles(state.config || {}, from, to);
  const tx = normalizeTransactions(state);
  const led = ledgerDaily(tx, from, to);

  const rows = [];
  for (let i = 0; i < cycles.length; i++) {
    const c = cycles[i];
    const nextCut = (i + 1 < cycles.length) ? cycles[i+1].cutDate : addDays(c.cutDate, 30);

    const saldoCorte = balanceAt(led, c.cutDate);
    const pagosATiempo = sumPayments(tx, addDays(c.cutDate, 1), c.dueDate);
    const pagoTotal = (saldoCorte <= 0) ? true : (pagosATiempo >= saldoCorte);

    const interesPeriodo = (!pagoTotal && saldoCorte > 0)
      ? interestBetween(led, dailyRate, addDays(c.cutDate, 1), nextCut)
      : 0;

    const saldoPostPago = Math.max(0, saldoCorte - pagosATiempo);

    rows.push({ ...c, nextCut, saldoCorte, pagosATiempo, pagoTotal, interesPeriodo, saldoPostPago });
  }

  return { rows, dailyRate, ledger: led, transactions: tx };
}

export function latestCycleForToday(rows, today = new Date()) {
  const t = startOfDay(today);
  // Buscar el ciclo cuyo período incluya "hoy"
  const current = rows.find(r => betweenInclusive(t, r.periodStart, r.periodEnd));
  if (current) return current;
  // Si no hay ciclo actual (caso raro), devolver el más cercano anterior
  const past = rows.filter(r => r.cutDate <= t);
  if (!past.length) return rows[0] || null;
  past.sort((a,b)=>b.cutDate-a.cutDate);
  return past[0];
}

export function nextCycleAfter(rows, cutDate) {
  const sorted = [...rows].sort((a,b)=>a.cutDate-b.cutDate);
  const idx = sorted.findIndex(r => iso(r.cutDate) === iso(cutDate));
  return (idx >= 0 && idx + 1 < sorted.length) ? sorted[idx+1] : null;
}

// Simulación de interés del próximo período para un ciclo dado:
// si pagas total del estado antes de vencer -> interés 0
// si pagas X (parcial) -> interés diario sobre saldo diario del período (corte+1..nextCut), aplicando el pago adicional en dueDate
export function simulateNextPeriodInterest(engine, cycleRow, extraPaymentOnDue = 0) {
  if (!cycleRow) return { interest: 0, financed: 0 };
  const saldoCorte = Number(cycleRow.saldoCorte || 0);
  const financed = Math.max(0, saldoCorte - Number(cycleRow.pagosATiempo || 0) - Number(extraPaymentOnDue || 0));

  const wouldPayTotal = (saldoCorte <= 0) ? true : (Number(cycleRow.pagosATiempo || 0) + Number(extraPaymentOnDue || 0) >= saldoCorte);
  if (wouldPayTotal) return { interest: 0, financed: 0 };

  const interest = interestBetween(
    engine.ledger,
    engine.dailyRate,
    addDays(cycleRow.cutDate, 1),
    cycleRow.nextCut,
    extraPaymentOnDue,
    cycleRow.dueDate
  );
  return { interest, financed };
}

// Helper: devuelve a qué corte caerá una compra (solo para info UI)
export function cutDateForPurchase(config, purchaseDate) {
  const d = startOfDay(new Date(purchaseDate));
  const cycles = buildCycles(config, new Date(d.getFullYear(), d.getMonth()-2, 1), new Date(d.getFullYear(), d.getMonth()+2, 28));
  const c = cycles.find(x => betweenInclusive(d, x.periodStart, x.periodEnd));
  return c ? c.cutDate : null;
}

import { deudaRestanteCuotas, cuotaDelMesCuotas, pmt } from './finance.js';

/**
 * Pago mínimo real:
 * - suma cuotas del mes (cuotas con o sin interés)
 * - + compras revolving hechas a 1 cuota en el corte
 */
export function pagoMinimoReal(state, cycleRow) {
  if (!cycleRow) return 0;

  const corteInicio = cycleRow.periodStart;
  const corteFin = cycleRow.periodEnd;

  let total = 0;

    // 1. Cuotas del mes (solo la cuota correspondiente al mes actual)
    for (const gasto of (state.gastos || [])) {
      if (
        (gasto.tipo === 'cuotas_sin_interes' || gasto.tipo === 'cuotas_con_interes') &&
        Number(gasto.cuotas || 1) > 1
      ) {
        const fechaCompra = new Date(gasto.fecha);
        // La cuota entra si la compra fue hecha antes o durante el periodo de corte
        if (fechaCompra <= corteFin) {
          const n = Number(gasto.cuotas || 1);
          const pv = Number(gasto.monto || 0);
          if (gasto.tipo === 'cuotas_sin_interes') {
            total += pv / n;
          } else {
            const r = (Number(gasto.tasaMensual || 0) / 100);
            total += pmt(r, n, pv);
          }
        }
      }
    }

  // 2️⃣ Compras a 1 cuota en el corte
  for (const g of state.gastos) {
    if (
      g.tipo === 'revolving' &&
      Number(g.cuotas || 1) === 1
    ) {
      const fecha = new Date(g.fecha);
      if (fecha >= corteInicio && fecha <= corteFin) {
        total += Number(g.monto || 0);
      }
    }
  }

  return Math.max(0, total);
}