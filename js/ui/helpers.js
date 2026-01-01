export function byId(id) { return document.getElementById(id); }

export function setKpiColor(el, clase) {
  el.classList.remove('ok', 'warn', 'danger');
  el.classList.add(clase);
}

export function fmtDateISO(date) {
  return new Date(date).toISOString().slice(0,10);
}

export const TYPE_LABEL = {
  revolving: 'Revolving',
  cuotas_sin_interes: 'Cuotas sin interés',
  cuotas_con_interes: 'Cuotas con interés'
};
