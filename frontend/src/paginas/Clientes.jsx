import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Modal, Campo, Error } from '../componentes.jsx';

const TIPOS = ['particular', 'comercio', 'consorcio', 'industria'].map((t) => ({ valor: t, texto: t }));
const CLIENTE_VACIO = { tipo: '', razon_social: '', documento: '', telefono: '', email: '' };
const DIRECCION_VACIA = { etiqueta: '', calle: '', numero: '', piso_depto: '', localidad: '', provincia: '', codigo_postal: '' };

export default function Clientes() {
  const [filas, setFilas] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [verDirecciones, setVerDirecciones] = useState(null);

  const cargar = () =>
    api.clientes.listar({ buscar, tipo }).then(setFilas).catch((e) => setError(e.message));

  useEffect(() => { cargar(); }, [buscar, tipo]);

  async function borrar(cliente) {
    if (!confirm(`Dar de baja a "${cliente.razon_social}"?`)) return;
    try {
      await api.clientes.borrar(cliente.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <div className="barra">
        <h2>Clientes</h2>
        <input placeholder="Buscar por nombre o CUIT" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.texto}</option>)}
        </select>
        <button className="primario" onClick={() => setEditando(CLIENTE_VACIO)}>Nuevo cliente</button>
      </div>
      <Error mensaje={error} />

      <table>
        <thead>
          <tr><th>Razon social</th><th>Tipo</th><th>CUIT / DNI</th><th>Telefono</th><th>Direcciones</th><th></th></tr>
        </thead>
        <tbody>
          {filas.map((c) => (
            <tr key={c.id}>
              <td>{c.razon_social}</td>
              <td><span className="etiqueta">{c.tipo}</span></td>
              <td>{c.documento || '-'}</td>
              <td>{c.telefono || '-'}</td>
              <td>
                <button className="enlace" onClick={() => setVerDirecciones(c)}>
                  {c.cantidad_direcciones} direccion(es)
                </button>
              </td>
              <td className="acciones">
                <button onClick={() => setEditando(c)}>Editar</button>
                <button className="peligro" onClick={() => borrar(c)}>Baja</button>
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={6} className="vacio">Sin clientes.</td></tr>}
        </tbody>
      </table>

      {editando && (
        <FormularioCliente
          inicial={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => { setEditando(null); cargar(); }}
        />
      )}
      {verDirecciones && (
        <Direcciones
          cliente={verDirecciones}
          onCerrar={() => { setVerDirecciones(null); cargar(); }}
        />
      )}
    </section>
  );
}

function FormularioCliente({ inicial, onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(inicial);
  const [error, setError] = useState('');
  const set = (campo) => (v) => setDatos((d) => ({ ...d, [campo]: v }));

  async function guardar(e) {
    e.preventDefault();
    try {
      if (datos.id) await api.clientes.actualizar(datos.id, datos);
      else await api.clientes.crear(datos);
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal titulo={datos.id ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <Campo etiqueta="Tipo" valor={datos.tipo} onChange={set('tipo')} opciones={TIPOS} />
        <Campo etiqueta="Razon social / Nombre" valor={datos.razon_social} onChange={set('razon_social')} />
        <Campo etiqueta="CUIT / DNI" valor={datos.documento} onChange={set('documento')} />
        <Campo etiqueta="Telefono" valor={datos.telefono} onChange={set('telefono')} />
        <Campo etiqueta="Email" tipo="email" valor={datos.email} onChange={set('email')} />
        <Error mensaje={error} />
        <div className="acciones-modal">
          <button type="button" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="primario">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function Direcciones({ cliente, onCerrar }) {
  const [filas, setFilas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');

  const cargar = () =>
    api.direcciones.listar({ cliente_id: cliente.id }).then(setFilas).catch((e) => setError(e.message));

  useEffect(() => { cargar(); }, []);

  async function guardar(e) {
    e.preventDefault();
    try {
      const body = { ...editando, cliente_id: cliente.id };
      if (editando.id) await api.direcciones.actualizar(editando.id, body);
      else await api.direcciones.crear(body);
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function borrar(d) {
    if (!confirm(`Borrar la direccion "${d.etiqueta}"?`)) return;
    try {
      await api.direcciones.borrar(d.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  const set = (campo) => (v) => setEditando((d) => ({ ...d, [campo]: v }));

  return (
    <Modal titulo={`Direcciones de ${cliente.razon_social}`} onCerrar={onCerrar}>
      <Error mensaje={error} />
      <table>
        <thead><tr><th>Etiqueta</th><th>Domicilio</th><th>Equipos</th><th></th></tr></thead>
        <tbody>
          {filas.map((d) => (
            <tr key={d.id}>
              <td>{d.etiqueta}</td>
              <td>{d.calle} {d.numero} {d.piso_depto}, {d.localidad}</td>
              <td>{d.cantidad_matafuegos}</td>
              <td className="acciones">
                <button onClick={() => setEditando(d)}>Editar</button>
                <button className="peligro" onClick={() => borrar(d)}>Borrar</button>
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={4} className="vacio">Sin direcciones cargadas.</td></tr>}
        </tbody>
      </table>

      {editando ? (
        <form onSubmit={guardar} className="sub-formulario">
          <h4>{editando.id ? 'Editar direccion' : 'Nueva direccion'}</h4>
          <Campo etiqueta="Etiqueta (Casa central, Sucursal...)" valor={editando.etiqueta} onChange={set('etiqueta')} />
          <div className="fila">
            <Campo etiqueta="Calle" valor={editando.calle} onChange={set('calle')} />
            <Campo etiqueta="Numero" valor={editando.numero} onChange={set('numero')} />
            <Campo etiqueta="Piso / Depto" valor={editando.piso_depto} onChange={set('piso_depto')} />
          </div>
          <div className="fila">
            <Campo etiqueta="Localidad" valor={editando.localidad} onChange={set('localidad')} />
            <Campo etiqueta="Provincia" valor={editando.provincia} onChange={set('provincia')} />
            <Campo etiqueta="Codigo postal" valor={editando.codigo_postal} onChange={set('codigo_postal')} />
          </div>
          <div className="acciones-modal">
            <button type="button" onClick={() => setEditando(null)}>Cancelar</button>
            <button type="submit" className="primario">Guardar direccion</button>
          </div>
        </form>
      ) : (
        <div className="acciones-modal">
          <button className="primario" onClick={() => setEditando(DIRECCION_VACIA)}>Agregar direccion</button>
        </div>
      )}
    </Modal>
  );
}
