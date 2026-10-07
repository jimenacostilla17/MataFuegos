import { useEffect, useState } from 'react';

import { api } from '../api.js';

import { Modal, Campo, Error } from '../componentes.jsx';

import { fecha as formatear, domicilio } from '../formato.js';

const AGENTES = [
  'Agua',
  'Polvo ABC',
  'Polvo BC',
  'CO2',
  'Espuma AFFF',
  'Halotron',
].map((a) => ({ valor: a, texto: a }));

const UNIDADES = [
  { valor: 'kg', texto: 'kg' },
  { valor: 'l', texto: 'litros' },
];

const ESTADOS = [
  { valor: 'en_cliente', texto: 'En cliente' },
  { valor: 'en_taller', texto: 'En taller' },
  { valor: 'baja', texto: 'Baja' },
];

const VACIO = {
  direccion_id: '',
  numero_tarjeta: '',
  tipo_agente: '',
  capacidad: '',
  unidad_capacidad: 'kg',
  fecha_fabricacion: '',
  estado: 'en_cliente',
};

/* =========================================================
   ESTADO DEL VENCIMIENTO
   ========================================================= */

function estadoVencimiento(fechaVencimiento) {
  if (!fechaVencimiento) {
    return {
      tipo: 'sin-mantenimiento',
      texto: 'Sin mantenimiento',
    };
  }

  // Evitamos problemas de zona horaria usando la fecha directamente.
  const hoy = new Date();
  const hoyUTC = new Date(
    Date.UTC(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    )
  );

  const [anio, mes, dia] = fechaVencimiento
    .slice(0, 10)
    .split('-')
    .map(Number);

  const vencimiento = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  const diferencia =
    Math.ceil(
      (vencimiento - hoyUTC) /
        (1000 * 60 * 60 * 24)
    );

  if (diferencia < 0) {
    return {
      tipo: 'vencido',
      texto: 'Vencido',
    };
  }

  if (diferencia <= 30) {
    return {
      tipo: 'proximo',
      texto: 'Próximo a vencer',
    };
  }

  return {
    tipo: 'vigente',
    texto: 'Vigente',
  };
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function Matafuegos() {
  const [filas, setFilas] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [verFicha, setVerFicha] = useState(null);

  const cargar = () =>
    api.matafuegos
      .listar({ buscar, estado })
      .then(setFilas)
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, [buscar, estado]);

  useEffect(() => {
    api.direcciones
      .listar()
      .then(setDirecciones)
      .catch((e) => setError(e.message));
  }, []);

  async function borrar(m) {
    if (
      !confirm(
        `Borrar el matafuego ${m.numero_tarjeta} y todo su historial?`
      )
    ) {
      return;
    }

    try {
      await api.matafuegos.borrar(m.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  const opcionesDireccion = direcciones.map((d) => ({
    valor: d.id,
    texto: `${d.razon_social} - ${d.etiqueta} (${domicilio(d)})`,
  }));

  return (
    <section>
      <div className="barra">
        <h2>Matafuegos</h2>

        <input
          placeholder="Buscar por N de tarjeta"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>

          {ESTADOS.map((s) => (
            <option
              key={s.valor}
              value={s.valor}
            >
              {s.texto}
            </option>
          ))}
        </select>

        <button
          className="primario"
          disabled={direcciones.length === 0}
          onClick={() => setEditando(VACIO)}
        >
          Nuevo matafuego
        </button>
      </div>

      <Error mensaje={error} />

      {direcciones.length === 0 && (
        <p className="vacio">
          Primero cargue un cliente con al menos una direccion.
        </p>
      )}

      <table>
        <thead>
          <tr>
            <th>Tarjeta</th>
            <th>Agente</th>
            <th>Capacidad</th>
            <th>Fabricación</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Próximo venc.</th>
            <th>Vencimiento</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filas.map((m) => {
            const vencimiento = estadoVencimiento(
              m.proximo_vencimiento
            );

            return (
              <tr key={m.id}>
                <td>
                  <button
                    className="enlace"
                    onClick={() => setVerFicha(m.id)}
                  >
                    {m.numero_tarjeta}
                  </button>
                </td>

                <td>{m.tipo_agente}</td>

                <td>
                  {m.capacidad} {m.unidad_capacidad}
                </td>

                <td>
                  {formatear(m.fecha_fabricacion)}
                </td>

                <td>
                  {m.razon_social} - {m.etiqueta}
                </td>

                {/* Estado operativo */}
                <td>
                  <span className="etiqueta">
                    {
                      ESTADOS.find(
                        (s) => s.valor === m.estado
                      )?.texto
                    }
                  </span>
                </td>

                {/* Fecha de vencimiento */}
                <td>
                  {formatear(m.proximo_vencimiento)}
                </td>

                {/* Estado automático del vencimiento */}
                <td>
                  <span
                    className={`estado-vencimiento ${vencimiento.tipo}`}
                  >
                    {vencimiento.tipo === 'vencido' && '🔴 '}

                    {vencimiento.tipo === 'proximo' && '🟡 '}

                    {vencimiento.tipo === 'vigente' && '🟢 '}

                    {vencimiento.tipo === 'sin-mantenimiento' &&
                      '⚪ '}

                    {vencimiento.texto}
                  </span>
                </td>

                <td className="acciones">
                  <button
                    onClick={() => setEditando(m)}
                  >
                    Editar
                  </button>

                  <button
                    className="peligro"
                    onClick={() => borrar(m)}
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
                colSpan={9}
                className="vacio"
              >
                Sin equipos cargados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editando && (
        <Formulario
          inicial={editando}
          opcionesDireccion={opcionesDireccion}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            cargar();
          }}
        />
      )}

      {verFicha && (
        <Ficha
          id={verFicha}
          onCerrar={() => {
            setVerFicha(null);
            cargar();
          }}
        />
      )}
    </section>
  );
}

/* =========================================================
   FORMULARIO DE MATAFUEGO
   ========================================================= */

function Formulario({
  inicial,
  opcionesDireccion,
  onCerrar,
  onGuardado,
}) {
  const [datos, setDatos] = useState(inicial);
  const [error, setError] = useState('');

  const set = (campo) => (v) =>
    setDatos((d) => ({
      ...d,
      [campo]: v,
    }));

  async function guardar(e) {
    e.preventDefault();

    try {
      if (datos.id) {
        await api.matafuegos.actualizar(
          datos.id,
          datos
        );
      } else {
        await api.matafuegos.crear(datos);
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
          ? 'Editar matafuego'
          : 'Nuevo matafuego'
      }
      onCerrar={onCerrar}
    >
      <form onSubmit={guardar}>
        <Campo
          etiqueta="Numero de tarjeta"
          valor={datos.numero_tarjeta}
          onChange={set('numero_tarjeta')}
        />

        <Campo
          etiqueta="Ubicacion (cliente / direccion)"
          valor={datos.direccion_id}
          onChange={set('direccion_id')}
          opciones={opcionesDireccion}
        />

        <Campo
          etiqueta="Tipo de agente extintor"
          valor={datos.tipo_agente}
          onChange={set('tipo_agente')}
          opciones={AGENTES}
        />

        <div className="fila">
          <Campo
            etiqueta="Capacidad"
            tipo="number"
            step="0.01"
            valor={datos.capacidad}
            onChange={set('capacidad')}
          />

          <Campo
            etiqueta="Unidad"
            valor={datos.unidad_capacidad}
            onChange={set('unidad_capacidad')}
            opciones={UNIDADES}
          />
        </div>

        <div className="fila">
          <Campo
            etiqueta="Fecha de fabricacion"
            tipo="date"
            valor={datos.fecha_fabricacion}
            onChange={set('fecha_fabricacion')}
          />

          <Campo
            etiqueta="Estado"
            valor={datos.estado}
            onChange={set('estado')}
            opciones={ESTADOS}
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

/* =========================================================
   TIPOS DE MANTENIMIENTO
   ========================================================= */

const TIPOS_TRABAJO = [
  {
    valor: 'recarga',
    texto: 'Recarga (vence al año)',
  },
  {
    valor: 'prueba_hidraulica',
    texto: 'Prueba hidráulica (vence a los 5 años)',
  },
];

/* =========================================================
   FICHA DEL MATAFUEGO
   ========================================================= */

function Ficha({ id, onCerrar }) {
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(null);

  const cargar = () =>
    api.matafuegos
      .obtener(id)
      .then(setEquipo)
      .catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
  }, [id]);

  async function registrar(e) {
    e.preventDefault();

    try {
      await api.mantenimientos.crear({
        ...nuevo,
        matafuego_id: id,
      });

      setNuevo(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function borrarTrabajo(t) {
    if (
      !confirm(
        'Borrar este registro del historial?'
      )
    ) {
      return;
    }

    try {
      await api.mantenimientos.borrar(t.id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!equipo) {
    return (
      <Modal
        titulo="Ficha del equipo"
        onCerrar={onCerrar}
      >
        <Error mensaje={error} />
      </Modal>
    );
  }

  const set = (campo) => (v) =>
    setNuevo((d) => ({
      ...d,
      [campo]: v,
    }));

  const estado = estadoVencimiento(
    equipo.proximo_vencimiento
  );

  return (
    <Modal
      titulo={`Ficha ${equipo.numero_tarjeta}`}
      onCerrar={onCerrar}
    >
      <dl className="ficha">
        <div>
          <dt>Agente</dt>
          <dd>{equipo.tipo_agente}</dd>
        </div>

        <div>
          <dt>Capacidad</dt>
          <dd>
            {equipo.capacidad}{' '}
            {equipo.unidad_capacidad}
          </dd>
        </div>

        <div>
          <dt>Fabricación</dt>
          <dd>
            {formatear(
              equipo.fecha_fabricacion
            )}
          </dd>
        </div>

        <div>
          <dt>Cliente</dt>
          <dd>{equipo.razon_social}</dd>
        </div>

        <div>
          <dt>Ubicación</dt>
          <dd>
            {equipo.etiqueta} -{' '}
            {domicilio(equipo)}
          </dd>
        </div>

        <div>
          <dt>Próximo vencimiento</dt>
          <dd>
            {formatear(
              equipo.proximo_vencimiento
            )}
          </dd>
        </div>

        <div>
          <dt>Estado del vencimiento</dt>
          <dd>
            <span
              className={`estado-vencimiento ${estado.tipo}`}
            >
              {estado.tipo === 'vencido' && '🔴 '}

              {estado.tipo === 'proximo' && '🟡 '}

              {estado.tipo === 'vigente' && '🟢 '}

              {estado.tipo === 'sin-mantenimiento' &&
                '⚪ '}

              {estado.texto}
            </span>
          </dd>
        </div>
      </dl>

      <h4>Historial de mantenimientos</h4>

      <Error mensaje={error} />

      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Vence</th>
            <th>Observaciones</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {equipo.historial.map((t) => (
            <tr key={t.id}>
              <td>
                {t.tipo === 'recarga'
                  ? 'Recarga'
                  : 'Prueba hidráulica'}
              </td>

              <td>
                {formatear(t.fecha)}
              </td>

              <td>
                {formatear(
                  t.fecha_vencimiento
                )}
              </td>

              <td>
                {t.observaciones || '-'}
              </td>

              <td className="acciones">
                <button
                  className="peligro"
                  onClick={() =>
                    borrarTrabajo(t)
                  }
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}

          {equipo.historial.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="vacio"
              >
                Sin mantenimientos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {nuevo ? (
        <form
          onSubmit={registrar}
          className="sub-formulario"
        >
          <h4>Registrar trabajo</h4>

          <Campo
            etiqueta="Tipo"
            valor={nuevo.tipo}
            onChange={set('tipo')}
            opciones={TIPOS_TRABAJO}
          />

          <Campo
            etiqueta="Fecha del trabajo"
            tipo="date"
            valor={nuevo.fecha}
            onChange={set('fecha')}
          />

          <Campo
            etiqueta="Observaciones"
            valor={nuevo.observaciones}
            onChange={set('observaciones')}
          />

          <div className="acciones-modal">
            <button
              type="button"
              onClick={() => setNuevo(null)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primario"
            >
              Registrar
            </button>
          </div>
        </form>
      ) : (
        <div className="acciones-modal">
          <button
            className="primario"
            onClick={() =>
              setNuevo({
                tipo: '',
                fecha: new Date()
                  .toISOString()
                  .slice(0, 10),
                observaciones: '',
              })
            }
          >
            Registrar mantenimiento
          </button>
        </div>
      )}
    </Modal>
  );
}