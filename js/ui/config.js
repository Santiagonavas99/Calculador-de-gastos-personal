import { state, updateConfig } from '../state/store.js';
import { bindMoneyInput, parseMoneyInput, compactNumber } from '../core/format.js';
import { byId } from './helpers.js';
import { renderAll } from './renderAll.js';

export function initConfigUI() {
  bindMoneyInput(byId('cupoTotal'));
  bindMoneyInput(byId('pagoMinFijo'));

  byId('cupoTotal').value = compactNumber(state.config.cupoTotal || 0);
  byId('tasaEA').value = Number(state.config.tasaEA ?? 40);
  byId('diaCorte').value = Number(state.config.diaCorte ?? 25);
  byId('diaPago').value = Number(state.config.diaPago ?? 5);
  byId('pagoMinPct').value = Number(state.config.pagoMinPct ?? 5);
  byId('pagoMinFijo').value = compactNumber(state.config.pagoMinFijo ?? 50000);

  byId('guardarConfig').addEventListener('click', () => {
    updateConfig({
      cupoTotal: parseMoneyInput(byId('cupoTotal').value),
      tasaEA: Number(byId('tasaEA').value) || 0,
      diaCorte: Number(byId('diaCorte').value) || 25,
      diaPago: Number(byId('diaPago').value) || 5,
      pagoMinPct: Number(byId('pagoMinPct').value) || 5,
      pagoMinFijo: parseMoneyInput(byId('pagoMinFijo').value)
    });
    renderAll();
  });
}
