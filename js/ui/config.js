import { state, updateConfig } from '../state/store.js';
import { bindMoneyInput, parseMoneyInput, compactNumber } from '../core/format.js';
import { byId } from './helpers.js';
import { renderAll } from './renderAll.js';

export function initConfigUI() {
  bindMoneyInput(byId('cupoTotal'));

  byId('cupoTotal').value = compactNumber(state.config.cupoTotal || 0);
  byId('tasaEA').value = Number(state.config.tasaEA ?? 40);
  byId('diaCorte').value = Number(state.config.diaCorte ?? 25);
  byId('diaPago').value = Number(state.config.diaPago ?? 5);

  byId('guardarConfig').addEventListener('click', () => {
    updateConfig({
      cupoTotal: parseMoneyInput(byId('cupoTotal').value),
      tasaEA: Number(byId('tasaEA').value) || 0,
      diaCorte: Number(byId('diaCorte').value) || 25,
      diaPago: Number(byId('diaPago').value) || 5
    });
    renderAll();
  });
}
