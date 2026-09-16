import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Modal, Campo, Error } from '../componentes.jsx';
import { fecha as formatear, pesos, domicilio } from '../formato.js';

export default function Ordenes() {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [verRemito, setVerRemito] = useState(null);

  const cargar = () => api.ordenes.listar().then(setFilas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  async function entregar(o) {
    try {
      await api.ordenes.entregar(o.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function anular(o) {
    if (!confirm(`Anular la orden ${o.numero}? Los insumos vuelven al stock.`)) return;
    try {
      await api.ordenes.borrar(o.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <div className="barra">
        <h2>Ordenes de servicio / Remitos</h2>
        <button className="primario" onClick={() => setCreando(true)}>Nueva orden</button>
      </div>
      <Error mensaje={error} />

      <table>
        <thead>
          <tr><th>Numero</th><th>Fecha</th><th>Cliente</th><th>Equipos</th><th>Total</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          {filas.map((o) => (
            <tr key={o.id}>
              <td><button className="enlace" onClick={() => setVerRemito(o.id)}>{o.numero}</button></td>
              <td>{formatear(o.fecha)}</td>
              <td>{o.razon_social} - {o.etiqueta}</td>
              <td>{o.cantidad_equipos}</td>
              <td>{pesos(o.total)}</td>
              <td>
                <span className={`etiqueta ${o.estado === 'entregada' ? 'verde' : 'amarilla'}`}>
                  {o.estado}
                </span>
              </td>
              <td className="acciones">
                {o.estado === 'pendiente' && <button onClick={() => entregar(o)}>Entregar</button>}
                <button className="peligro" onClick={() => anular(o)}>Anular</button>
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={7} className="vacio">Sin ordenes emitidas.</td></tr>}
        </tbody>
      </table>

      {creando && (
        <Formulario onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); cargar(); }} />
      )}
      {verRemito && <Remito id={verRemito} onCerrar={() => setVerRemito(null)} />}
    </section>
  );
}

function Formulario({ onCerrar, onGuardado }) {
  const [direcciones, setDirecciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [direccionId, setDireccionId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('Equipo cargado y controlado');
  const [equipos, setEquipos] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.direcciones.listar().then(setDirecciones).catch((e) => setError(e.message));
    api.insumos.listar().then(setInsumos).catch((e) => setError(e.message));
  }, []);

  // Al elegir la direccion se traen sus equipos con el ultimo trabajo hecho,
  // que es lo que se factura en el remito.
  useEffect(() => {
    setEquipos([]);
    if (!direccionId) return setEquiposDisponibles([]);
    api.matafuegos.listar({ direccion_id: direccionId })
      .then(async (lista) => {
        const fichas = await Promise.all(lista.map((m) => api.matafuegos.obtener(m.id)));
        setEquiposDisponibles(fichas);
      })
      .catch((e) => setError(e.message));
  }, [direccionId]);

  const direccion = direcciones.find((d) => String(d.id) === String(direccionId));

  function alternarEquipo(ficha) {
    setEquipos((prev) => {
      if (prev.some((e) => e.matafuego_id === ficha.id)) {
        return prev.filter((e) => e.matafuego_id !== ficha.id);
      }
      return [...prev, { matafuego_id: ficha.id, mantenimiento_id: ficha.historial[0]?.id ?? null }];
    });
  }

  const total = lineas.reduce((acc, l) => {
    const i = insumos.find((x) => String(x.id) === String(l.insumo_id));
    return acc + (i ? Number(i.precio_unitario) * Number(l.cantidad || 0) : 0);
  }, 0);

  async function guardar(e) {
    e.preventDefault();
    try {
      await api.ordenes.crear({
        cliente_id: direccion.cliente_id,
        direccion_id: Number(direccionId),
        fecha,
        observaciones,
        equipos,
        insumos: lineas.filter((l) => l.insumo_id && Number(l.cantidad) > 0),
      });
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal titulo="Nueva orden de servicio" onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <div className="fila">
          <Campo
            etiqueta="Cliente / Direccion"
            valor={direccionId}
            onChange={setDireccionId}
            opciones={direcciones.map((d) => ({
              valor: d.id,
              texto: `${d.razon_social} - ${d.etiqueta}`,
            }))}
          />
          <Campo etiqueta="Fecha" tipo="date" valor={fecha} onChange={setFecha} />
        </div>

        <h4>Equipos entregados</h4>
        {equiposDisponibles.length === 0 ? (
          <p className="vacio">
            {direccionId ? 'Esa direccion no tiene equipos cargados.' : 'Elegi un cliente para ver sus equipos.'}
          </p>
        ) : (
          <table>
            <thead><tr><th></th><th>Tarjeta</th><th>Equipo</th><th>Ultimo trabajo</th></tr></thead>
            <tbody>
              {equiposDisponibles.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={equipos.some((e) => e.matafuego_id === m.id)}
                      onChange={() => alternarEquipo(m)}
                    />
                  </td>
                  <td>{m.numero_tarjeta}</td>
                  <td>{m.tipo_agente} {m.capacidad} {m.unidad_capacidad}</td>
                  <td>
                    {m.historial[0]
                      ? `${m.historial[0].tipo === 'recarga' ? 'Recarga' : 'Prueba hidraulica'} del ${formatear(m.historial[0].fecha)}`
                      : 'Sin mantenimientos'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4>Insumos consumidos</h4>
        {lineas.map((l, idx) => (
          <div className="fila" key={idx}>
            <Campo
              etiqueta="Insumo"
              valor={l.insumo_id}
              onChange={(v) => setLineas((p) => p.map((x, i) => (i === idx ? { ...x, insumo_id: v } : x)))}
              opciones={insumos.map((i) => ({
                valor: i.id,
                texto: `${i.nombre} (${Number(i.stock)} ${i.unidad_medida} - ${pesos(i.precio_unitario)})`,
              }))}
            />
            <Campo
              etiqueta="Cantidad"
              tipo="number"
              step="0.01"
              valor={l.cantidad}
              onChange={(v) => setLineas((p) => p.map((x, i) => (i === idx ? { ...x, cantidad: v } : x)))}
            />
            <button type="button" className="peligro quitar" onClick={() => setLineas((p) => p.filter((_, i) => i !== idx))}>
              Quitar
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLineas((p) => [...p, { insumo_id: '', cantidad: '' }])}>
          Agregar insumo
        </button>

        <p className="total">Total: {pesos(total)}</p>
        <Campo etiqueta="Observaciones" valor={observaciones} onChange={setObservaciones} />
        <Error mensaje={error} />
        <div className="acciones-modal">
          <button type="button" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="primario" disabled={equipos.length === 0}>Emitir orden</button>
        </div>
      </form>
    </Modal>
  );
}

function Remito({ id, onCerrar }) {
  const [orden, setOrden] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.ordenes.obtener(id).then(setOrden).catch((e) => setError(e.message));
  }, [id]);

  if (!orden) return <Modal titulo="Remito" onCerrar={onCerrar}><Error mensaje={error} /></Modal>;

  return (
    <Modal titulo={`Remito ${orden.numero}`} onCerrar={onCerrar}>
      <div className="remito">
        <div className="remito-cabecera">
          <div>
            <h3>Orden de servicio / Remito de entrega</h3>
            <p>{orden.numero} &middot; {formatear(orden.fecha)}</p>
          </div>
          <span className="etiqueta">{orden.estado}</span>
        </div>

        <dl className="ficha">
          <div><dt>Cliente</dt><dd>{orden.razon_social}</dd></div>
          <div><dt>CUIT / DNI</dt><dd>{orden.documento || '-'}</dd></div>
          <div><dt>Direccion</dt><dd>{orden.etiqueta} - {domicilio({ ...orden, numero: orden.direccion_numero })}</dd></div>
          <div><dt>Telefono</dt><dd>{orden.telefono || '-'}</dd></div>
        </dl>

        <h4>Equipos entregados</h4>
        <table>
          <thead><tr><th>Tarjeta</th><th>Equipo</th><th>Trabajo realizado</th><th>Proximo vencimiento</th></tr></thead>
          <tbody>
            {orden.equipos.map((e) => (
              <tr key={e.id}>
                <td>{e.numero_tarjeta}</td>
                <td>{e.tipo_agente} {e.capacidad} {e.unidad_capacidad}</td>
                <td>{e.trabajo === 'recarga' ? 'Recarga' : e.trabajo === 'prueba_hidraulica' ? 'Prueba hidraulica' : '-'}</td>
                <td>{formatear(e.fecha_vencimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {orden.insumos.length > 0 && (
          <>
            <h4>Insumos utilizados</h4>
            <table>
              <thead><tr><th>Insumo</th><th>Cantidad</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {orden.insumos.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nombre}</td>
                    <td>{Number(i.cantidad)} {i.unidad_medida}</td>
                    <td>{pesos(i.precio_unitario)}</td>
                    <td>{pesos(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="total">Total: {pesos(orden.total)}</p>
        {orden.observaciones && <p className="observaciones">{orden.observaciones}</p>}
        <div className="firmas">
          <span>Firma del taller</span>
          <span>Firma del cliente</span>
        </div>
      </div>

      <div className="acciones-modal sin-imprimir">
        <button type="button" onClick={onCerrar}>Cerrar</button>
        <button type="button" className="primario" onClick={() => window.print()}>Imprimir</button>
      </div>
    </Modal>
  );
}
