import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Error } from '../componentes.jsx';
import { fecha as formatear, domicilio } from '../formato.js';

function diasRestantes(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [a, m, d] = fecha.split('-').map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000);
}

export default function Alertas() {
  const [dias, setDias] = useState(30);
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.alertas.listar(dias).then(setFilas).catch((e) => setError(e.message));
  }, [dias]);

  return (
    <section>
      <div className="barra">
        <h2>Equipos a vencer</h2>
        <label className="campo en-linea">
          <span>Proximos</span>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </label>
      </div>
      <Error mensaje={error} />

      {filas.length === 0 ? (
        <p className="vacio">No hay equipos por vencer en el periodo seleccionado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tarjeta</th><th>Equipo</th><th>Cliente</th><th>Direccion</th>
              <th>Contacto</th><th>Vence</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const restantes = diasRestantes(f.proximo_vencimiento);
              return (
                <tr key={f.id} className={f.vencido ? 'fila-vencida' : ''}>
                  <td>{f.numero_tarjeta}</td>
                  <td>{f.tipo_agente} {f.capacidad} {f.unidad_capacidad}</td>
                  <td>{f.razon_social}</td>
                  <td>{f.etiqueta} - {domicilio(f)}</td>
                  <td>{f.telefono || f.email || '-'}</td>
                  <td>{formatear(f.proximo_vencimiento)}</td>
                  <td>
                    <span className={`etiqueta ${f.vencido ? 'roja' : 'amarilla'}`}>
                      {f.vencido ? `Vencido hace ${Math.abs(restantes)} d.` : `Faltan ${restantes} d.`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
