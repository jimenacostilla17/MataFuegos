import { useState } from "react";

import Inicio from "./paginas/Inicio.jsx";
import Clientes from "./paginas/Clientes.jsx";
import Matafuegos from "./paginas/Matafuegos.jsx";
import Alertas from "./paginas/Alertas.jsx";
import Insumos from "./paginas/Insumos.jsx";
import Ordenes from "./paginas/Ordenes.jsx";
import Facturas from "./paginas/Facturas.jsx";

const SECCIONES = [
  {
    id: "inicio",
    titulo: "Inicio",
    componente: Inicio,
  },
  {
    id: "alertas",
    titulo: "Vencimientos",
    componente: Alertas,
  },
  {
    id: "clientes",
    titulo: "Clientes",
    componente: Clientes,
  },
  {
    id: "matafuegos",
    titulo: "Matafuegos",
    componente: Matafuegos,
  },
  {
    id: "ordenes",
    titulo: "Órdenes / Remitos",
    componente: Ordenes,
  },
  {
    id: "facturas",
    titulo: "Facturas",
    componente: Facturas,
  },
  {
    id: "insumos",
    titulo: "Insumos",
    componente: Insumos,
  },
];

export default function App() {
  // Ahora la aplicación empieza en Inicio
  const [activa, setActiva] = useState("inicio");

  const seccionActual = SECCIONES.find(
    (seccion) => seccion.id === activa
  );

  const Actual = seccionActual.componente;

  return (
    <div className="app">

      {/* HEADER */}
      <header className="app-header">

        <div className="app-logo">

          <div className="logo-icono">
            🧯
          </div>

          <div>
            <h1>Gestión de Matafuegos</h1>
            <span>Sistema de control y gestión</span>
          </div>

        </div>

        {/* NAVEGACIÓN */}
        <nav className="app-nav">

          {SECCIONES.map((seccion) => (

            <button
              key={seccion.id}
              className={
                seccion.id === activa
                  ? "activa"
                  : ""
              }
              onClick={() => setActiva(seccion.id)}
            >
              {seccion.id === "inicio" && "⌂ "}
              {seccion.titulo}
            </button>

          ))}

        </nav>

      </header>

      {/* CONTENIDO */}
      <main className="app-main">

        <Actual
          onNavigate={setActiva}
        />

      </main>

    </div>
  );
}