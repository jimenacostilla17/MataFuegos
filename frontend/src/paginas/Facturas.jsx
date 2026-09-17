import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Modal, Campo, Error } from '../componentes.jsx';
import { fecha as formatear, pesos, domicilio } from '../formato.js';

// Datos del taller que emite. Cambiar por los de la empresa real.
const EMISOR = {
  razon_social: 'Servicio Tecnico de Matafuegos',
  documento: '30-00000000-0',
  domicilio: 'Av. Siempreviva 1234, San Miguel de Tucuman',
  telefono: '381-0000000',
};

const CONDICIONES = [
  { valor: 'consumidor_final', texto: 'Consumidor final' },
  { valor: 'responsable_inscripto', texto: 'Responsable inscripto' },
  { valor: 'monotributo', texto: 'Monotributo' },
  { valor: 'exento', texto: 'Exento' },
];

const textoCondicion = (v) => CONDICIONES.find((c) => c.valor === v)?.texto ?? v;

export default function Facturas() {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);
  const [verFactura, setVerFactura] = useState(null);

  const cargar = () => api.facturas.listar().then(setFilas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  async function anular(f) {
    if (!confirm(`Anular la factura ${f.numero}? Queda en el historial como anulada.`)) return;
    try {
      await api.facturas.anular(f.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <div className="barra">
        <h2>Facturas</h2>
        <button className="primario" onClick={() => setCreando(true)}>Nueva factura</button>
      </div>
      <Error mensaje={error} />

      <table>
        <thead>
          <tr>
            <th>Numero</th><th>Fecha</th><th>Cliente</th><th>Orden</th>
            <th>Neto</th><th>IVA</th><th>Total</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className={f.anulada ? 'fila-vencida' : ''}>
              <td><button className="enlace" onClick={() => setVerFactura(f.id)}>{f.numero}</button></td>
              <td>{formatear(f.fecha)}</td>
              <td>{f.razon_social}</td>
              <td>{f.numero_orden}</td>
              <td>{pesos(f.neto)}</td>
              <td>{pesos(f.iva)}</td>
              <td>{pesos(f.total)}</td>
              <td>
                <span className={`etiqueta ${f.anulada ? 'roja' : 'verde'}`}>
                  {f.anulada ? 'anulada' : 'emitida'}
                </span>
              </td>
              <td className="acciones">
                {!f.anulada && <button className="peligro" onClick={() => anular(f)}>Anular</button>}
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={9} className="vacio">Sin facturas emitidas.</td></tr>}
        </tbody>
      </table>

      {creando && (
        <Formulario onCerrar={() => setCreando(false)} onGuardado={() => { setCreando(false); cargar(); }} />
      )}
      {verFactura && <Comprobante id={verFactura} onCerrar={() => setVerFactura(null)} />}
    </section>
  );
}

function Formulario({ onCerrar, onGuardado }) {
  const [pendientes, setPendientes] = useState([]);
  const [ordenId, setOrdenId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [condicion, setCondicion] = useState('consumidor_final');
  const [error, setError] = useState('');

  useEffect(() => {
    api.facturas.pendientes().then(setPendientes).catch((e) => setError(e.message));
  }, []);

  const orden = pendientes.find((o) => String(o.id) === String(ordenId));
  const neto = orden ? Number(orden.total) : 0;
  const iva = Math.round(neto * 21) / 100;

  async function guardar(e) {
    e.preventDefault();
    try {
      await api.facturas.crear({ orden_id: Number(ordenId), fecha, condicion_iva: condicion });
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal titulo="Nueva factura" onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        {pendientes.length === 0 ? (
          <p className="vacio">No hay ordenes de servicio pendientes de facturar.</p>
        ) : (
          <>
            <Campo
              etiqueta="Orden de servicio a facturar"
              valor={ordenId}
              onChange={setOrdenId}
              opciones={pendientes.map((o) => ({
                valor: o.id,
                texto: `${o.numero} - ${o.razon_social} - ${pesos(o.total)}`,
              }))}
            />
            <div className="fila">
              <Campo etiqueta="Fecha de emision" tipo="date" valor={fecha} onChange={setFecha} />
              <Campo etiqueta="Condicion frente al IVA" valor={condicion} onChange={setCondicion} opciones={CONDICIONES} />
            </div>

            {orden && (
              <dl className="ficha">
                <div><dt>Neto</dt><dd>{pesos(neto)}</dd></div>
                <div><dt>IVA 21%</dt><dd>{pesos(iva)}</dd></div>
                <div><dt>Total</dt><dd>{pesos(neto + iva)}</dd></div>
              </dl>
            )}
          </>
        )}
        <Error mensaje={error} />
        <div className="acciones-modal">
          <button type="button" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="primario" disabled={!ordenId}>Emitir factura</button>
        </div>
      </form>
    </Modal>
  );
}

function Comprobante({ id, onCerrar }) {
  const [f, setF] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.facturas.obtener(id).then(setF).catch((e) => setError(e.message));
  }, [id]);

  if (!f) return <Modal titulo="Factura" onCerrar={onCerrar}><Error mensaje={error} /></Modal>;

  return (
    <Modal titulo={`Factura ${f.numero}`} onCerrar={onCerrar}>
      <div className="remito">
        {f.anulada === 1 && <p className="sello-anulada">ANULADA</p>}

        <div className="remito-cabecera">
          <div>
            <h3>{EMISOR.razon_social}</h3>
            <p>CUIT {EMISOR.documento} &middot; {EMISOR.domicilio}</p>
            <p>Tel. {EMISOR.telefono}</p>
          </div>
          <div className="factura-numero">
            <strong>FACTURA</strong>
            <p>{f.numero}</p>
            <p>{formatear(f.fecha)}</p>
          </div>
        </div>

        <dl className="ficha">
          <div><dt>Cliente</dt><dd>{f.razon_social}</dd></div>
          <div><dt>CUIT / DNI</dt><dd>{f.documento || '-'}</dd></div>
          <div><dt>Condicion IVA</dt><dd>{textoCondicion(f.condicion_iva)}</dd></div>
          <div><dt>Domicilio</dt><dd>{domicilio({ ...f, numero: f.direccion_numero })}</dd></div>
        </dl>

        <h4>Detalle</h4>
        <table>
          <thead>
            <tr><th>Concepto</th><th>Cantidad</th><th>Precio unit.</th><th>Importe</th></tr>
          </thead>
          <tbody>
            {f.equipos.map((e, i) => (
              <tr key={`e${i}`}>
                <td colSpan={3}>
                  Servicio sobre matafuego {e.numero_tarjeta} ({e.tipo_agente} {e.capacidad} {e.unidad_capacidad})
                  {e.trabajo ? ` - ${e.trabajo === 'recarga' ? 'recarga' : 'prueba hidraulica'}` : ''}
                </td>
                <td>incluido</td>
              </tr>
            ))}
            {f.insumos.map((i, idx) => (
              <tr key={`i${idx}`}>
                <td>{i.nombre}</td>
                <td>{Number(i.cantidad)} {i.unidad_medida}</td>
                <td>{pesos(i.precio_unitario)}</td>
                <td>{pesos(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="totales">
          <div><dt>Subtotal neto</dt><dd>{pesos(f.neto)}</dd></div>
          <div><dt>IVA {Number(f.alicuota_iva)}%</dt><dd>{pesos(f.iva)}</dd></div>
          <div className="total-final"><dt>TOTAL</dt><dd>{pesos(f.total)}</dd></div>
        </dl>

        <p className="observaciones">
          Corresponde a la orden de servicio {f.numero_orden} del {formatear(f.fecha_orden)}.
        </p>
        <p className="nota-legal">
          Documento no valido como comprobante fiscal.
        </p>
      </div>

      <div className="acciones-modal sin-imprimir">
        <button type="button" onClick={onCerrar}>Cerrar</button>
        <button type="button" className="primario" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
      </div>
    </Modal>
  );
}
