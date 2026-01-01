import { state } from '../state/store.js';
import { money, bindMoneyInput, parseMoneyInput } from '../core/format.js';
import { pmt, saldoRestanteAmortizado } from '../core/finance.js';
import { computeAmortizationRows, cutDateForPurchase } from '../core/tcEngine.js';
import { byId, fmtDateISO } from './helpers.js';

export function initSimuladorUI() {
  bindMoneyInput(byId('montoSimulado'));
  byId('fechaSimulada').value = fmtDateISO(new Date());

  byId('simular').addEventListener('click', () => {
    const entidad = (byId('entidadSimulada').value || 'Simulado').trim();
    const tipo = byId('tipoSimulado').value;
    const monto = parseMoneyInput(byId('montoSimulado').value);
    const cuotas = Number(byId('cuotasSimuladas').value) || 1;
    const tasaMensual = Number(byId('tasaSimulada').value) || 0;
    const fecha = byId('fechaSimulada').value;

    if (!monto || !fecha || cuotas < 1) {
      byId('resultadoSimulacion').textContent = 'Completa monto, fecha y cuotas.';
      return;
    }

    const fixedTipo = (cuotas <= 1) ? 'revolving' : tipo;

    // info TC real: a qué corte caería
    let corteInfo = '';
    if (fixedTipo === 'revolving') {
      const cut = cutDateForPurchase(state.config, fecha);
      corteInfo = cut ? `• Esta compra caería en el corte: ${cut.toISOString().slice(0,10)}` : '• No pude determinar el corte.';
    }

    // cuotas calc
    let cuotaMes = '-';
    let interesesTot = '-';
    if (fixedTipo !== 'revolving' && cuotas > 1) {
      if (fixedTipo === 'cuotas_sin_interes') {
        cuotaMes = money(monto / cuotas);
        interesesTot = money(0);
      } else {
        const r = tasaMensual / 100;
        const c = pmt(r, cuotas, monto);
        cuotaMes = money(c);
        interesesTot = money((c * cuotas) - monto);
      }
    }

    const engine = computeAmortizationRows(state, new Date(), 18);
    const balanceHoy = engine.ledger[engine.ledger.length - 1]?.balance ?? 0;
    const balanceSim = Number(balanceHoy || 0) + (fixedTipo === 'revolving' ? monto : 0);

    let msg =
      `📊 Simulación\n` +
      `• Entidad: ${entidad}\n` +
      `• Tipo: ${fixedTipo}\n` +
      `• Monto: ${money(monto)}\n` +
      (corteInfo ? `${corteInfo}\n` : '') +
      `• Balance TC (aprox) hoy: ${money(balanceHoy)}\n` +
      `• Balance TC si haces esto: ${money(balanceSim)}\n`;

    if (fixedTipo !== 'revolving') {
      msg +=
        `• Cuota mes: ${cuotaMes}\n` +
        `• Intereses totales: ${interesesTot}\n`;
      if (fixedTipo === 'cuotas_con_interes' && cuotas > 1) {
        const r = tasaMensual / 100;
        msg += `• Saldo inicial amortizado: ${money(saldoRestanteAmortizado(monto, r, cuotas, 0))}\n`;
      }
    }

    byId('resultadoSimulacion').textContent = msg;
  });
}
