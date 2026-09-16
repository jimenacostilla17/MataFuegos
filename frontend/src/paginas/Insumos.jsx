import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Modal, Campo, Error } from '../componentes.jsx';
import { pesos } from '../formato.js';

const VACIO = { nombre: '', unidad_medida: '', stock: '', stock_minimo: '', precio_unitario: '' };

export default function Insumos() {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);

  const cargar = () => api.insumos.listar().then(setFilas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  async function borrar(i) {
    if (!confirm(`Borrar el insumo "${i.nombre}"?`)) return;
    try {
      await api.insumos.borrar(i.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  const faltantes = filas.filter((i) => i.bajo_minimo).length;

  return (
    <section>
      <div className="barra">
        <h2>Insumos del taller</h2>
        <button className="primario" onClick={() => setEditando(VACIO)}>Nuevo insumo</button>
      </div>
      <Error mensaje={error} />
      {faltantes > 0 && (
        <p className="aviso">
          {faltantes} insumo(s) en o por debajo del stock minimo.
        </p>
      )}

      <table>
        <thead>
          <tr><th>Insumo</th><th>Stock</th><th>Minimo</th><th>Precio unitario</th><th></th></tr>
        </thead>
        <tbody>
          {filas.map((i) => (
            <tr key={i.id} className={i.bajo_minimo ? 'fila-vencida' : ''}>
              <td>{i.nombre}</td>
              <td>
                {Number(i.stock)} {i.unidad_medida}{' '}
                {i.bajo_minimo ? <span className="etiqueta roja">reponer</span> : null}
              </td>
              <td>{Number(i.stock_minimo)} {i.unidad_medida}</td>
              <td>{pesos(i.precio_unitario)}</td>
              <td className="acciones">
                <button onClick={() => setEditando(i)}>Editar</button>
                <button className="peligro" onClick={() => borrar(i)}>Borrar</button>
              </td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td colSpan={5} className="vacio">Sin insumos cargados.</td></tr>}
        </tbody>
      </table>

      {editando && (
        <Formulario
          inicial={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => { setEditando(null); cargar(); }}
        />
      )}
    </section>
  );
}

function Formulario({ inicial, onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(inicial);
  const [error, setError] = useState('');
  const set = (campo) => (v) => setDatos((d) => ({ ...d, [campo]: v }));

  async function guardar(e) {
    e.preventDefault();
    try {
      if (datos.id) await api.insumos.actualizar(datos.id, datos);
      else await api.insumos.crear(datos);
      onGuardado();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal titulo={datos.id ? 'Editar insumo' : 'Nuevo insumo'} onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <Campo etiqueta="Nombre" valor={datos.nombre} onChange={set('nombre')} />
        <Campo etiqueta="Unidad de medida (kg, unidad, metro)" valor={datos.unidad_medida} onChange={set('unidad_medida')} />
        <div className="fila">
          <Campo etiqueta="Stock actual" tipo="number" step="0.01" valor={datos.stock} onChange={set('stock')} />
          <Campo etiqueta="Stock minimo" tipo="number" step="0.01" valor={datos.stock_minimo} onChange={set('stock_minimo')} />
          <Campo etiqueta="Precio unitario" tipo="number" step="0.01" valor={datos.precio_unitario} onChange={set('precio_unitario')} />
        </div>
        <Error mensaje={error} />
        <div className="acciones-modal">
          <button type="button" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="primario">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
