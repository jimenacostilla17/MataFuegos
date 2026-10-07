import { useEffect, useMemo, useState } from 'react';

import { api } from '../api.js';

import { Modal, Campo, Error } from '../componentes.jsx';

import { pesos } from '../formato.js';

const VACIO = {
  nombre: '',
  unidad_medida: '',
  stock: '',
  stock_minimo: '',
  precio_unitario: '',
};

export default function Insumos() {
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [verReportes, setVerReportes] = useState(false);

  const cargar = () => {
    setError('');

    api.insumos
      .listar()
      .then(setFilas)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(i) {
    if (!confirm(`Borrar el insumo "${i.nombre}"?`)) return;

    try {
      await api.insumos.borrar(i.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  /*
   * ============================================================
   * AVISOS DE STOCK
   * ============================================================
   */

  const agotados = useMemo(
    () =>
      filas.filter(
        (i) => Number(i.stock) <= 0
      ),
    [filas]
  );

  const bajoMinimo = useMemo(
    () =>
      filas.filter(
        (i) =>
          Number(i.stock) > 0 &&
          Number(i.stock) <= Number(i.stock_minimo)
      ),
    [filas]
  );

  const stockNormal = useMemo(
    () =>
      filas.filter(
        (i) =>
          Number(i.stock) > Number(i.stock_minimo)
      ),
    [filas]
  );

  /*
   * ============================================================
   * VALOR DEL STOCK
   * ============================================================
   */

  const valorStock = useMemo(
    () =>
      filas.reduce(
        (total, i) =>
          total +
          Number(i.stock || 0) *
            Number(i.precio_unitario || 0),
        0
      ),
    [filas]
  );

  /*
   * ============================================================
   * TOTAL DE UNIDADES / CANTIDADES
   * ============================================================
   */

  const cantidadInsumos = filas.length;

  return (
    <section>

      {/* ======================================================
          ENCABEZADO
          ====================================================== */}

      <div className="barra">
        <h2>Insumos del taller</h2>

        <button
          className="primario"
          onClick={() => setEditando(VACIO)}
        >
          Nuevo insumo
        </button>

        <button
          onClick={() => setVerReportes(true)}
        >
          Reportes
        </button>
      </div>

      <Error mensaje={error} />

      {/* ======================================================
          RESUMEN
          ====================================================== */}

      <div className="ficha">

        <div>
          <dt>Insumos registrados</dt>
          <dd>{cantidadInsumos}</dd>
        </div>

        <div>
          <dt>Stock normal</dt>
          <dd>{stockNormal.length}</dd>
        </div>

        <div>
          <dt>Stock bajo</dt>
          <dd>
            {bajoMinimo.length}
          </dd>
        </div>

        <div>
          <dt>Agotados</dt>
          <dd>
            {agotados.length}
          </dd>
        </div>

        <div>
          <dt>Valor del stock</dt>
          <dd>
            {pesos(valorStock)}
          </dd>
        </div>

      </div>

      {/* ======================================================
          AVISO: AGOTADOS
          ====================================================== */}

      {agotados.length > 0 && (
        <div className="aviso" style={{ marginBottom: '12px' }}>
          <strong>
            🔴 Atención: hay {agotados.length} insumo(s) agotado(s).
          </strong>

          <div style={{ marginTop: '6px' }}>
            {agotados.map((i) => (
              <div key={i.id}>
                • {i.nombre} — sin stock
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================
          AVISO: STOCK BAJO
          ====================================================== */}

      {bajoMinimo.length > 0 && (
        <div className="aviso" style={{ marginBottom: '12px' }}>
          <strong>
            🟡 Hay {bajoMinimo.length} insumo(s) en o por debajo
            del stock mínimo.
          </strong>

          <div style={{ marginTop: '6px' }}>
            {bajoMinimo.map((i) => (
              <div key={i.id}>
                • {i.nombre}: {Number(i.stock)} {i.unidad_medida}
                {' / mínimo '}
                {Number(i.stock_minimo)} {i.unidad_medida}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================
          TABLA DE INSUMOS
          ====================================================== */}

      <table>

        <thead>
          <tr>
            <th>Insumo</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Precio unitario</th>
            <th>Valor stock</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>

        <tbody>

          {filas.map((i) => {

            const stock = Number(i.stock || 0);
            const minimo = Number(i.stock_minimo || 0);
            const precio = Number(i.precio_unitario || 0);

            let estado;
            let clase;

            if (stock <= 0) {
              estado = 'Agotado';
              clase = 'roja';
            } else if (stock <= minimo) {
              estado = 'Reponer';
              clase = 'amarilla';
            } else {
              estado = 'Disponible';
              clase = 'verde';
            }

            return (
              <tr
                key={i.id}
                className={
                  stock <= minimo
                    ? 'fila-vencida'
                    : ''
                }
              >

                {/* Nombre */}
                <td>
                  <strong>{i.nombre}</strong>
                </td>

                {/* Stock */}
                <td>
                  {stock} {i.unidad_medida}
                </td>

                {/* Mínimo */}
                <td>
                  {minimo} {i.unidad_medida}
                </td>

                {/* Precio */}
                <td>
                  {pesos(precio)}
                </td>

                {/* Valor del stock */}
                <td>
                  {pesos(stock * precio)}
                </td>

                {/* Estado */}
                <td>
                  <span className={`etiqueta ${clase}`}>
                    {stock <= 0 && '🔴 '}
                    {stock > 0 && stock <= minimo && '🟡 '}
                    {stock > minimo && '🟢 '}

                    {estado}
                  </span>
                </td>

                {/* Acciones */}
                <td className="acciones">

                  <button
                    onClick={() => setEditando(i)}
                  >
                    Editar
                  </button>

                  <button
                    className="peligro"
                    onClick={() => borrar(i)}
                  >
                    Borrar
                  </button>

                </td>

              </tr>
            );
          })}

          {filas.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="vacio"
              >
                Sin insumos cargados.
              </td>
            </tr>
          )}

        </tbody>

      </table>

      {/* ======================================================
          FORMULARIO
          ====================================================== */}

      {editando && (
        <Formulario
          inicial={editando}

          onCerrar={() =>
            setEditando(null)
          }

          onGuardado={() => {
            setEditando(null);
            cargar();
          }}
        />
      )}

      {/* ======================================================
          REPORTES
          ====================================================== */}

      {verReportes && (
        <Reportes
          filas={filas}
          onCerrar={() =>
            setVerReportes(false)
          }
        />
      )}

    </section>
  );
}


/* ============================================================
   FORMULARIO DE INSUMO
   ============================================================ */

function Formulario({
  inicial,
  onCerrar,
  onGuardado,
}) {
  const [datos, setDatos] = useState({
    ...VACIO,
    ...inicial,
  });

  const [error, setError] = useState('');

  const set =
    (campo) =>
    (valor) =>
      setDatos((d) => ({
        ...d,
        [campo]: valor,
      }));

  async function guardar(e) {
    e.preventDefault();

    setError('');

    try {

      if (!datos.nombre.trim()) {
        throw new Error(
          'Ingresá el nombre del insumo.'
        );
      }

      if (!datos.unidad_medida.trim()) {
        throw new Error(
          'Ingresá la unidad de medida.'
        );
      }

      if (Number(datos.stock) < 0) {
        throw new Error(
          'El stock no puede ser negativo.'
        );
      }

      if (Number(datos.stock_minimo) < 0) {
        throw new Error(
          'El stock mínimo no puede ser negativo.'
        );
      }

      if (Number(datos.precio_unitario) < 0) {
        throw new Error(
          'El precio no puede ser negativo.'
        );
      }

      if (datos.id) {

        await api.insumos.actualizar(
          datos.id,
          datos
        );

      } else {

        await api.insumos.crear(datos);

      }

      onGuardado();

    } catch (err) {

      setError(err.message);

    }
  }

  return (
    <Modal
      titulo={
        datos.id
          ? 'Editar insumo'
          : 'Nuevo insumo'
      }
      onCerrar={onCerrar}
    >

      <form onSubmit={guardar}>

        <Campo
          etiqueta="Nombre"
          valor={datos.nombre}
          onChange={set('nombre')}
        />

        <Campo
          etiqueta="Unidad de medida (kg, unidad, metro)"
          valor={datos.unidad_medida}
          onChange={set('unidad_medida')}
        />

        <div className="fila">

          <Campo
            etiqueta="Stock actual"
            tipo="number"
            step="0.01"
            valor={datos.stock}
            onChange={set('stock')}
          />

          <Campo
            etiqueta="Stock mínimo"
            tipo="number"
            step="0.01"
            valor={datos.stock_minimo}
            onChange={set('stock_minimo')}
          />

          <Campo
            etiqueta="Precio unitario"
            tipo="number"
            step="0.01"
            valor={datos.precio_unitario}
            onChange={set('precio_unitario')}
          />

        </div>

        <Error mensaje={error} />

        <div className="acciones-modal">

          <button
            type="button"
            onClick={onCerrar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primario"
          >
            Guardar
          </button>

        </div>

      </form>

    </Modal>
  );
}


/* ============================================================
   REPORTES
   ============================================================ */

function Reportes({
  filas,
  onCerrar,
}) {
  const valorTotal = filas.reduce(
    (total, i) =>
      total +
      Number(i.stock || 0) *
        Number(i.precio_unitario || 0),
    0
  );

  const agotados = filas.filter(
    (i) => Number(i.stock) <= 0
  );

  const bajoMinimo = filas.filter(
    (i) =>
      Number(i.stock) > 0 &&
      Number(i.stock) <=
        Number(i.stock_minimo)
  );

  return (
    <Modal
      titulo="Reportes de insumos"
      onCerrar={onCerrar}
    >

      <div className="ficha">

        <div>
          <dt>Total de insumos</dt>
          <dd>{filas.length}</dd>
        </div>

        <div>
          <dt>Disponibles</dt>
          <dd>
            {
              filas.filter(
                (i) =>
                  Number(i.stock) >
                  Number(i.stock_minimo)
              ).length
            }
          </dd>
        </div>

        <div>
          <dt>Para reponer</dt>
          <dd>{bajoMinimo.length}</dd>
        </div>

        <div>
          <dt>Agotados</dt>
          <dd>{agotados.length}</dd>
        </div>

        <div>
          <dt>Valor del inventario</dt>
          <dd>{pesos(valorTotal)}</dd>
        </div>

      </div>

      <h4>
        Insumos que necesitan reposición
      </h4>

      {agotados.length === 0 &&
      bajoMinimo.length === 0 ? (

        <p className="vacio">
          No hay insumos que necesiten reposición.
        </p>

      ) : (

        <table>

          <thead>
            <tr>
              <th>Insumo</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Faltante</th>
            </tr>
          </thead>

          <tbody>

            {[
              ...agotados,
              ...bajoMinimo,
            ].map((i) => {

              const stock =
                Number(i.stock || 0);

              const minimo =
                Number(i.stock_minimo || 0);

              const faltante =
                Math.max(minimo - stock, 0);

              return (
                <tr key={i.id}>

                  <td>
                    {i.nombre}
                  </td>

                  <td>
                    {stock} {i.unidad_medida}
                  </td>

                  <td>
                    {minimo} {i.unidad_medida}
                  </td>

                  <td>
                    <strong>
                      {faltante} {i.unidad_medida}
                    </strong>
                  </td>

                </tr>
              );

            })}

          </tbody>

        </table>

      )}

      <h4>
        Valor del stock por insumo
      </h4>

      <table>

        <thead>
          <tr>
            <th>Insumo</th>
            <th>Stock</th>
            <th>Precio unitario</th>
            <th>Valor</th>
          </tr>
        </thead>

        <tbody>

          {filas.map((i) => {

            const valor =
              Number(i.stock || 0) *
              Number(i.precio_unitario || 0);

            return (
              <tr key={i.id}>

                <td>{i.nombre}</td>

                <td>
                  {Number(i.stock)}{' '}
                  {i.unidad_medida}
                </td>

                <td>
                  {pesos(i.precio_unitario)}
                </td>

                <td>
                  <strong>
                    {pesos(valor)}
                  </strong>
                </td>

              </tr>
            );

          })}

        </tbody>

      </table>

      <div className="total">
        Valor total del inventario:{' '}
        {pesos(valorTotal)}
      </div>

    </Modal>
  );
}