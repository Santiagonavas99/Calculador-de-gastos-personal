const KEY = 'tc_app_v3';

const defaultState = {
  config: {
    cupoTotal: 0,
    tasaEA: 40,      // % efectiva anual
    diaCorte: 25,
    diaPago: 5,
    riesgo: { verde: 0.60, amarillo: 0.85 }
  },
  gastos: [],
  pagos: []
};

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      config: { ...structuredClone(defaultState.config), ...(parsed.config || {}) },
      gastos: Array.isArray(parsed.gastos) ? parsed.gastos : [],
      pagos: Array.isArray(parsed.pagos) ? parsed.pagos : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const state = loadState();

export function updateConfig(patch) {
  state.config = { ...state.config, ...patch };
  saveState(state);
}

export function addGasto(gasto) {
  state.gastos.push(gasto);
  saveState(state);
}

export function updateGasto(idx, patch) {
  state.gastos[idx] = { ...state.gastos[idx], ...patch };
  saveState(state);
}

export function removeGasto(idx) {
  state.gastos.splice(idx, 1);
  saveState(state);
}

export function addPago(pago) {
  state.pagos.push(pago);
  // ordenar por fecha para que el historial sea consistente
  state.pagos.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  saveState(state);
}

export function removePago(idx) {
  state.pagos.splice(idx, 1);
  saveState(state);
}
