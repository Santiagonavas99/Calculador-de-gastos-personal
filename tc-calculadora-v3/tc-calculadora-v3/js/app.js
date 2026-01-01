import { initNav } from './ui/nav.js';
import { initConfigUI } from './ui/config.js';
import { initGastosUI } from './ui/gastos.js';
import { initPagosUI } from './ui/pagos.js';
import { initSimuladorUI } from './ui/simulador.js';
import { renderAll } from './ui/renderAll.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initConfigUI();
  initGastosUI();
  initPagosUI();
  initSimuladorUI();
  renderAll();
});
