import { state } from '../state/store.js';
import { money } from '../core/format.js';
import { computeAmortizationRows } from '../core/tcEngine.js';

export function renderHistorial() {
  const tbody = document.querySelector('#tablaHistorial tbody');
  const cards = document.getElementById('cardsHistorial');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  const { rows } = computeAmortizationRows(state, new Date(), 18);
  const last12 = [...rows].sort((a,b)=>b.cutDate-a.cutDate).slice(0, 12);

  last12.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.cutDate.toISOString().slice(0,10)}</td>
      <td>${r.dueDate.toISOString().slice(0,10)}</td>
      <td>${money(r.saldoCorte)}</td>
      <td>${money(r.pagosATiempo)}</td>
      <td>${r.pagoTotal ? 'Sí' : 'No'}</td>
      <td>${money(r.interesPeriodo)}</td>
      <td>${money(r.saldoPostPago)}</td>
    `;
    tbody.appendChild(tr);

    const card = document.createElement('div');
    card.className = 'cardItem';
    card.innerHTML = `
      <div class="cardItemTop">
        <div>
          <div class="cardItemTitle">Corte ${r.cutDate.toISOString().slice(0,10)}</div>
          <div class="cardItemSub">Vence ${r.dueDate.toISOString().slice(0,10)} • ${r.pagoTotal ? 'Pagó total' : 'No pagó total'}</div>
        </div>
      </div>
      <div class="cardItemGrid">
        <div><span class="pill">Saldo</span><div>${money(r.saldoCorte)}</div></div>
        <div><span class="pill">Pagos</span><div>${money(r.pagosATiempo)}</div></div>
        <div><span class="pill">Interés</span><div>${money(r.interesPeriodo)}</div></div>
        <div><span class="pill">Post pago</span><div>${money(r.saldoPostPago)}</div></div>
      </div>
    `;
    cards.appendChild(card);
  });
}
