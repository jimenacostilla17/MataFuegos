# Sistema de Gestión de Matafuegos

Gestión de clientes, control de inventario y seguimiento del ciclo de vida de extintores.

- **Backend:** Node.js + Express (JavaScript)
- **Frontend:** React + Vite (JavaScript)
- **Base de datos:** MySQL 8

## Requisitos

- Node.js 20.6 o superior
- MySQL Server 8 corriendo

## Instalación

### 1. Base de datos

Abrir `db/esquema.sql` en MySQL Workbench y ejecutarlo completo (ícono del rayo).
Crea la base `matafuegos` con todas sus tablas.

> El script empieza con `DROP DATABASE IF EXISTS matafuegos`: al ejecutarlo de nuevo se
> borra todo lo cargado.

Opcionalmente, ejecutar después `db/datos-demo.sql` para cargar un juego de datos de
prueba: 10 clientes de los cuatro tipos, 15 direcciones, 30 matafuegos, historial de
mantenimientos, 8 insumos y 3 órdenes de servicio. Las fechas son relativas al día en que
se ejecuta, así que el panel de vencimientos siempre muestra equipos vencidos y por
vencer.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env    # completar DB_PASSWORD con la clave de MySQL
npm run dev             # http://localhost:3001
```

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Vite redirige `/api` al backend, así que no hace falta configurar nada más.

## Comandos

| Carpeta    | Comando         | Qué hace                              |
|------------|-----------------|---------------------------------------|
| `backend`  | `npm run dev`   | Servidor con recarga automática       |
| `backend`  | `npm start`     | Servidor sin recarga                  |
| `frontend` | `npm run dev`   | Interfaz en modo desarrollo           |
| `frontend` | `npm run build` | Compila a `frontend/dist`             |

## Documentación

- [`docs/INSTALACION.md`](docs/INSTALACION.md) — cómo mover el proyecto a otra máquina e
  instalar todo desde cero, con solución de problemas frecuentes.
- [`docs/PRESENTACION.md`](docs/PRESENTACION.md) — tecnologías, arquitectura, modelo de
  datos, decisiones de diseño, guion de demostración y preguntas probables.

## Estructura

```
db/esquema.sql        Script de creación de la base
backend/src/
  servidor.js         Arranque de Express y montaje de rutas
  db.js               Pool de conexiones MySQL
  ayudas.js           Helpers: errores, cálculo de vencimientos
  rutas/              Un archivo por recurso de la API
frontend/src/
  App.jsx             Navegación entre secciones
  api.js              Cliente HTTP contra el backend
  componentes.jsx     Modal, campos de formulario, cartel de error
  paginas/            Una pantalla por módulo
```

## Módulos

| Módulo             | Estado      |
|--------------------|-------------|
| Clientes (ABM)     | Implementado |
| Direcciones/sucursales | Implementado |
| Matafuegos (ficha) | Implementado |
| Mantenimientos     | Implementado |
| Alertas y vencimientos | Implementado |
| Facturación y stock | Implementado |
| Órdenes de servicio / remitos | Implementado |

## Órdenes de servicio

La orden de servicio funciona como remito de entrega: lista los equipos devueltos con el
trabajo realizado y su próximo vencimiento, más los insumos consumidos con su total.
Se imprime desde el navegador (botón *Imprimir*).

No es una factura fiscal: no lleva numeración AFIP, IVA ni condición fiscal, porque el
requerimiento no los pide.

El alta descuenta el stock de los insumos dentro de la misma transacción que crea la
orden: si algún insumo no alcanza, no se guarda nada. Anular una orden devuelve al stock
lo que había consumido.

## Cómo se calculan los vencimientos

Cada mantenimiento genera su propia fecha de vencimiento:

- **Recarga:** vence al año.
- **Prueba hidráulica:** vence a los 5 años.

El *próximo vencimiento* de un equipo es el más cercano entre el último vencimiento de
cada tipo. El panel de alertas lista los equipos cuyo próximo vencimiento cae dentro de
los próximos 30 días (configurable a 60 o 90) e incluye los ya vencidos.
