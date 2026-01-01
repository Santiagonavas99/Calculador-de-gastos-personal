import { renderResumen } from './resumen.js';
import { renderTablaDeudas } from './tablaDeudas.js';
import { renderPagos } from './pagos.js';
import { renderHistorial } from './historial.js';
import { renderCharts } from './charts.js';

export function renderAll() {
  renderResumen();
  renderTablaDeudas();
  renderPagos();
  renderHistorial();
  renderCharts();
}
