import { useState } from 'react';
import Clientes from './paginas/Clientes.jsx';
import Matafuegos from './paginas/Matafuegos.jsx';
import Alertas from './paginas/Alertas.jsx';
import Insumos from './paginas/Insumos.jsx';
import Ordenes from './paginas/Ordenes.jsx';

const SECCIONES = [
  { id: 'alertas', titulo: 'Vencimientos', componente: Alertas },
  { id: 'clientes', titulo: 'Clientes', componente: Clientes },
  { id: 'matafuegos', titulo: 'Matafuegos', componente: Matafuegos },
  { id: 'ordenes', titulo: 'Ordenes / Remitos', componente: Ordenes },
  { id: 'insumos', titulo: 'Insumos', componente: Insumos },
];

export default function App() {
  const [activa, setActiva] = useState('alertas');
  const Actual = SECCIONES.find((s) => s.id === activa).componente;

  return (
    <div className="app">
      <header>
        <h1>Gestion de Matafuegos</h1>
        <nav>
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              className={s.id === activa ? 'activa' : ''}
              onClick={() => setActiva(s.id)}
            >
              {s.titulo}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <Actual />
      </main>
    </div>
  );
}
