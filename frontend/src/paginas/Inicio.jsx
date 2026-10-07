import React from "react";

function MatafuegoIlustracion() {
  return (
    <svg
      className="matafuego-ilustracion"
      viewBox="0 0 320 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sombra */}
      <ellipse
        cx="160"
        cy="394"
        rx="92"
        ry="15"
        fill="rgba(0,0,0,0.15)"
      />

      {/* Manguera */}
      <path
        d="M218 115 C275 125, 286 190, 250 235"
        stroke="#171717"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <path
        d="M218 115 C275 125, 286 190, 250 235"
        stroke="#3B3B3B"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Pico */}
      <path
        d="M246 226 L276 239 L263 257 L238 242"
        fill="#202020"
      />

      {/* Cuerpo */}
      <rect
        x="82"
        y="110"
        width="156"
        height="270"
        rx="62"
        fill="#D71920"
      />

      {/* Brillo del cuerpo */}
      <path
        d="M105 155 C105 130, 124 118, 143 116"
        stroke="#F75B5F"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Parte superior */}
      <rect
        x="108"
        y="80"
        width="104"
        height="55"
        rx="20"
        fill="#242424"
      />

      {/* Manija */}
      <path
        d="M120 88 C112 58, 126 38, 160 38 C194 38, 208 58, 200 88"
        stroke="#222"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Seguro */}
      <rect
        x="150"
        y="46"
        width="20"
        height="16"
        rx="5"
        fill="#F4C430"
      />

      {/* Etiqueta */}
      <rect
        x="105"
        y="172"
        width="110"
        height="115"
        rx="15"
        fill="white"
      />

      {/* Icono de fuego */}
      <path
        d="M160 194
           C143 215, 139 228, 139 241
           C139 260, 148 271, 160 271
           C172 271, 181 260, 181 241
           C181 225, 173 212, 160 194Z"
        fill="#F4A000"
      />

      <path
        d="M160 216
           C151 229, 150 237, 150 245
           C150 254, 154 259, 160 259
           C166 259, 170 254, 170 245
           C170 236, 166 226, 160 216Z"
        fill="#E11D2E"
      />

      {/* Texto decorativo */}
      <rect
        x="124"
        y="300"
        width="72"
        height="7"
        rx="3.5"
        fill="white"
        opacity="0.9"
      />

      <rect
        x="134"
        y="314"
        width="52"
        height="6"
        rx="3"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Inicio({ onNavigate }) {
  const navegar = (ruta) => {
    if (onNavigate) {
      onNavigate(ruta);
    }
  };

  const accesos = [
    {
      id: "matafuegos",
      icono: "🧯",
      titulo: "Matafuegos",
      descripcion: "Controlá equipos, estados y vencimientos.",
      color: "rojo",
    },
    {
      id: "clientes",
      icono: "👥",
      titulo: "Clientes",
      descripcion: "Administrá empresas y clientes registrados.",
      color: "azul",
    },
    {
      id: "ordenes",
      icono: "📋",
      titulo: "Órdenes",
      descripcion: "Gestioná órdenes de trabajo y servicios.",
      color: "naranja",
    },
    {
      id: "insumos",
      icono: "📦",
      titulo: "Insumos",
      descripcion: "Consultá y administrá los insumos disponibles.",
      color: "verde",
    },
    {
      id: "facturas",
      icono: "🧾",
      titulo: "Facturas",
      descripcion: "Visualizá y gestioná la facturación.",
      color: "violeta",
    },
    {
      id: "alertas",
      icono: "🔔",
      titulo: "Alertas",
      descripcion: "Revisá vencimientos y avisos importantes.",
      color: "amarillo",
    },
  ];

  return (
    <main className="inicio">

      {/* DECORACIONES */}
      <div className="inicio-fondo-circulo circulo-1"></div>
      <div className="inicio-fondo-circulo circulo-2"></div>
      <div className="inicio-fondo-circulo circulo-3"></div>

      {/* HERO */}
      <section className="inicio-hero">

        <div className="inicio-hero-contenido">

          <div className="inicio-badge">
            <span className="badge-punto"></span>
            Sistema de gestión y control
          </div>

          <h1>
            Todo bajo control.
            <span> Siempre.</span>
          </h1>

          <p className="inicio-descripcion">
            Gestioná tus matafuegos, clientes, órdenes, insumos y
            facturación desde un único lugar.
          </p>

          <div className="inicio-botones">
            <button
              className="btn-principal"
              onClick={() => navegar("matafuegos")}
            >
              <span>🧯</span>
              Ver matafuegos
              <span className="flecha">→</span>
            </button>

            <button
              className="btn-secundario"
              onClick={() => navegar("alertas")}
            >
              Ver alertas
            </button>
          </div>

          {/* MINI ESTADÍSTICAS */}
          <div className="inicio-mini-stats">

            <div className="mini-stat">
              <strong>100%</strong>
              <span>Control</span>
            </div>

            <div className="mini-stat-separador"></div>

            <div className="mini-stat">
              <strong>24/7</strong>
              <span>Acceso</span>
            </div>

            <div className="mini-stat-separador"></div>

            <div className="mini-stat">
              <strong>Simple</strong>
              <span>Gestión</span>
            </div>

          </div>
        </div>

        {/* ILUSTRACIÓN */}
        <div className="inicio-ilustracion-contenedor">

          <div className="ilustracion-glow"></div>

          <div className="burbuja burbuja-1">
            🛡️
            <span>Seguridad</span>
          </div>

          <div className="burbuja burbuja-2">
            ✓
            <span>Controlado</span>
          </div>

          <div className="burbuja burbuja-3">
            🔥
            <span>Prevención</span>
          </div>

          <div className="matafuego-card">
            <MatafuegoIlustracion />
          </div>

        </div>
      </section>

      {/* ACCESOS */}
      <section className="inicio-accesos">

        <div className="seccion-titulo">

          <div>
            <span className="seccion-kicker">
              ACCESO RÁPIDO
            </span>

            <h2>
              Gestioná todo desde acá
            </h2>
          </div>

          <p>
            Elegí una sección para comenzar a trabajar.
          </p>

        </div>

        <div className="accesos-grid">

          {accesos.map((item) => (
            <button
              key={item.id}
              className={`acceso-card acceso-${item.color}`}
              onClick={() => navegar(item.id)}
            >

              <div className="acceso-icono">
                {item.icono}
              </div>

              <div className="acceso-info">
                <h3>{item.titulo}</h3>
                <p>{item.descripcion}</p>
              </div>

              <div className="acceso-flecha">
                →
              </div>

            </button>
          ))}

        </div>
      </section>

      {/* CTA */}
      <section className="inicio-cta">

        <div className="cta-icono">
          🧯
        </div>

        <div>
          <span>
            MANTENÉ TODO AL DÍA
          </span>

          <h2>
            La prevención empieza con un buen control.
          </h2>
        </div>

        <button
          onClick={() => navegar("ordenes")}
          className="cta-boton"
        >
          Ver órdenes →
        </button>

      </section>

    </main>
  );
}