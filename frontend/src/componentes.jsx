// Piezas compartidas por las pantallas: dialogo modal, campo de formulario
// y cartel de error.

export function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="fondo-modal" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h3>{titulo}</h3>
          <button className="cerrar" onClick={onCerrar}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Campo({ etiqueta, tipo = 'text', valor, onChange, opciones, ...resto }) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      {opciones ? (
        <select value={valor ?? ''} onChange={(e) => onChange(e.target.value)} {...resto}>
          <option value="">Seleccionar...</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
      ) : (
        <input
          type={tipo}
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value)}
          {...resto}
        />
      )}
    </label>
  );
}

export function Error({ mensaje }) {
  if (!mensaje) return null;
  return <p className="error">{mensaje}</p>;
}
