// Envoltorio unico sobre fetch: arma la URL, manda JSON y levanta el
// mensaje de error del backend para mostrarlo tal cual en pantalla.
async function pedir(url, opciones = {}) {
  const r = await fetch(`/api${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'Error de conexion con el servidor');
  return datos;
}

const qs = (params) => {
  const limpio = Object.entries(params || {}).filter(([, v]) => v !== '' && v != null);
  return limpio.length ? '?' + new URLSearchParams(limpio) : '';
};

export const api = {
  clientes: {
    listar: (f) => pedir(`/clientes${qs(f)}`),
    obtener: (id) => pedir(`/clientes/${id}`),
    crear: (body) => pedir('/clientes', { method: 'POST', body }),
    actualizar: (id, body) => pedir(`/clientes/${id}`, { method: 'PUT', body }),
    borrar: (id) => pedir(`/clientes/${id}`, { method: 'DELETE' }),
  },
  direcciones: {
    listar: (f) => pedir(`/direcciones${qs(f)}`),
    crear: (body) => pedir('/direcciones', { method: 'POST', body }),
    actualizar: (id, body) => pedir(`/direcciones/${id}`, { method: 'PUT', body }),
    borrar: (id) => pedir(`/direcciones/${id}`, { method: 'DELETE' }),
  },
  matafuegos: {
    listar: (f) => pedir(`/matafuegos${qs(f)}`),
    obtener: (id) => pedir(`/matafuegos/${id}`),
    crear: (body) => pedir('/matafuegos', { method: 'POST', body }),
    actualizar: (id, body) => pedir(`/matafuegos/${id}`, { method: 'PUT', body }),
    borrar: (id) => pedir(`/matafuegos/${id}`, { method: 'DELETE' }),
  },
  mantenimientos: {
    crear: (body) => pedir('/mantenimientos', { method: 'POST', body }),
    borrar: (id) => pedir(`/mantenimientos/${id}`, { method: 'DELETE' }),
  },
  alertas: {
    listar: (dias) => pedir(`/alertas${qs({ dias })}`),
  },
};
