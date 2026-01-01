export function clampDay(year, monthIndex, day) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const dd = Math.min(Math.max(1, Number(day || 1)), last);
  return new Date(year, monthIndex, dd);
}
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
export function iso(date) {
  return startOfDay(date).toISOString().slice(0,10);
}
export function betweenInclusive(d, start, end) {
  const x = startOfDay(d).getTime();
  return x >= startOfDay(start).getTime() && x <= startOfDay(end).getTime();
}
