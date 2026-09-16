// Formateo compartido por las pantallas.

export const fecha = (f) => (f ? f.split('-').reverse().join('/') : '-');

export const pesos = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

// Arma el domicilio salteando las partes vacias, para que no queden
// espacios sueltos ni comas colgando cuando falta piso o altura.
export function domicilio({ calle, numero, piso_depto, localidad, provincia }) {
  const linea = [calle, numero, piso_depto].filter(Boolean).join(' ');
  return [linea, localidad, provincia].filter(Boolean).join(', ');
}
