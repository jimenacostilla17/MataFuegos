// Envuelve una ruta async para que cualquier error llegue al manejador de Express.
export const ruta = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Corta la ejecucion con un codigo HTTP y un mensaje para el usuario.
export function fallar(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  e.mensaje = mensaje;
  throw e;
}

// Anios que agrega cada tipo de mantenimiento al vencimiento.
const ANIOS_POR_TIPO = { recarga: 1, prueba_hidraulica: 5 };

export function calcularVencimiento(tipo, fecha) {
  const anios = ANIOS_POR_TIPO[tipo];
  if (!anios) fallar(400, 'Tipo de mantenimiento invalido');
  const [a, m, d] = fecha.split('-').map(Number);
  const venc = new Date(Date.UTC(a + anios, m - 1, d));
  return venc.toISOString().slice(0, 10);
}

// Proximo vencimiento de un matafuego: el mas cercano entre el ultimo
// vencimiento de cada tipo de mantenimiento. SQL reutilizable.
export const SQL_PROXIMO_VENCIMIENTO = `
  (SELECT MIN(t.venc)
     FROM (SELECT matafuego_id, tipo, MAX(fecha_vencimiento) AS venc
             FROM mantenimientos GROUP BY matafuego_id, tipo) t
    WHERE t.matafuego_id = m.id)`;
