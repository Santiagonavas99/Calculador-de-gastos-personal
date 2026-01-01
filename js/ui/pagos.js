import { state, addPago, removePago } from '../state/store.js';
import { bindMoneyInput, parseMoneyInput, money } from '../core/format.js';
import { byId, fmtDateISO } from './helpers.js';
import { renderAll } from './renderAll.js';

function uuid() {
  return (crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2)));
}

export function initPagosUI() {
  bindMoneyInput(byId('montoPago'));
  byId('fechaPago').value = fmtDateISO(new Date());

  byId('agregarPago').addEventListener('click', () => {
    const monto = parseMoneyInput(byId('montoPago').value);
    const fecha = byId('fechaPago').value;
    if (!monto || !fecha) return;

    addPago({ id: uuid(), monto, fecha });

    byId('montoPago').value = '';
    renderAll();
  });
}

export function renderPagos() {
  const tbody = document.querySelector('#tablaPagos tbody');
  const cards = document.getElementById('cardsPagos');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  state.pagos.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.fecha}</td>
      <td>${money(p.monto)}</td>
      <td><button class="btn-mini btn-del-pago" data-idx="${idx}">🗑️</button></td>
    `;
    tbody.appendChild(tr);

    const card = document.createElement('div');
    card.className = 'cardItem';
    card.innerHTML = `
      <div class="cardItemTop">
        <div>
          <div class="cardItemTitle">${money(p.monto)}</div>
          <div class="cardItemSub">${p.fecha}</div>
        </div>
        <button class="ghost btn-del-pago" data-idx="${idx}">🗑️</button>
      </div>
    `;
    cards.appendChild(card);
  });

  document.querySelectorAll('.btn-del-pago').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = Number(e.target.dataset.idx);
      removePago(idx);
      renderAll();
    });
  });
}
