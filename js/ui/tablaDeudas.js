import { state, updateGasto, removeGasto } from '../state/store.js';
import { money } from '../core/format.js';
import { cuotaDelMesCuotas, deudaRestanteCuotas } from '../core/finance.js';
import { TYPE_LABEL } from './helpers.js';
import { renderAll } from './renderAll.js';

function tipoLabel(t) { return TYPE_LABEL[t] || t; }

export function renderTablaDeudas() {
  const tbody = document.querySelector('#tablaDeudas tbody');
  const cards = document.getElementById('cardsDeudas');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  state.gastos.forEach((g, idx) => {
    const tipo = g.tipo || 'una_cuota';
    const n = Number(g.cuotas || 1);

    let cuotaMes = '-';
    let saldo = money(g.monto);

    // Solo mostrar cuota y saldo para compras a cuotas (no para una_cuota)
    if ((tipo === 'cuotas_sin_interes' || tipo === 'cuotas_con_interes') && n > 1) {
      cuotaMes = money(cuotaDelMesCuotas(g));
      saldo = money(deudaRestanteCuotas(g));
    }

    // table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="edit-entidad" data-idx="${idx}" value="${(g.entidad||'').replace(/"/g,'&quot;')}" /></td>
      <td>
        <select class="edit-tipo" data-idx="${idx}">
          <option value="una_cuota" ${tipo==='una_cuota'?'selected':''}>Una cuota</option>
          <option value="cuotas_sin_interes" ${tipo==='cuotas_sin_interes'?'selected':''}>Cuotas sin interés</option>
          <option value="cuotas_con_interes" ${tipo==='cuotas_con_interes'?'selected':''}>Cuotas con interés</option>
        </select>
      </td>
      <td>${money(g.monto)}</td>
      <td><input type="number" class="edit-cuotas" data-idx="${idx}" min="1" value="${n}" /></td>
      <td><input type="number" class="edit-tasa" data-idx="${idx}" min="0" step="0.01" value="${Number(g.tasaMensual||0)}" ${tipo==='cuotas_con_interes'?'':'disabled'} /></td>
      <td>${cuotaMes}</td>
      <td>${saldo}</td>
      <td><input type="number" class="edit-pagadas" data-idx="${idx}" min="0" step="1" value="${g.cuotasPagadas ?? ''}" placeholder="auto" ${tipo==='una_cuota'?'disabled':''} /></td>
      <td><button class="btn-mini btn-del" data-idx="${idx}">🗑️</button></td>
    `;
    tbody.appendChild(tr);

    // card (mobile)
    const card = document.createElement('div');
    card.className = 'cardItem';
    card.innerHTML = `
      <div class="cardItemTop">
        <div>
          <div class="cardItemTitle">${(g.entidad||'Genérico')}</div>
          <div class="cardItemSub">${tipoLabel(tipo)} • ${g.fecha}</div>
        </div>
        <button class="ghost btn-del" data-idx="${idx}">🗑️</button>
      </div>
      <div class="cardItemGrid">
        <div><span class="pill">Monto</span><div>${money(g.monto)}</div></div>
        <div><span class="pill">Cuotas</span><div>${n}</div></div>
        <div><span class="pill">Cuota mes</span><div>${cuotaMes}</div></div>
        <div><span class="pill">Saldo</span><div>${saldo}</div></div>
      </div>
      <div class="divider"></div>
      <div class="grid2">
        <label>Entidad
          <input type="text" class="edit-entidad" data-idx="${idx}" value="${(g.entidad||'').replace(/"/g,'&quot;')}" />
        </label>
        <label>Tipo
          <select class="edit-tipo" data-idx="${idx}">
            <option value="una_cuota" ${tipo==='una_cuota'?'selected':''}>Una cuota</option>
            <option value="cuotas_sin_interes" ${tipo==='cuotas_sin_interes'?'selected':''}>Cuotas sin interés</option>
            <option value="cuotas_con_interes" ${tipo==='cuotas_con_interes'?'selected':''}>Cuotas con interés</option>
          </select>
        </label>
        <label>Cuotas
          <input type="number" class="edit-cuotas" data-idx="${idx}" min="1" value="${n}" />
        </label>
        <label>Tasa mensual (%)
          <input type="number" class="edit-tasa" data-idx="${idx}" min="0" step="0.01" value="${Number(g.tasaMensual||0)}" ${tipo==='cuotas_con_interes'?'':'disabled'} />
        </label>
        <label>Cuotas pagadas
          <input type="number" class="edit-pagadas" data-idx="${idx}" min="0" step="1" value="${g.cuotasPagadas ?? ''}" placeholder="auto" ${tipo==='una_cuota'?'disabled':''} />
        </label>
      </div>
    `;
    cards.appendChild(card);
  });

  // bind events (table + cards share same classes)
  document.querySelectorAll('.edit-entidad').forEach(el => {
    el.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      updateGasto(idx, { entidad: e.target.value });
      renderAll();
    });
  });

  document.querySelectorAll('.edit-tipo').forEach(el => {
    el.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const newTipo = e.target.value;
      const current = state.gastos[idx];
      const cuotas = Number(current.cuotas || 1);
      let tipo = newTipo;
      if (cuotas === 1 && newTipo !== 'una_cuota') {
        tipo = 'una_cuota';
      }
      updateGasto(idx, { tipo, tasaMensual: tipo === 'cuotas_con_interes' ? Number(current.tasaMensual||0) : 0 });
      renderAll();
    });
  });

  document.querySelectorAll('.edit-cuotas').forEach(el => {
    el.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const cuotas = Math.max(1, Number(e.target.value) || 1);
      const current = state.gastos[idx];
      let tipo = current.tipo || 'una_cuota';
      if (cuotas === 1) {
        tipo = 'una_cuota';
      } else if (cuotas > 1 && tipo === 'una_cuota') {
        tipo = 'cuotas_sin_interes';
      }
      updateGasto(idx, { cuotas, tipo });
      renderAll();
    });
  });

  document.querySelectorAll('.edit-tasa').forEach(el => {
    el.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      updateGasto(idx, { tasaMensual: Number(e.target.value) || 0 });
      renderAll();
    });
  });

  document.querySelectorAll('.edit-pagadas').forEach(el => {
    el.addEventListener('change', e => {
      const idx = Number(e.target.dataset.idx);
      const v = e.target.value;
      updateGasto(idx, { cuotasPagadas: v === '' ? null : Math.max(0, Number(v) || 0) });
      renderAll();
    });
  });

  document.querySelectorAll('.btn-del').forEach(el => {
    el.addEventListener('click', e => {
      const idx = Number(e.target.dataset.idx);
      removeGasto(idx);
      renderAll();
    });
  });
}
