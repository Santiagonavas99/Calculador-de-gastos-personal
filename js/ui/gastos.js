import { addGasto } from '../state/store.js';
import { bindMoneyInput, parseMoneyInput } from '../core/format.js';
import { byId, fmtDateISO } from './helpers.js';
import { renderAll } from './renderAll.js';

function uuid() {
  return (crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2)));
}

export function initGastosUI() {
  bindMoneyInput(byId('montoGasto'));

  byId('fechaGasto').value = fmtDateISO(new Date());

  byId('agregarGasto').addEventListener('click', () => {
    const entidad = (byId('entidadGasto').value || 'Genérico').trim();
    const tipo = byId('tipoGasto').value;
    const monto = parseMoneyInput(byId('montoGasto').value);
    const fecha = byId('fechaGasto').value;
    const cuotas = Number(byId('cuotasGasto').value) || 1;
    const tasaMensual = Number(byId('tasaMensualGasto').value) || 0;

    if (!monto || !fecha || cuotas < 1) return;

    let fixedTipo = tipo;
    if (cuotas === 1) {
      fixedTipo = 'una_cuota';
    }

    addGasto({
      id: uuid(),
      entidad,
      tipo: fixedTipo,
      monto,
      fecha,
      cuotas: 1,
      tasaMensual: fixedTipo === 'cuotas_con_interes' ? tasaMensual : 0,
      cuotasPagadas: null
    });

    byId('entidadGasto').value = '';
    byId('montoGasto').value = '';
    byId('cuotasGasto').value = 1;
    byId('tasaMensualGasto').value = 0;

    renderAll();
  });
}
