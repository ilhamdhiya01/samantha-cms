// minimal modal helpers using window.confirm/alert to avoid bundling extra deps for CRUD pages
export function confirmDelete(message: string) {
  return typeof window !== 'undefined' ? window.confirm(message) : false;
}
export function alert(message: string) {
  if (typeof window !== 'undefined') window.alert(message);
}
