# Guía de instalación en otra máquina

Cómo llevar el sistema a una computadora nueva y dejarlo funcionando desde cero.
Tiempo estimado: 20-30 minutos, la mayor parte esperando descargas.

---

## Índice

1. [Qué hay que llevarse](#1-qué-hay-que-llevarse)
2. [Programas a instalar](#2-programas-a-instalar)
3. [Crear la base de datos](#3-crear-la-base-de-datos)
4. [Configurar la conexión](#4-configurar-la-conexión)
5. [Instalar las dependencias](#5-instalar-las-dependencias)
6. [Levantar el sistema](#6-levantar-el-sistema)
7. [Verificar que quedó bien](#7-verificar-que-quedó-bien)
8. [Problemas frecuentes](#8-problemas-frecuentes)
9. [Regenerar el diagrama entidad-relación](#9-regenerar-el-diagrama-entidad-relación)

---

## 1. Qué hay que llevarse

Copiá la carpeta completa del proyecto (pendrive, Drive, Git, lo que sea) **excepto**
estas dos carpetas, que se regeneran solas y pesan cientos de megas:

```
backend/node_modules/
frontend/node_modules/
```

Si copiás con Git, ya están excluidas por el `.gitignore` y no tenés que hacer nada.

El archivo `backend/.env` tampoco viaja (tiene la contraseña de la base). Lo vas a
crear de nuevo en el paso 4.

Lo que **sí** tiene que viajar:

| Carpeta / archivo | Para qué |
|---|---|
| `backend/src/` | Código del servidor |
| `backend/package.json` | Lista de dependencias del servidor |
| `frontend/src/`, `frontend/index.html`, `frontend/vite.config.js` | Interfaz |
| `frontend/package.json` | Lista de dependencias de la interfaz |
| `db/esquema.sql` | Script que crea la base |
| `README.md`, `docs/` | Documentación |

---

## 2. Programas a instalar

### Node.js (versión 20.6 o superior)

Descargar de **https://nodejs.org** la versión LTS e instalar con las opciones por
defecto. Este proyecto se desarrolló con Node **v24.15.0** y npm **11.12.1**.

> La versión 20.6 es el mínimo real, no un capricho: el backend arranca con
> `node --env-file=.env`, una opción que no existe en versiones anteriores.

Para verificar, abrir una terminal nueva y escribir:

```bash
node -v
npm -v
```

Si dice que no reconoce el comando, cerrá y abrí la terminal de nuevo (el instalador
modifica el PATH y las terminales ya abiertas no se enteran).

### MySQL Server 8 + MySQL Workbench

Descargar el **MySQL Installer for Windows** de
**https://dev.mysql.com/downloads/installer/** y elegir el tipo de instalación
**Developer Default**, que incluye las dos cosas:

- **MySQL Server 8** — el motor, el programa que realmente guarda los datos.
- **MySQL Workbench** — la interfaz gráfica para administrarlo.

Son dos cosas distintas y hacen falta las dos. Workbench solo no alcanza: es un cliente,
no guarda nada.

Durante la instalación:

1. En *Authentication Method*, dejar **Use Strong Password Encryption**.
2. En *Accounts and Roles*, poner una contraseña para el usuario `root` y **anotarla**:
   la vas a necesitar en el paso 4.
3. En *Windows Service*, dejar tildado **Start the MySQL Server at System Startup**, así
   el motor arranca solo cada vez que prendés la máquina.

Versión usada en el desarrollo: **MySQL 8.0.46**.

---

## 3. Crear la base de datos

1. Abrir **MySQL Workbench**.
2. Hacer clic en la conexión local (suele llamarse `Local instance MySQL80`) e ingresar
   la contraseña de `root`.
3. Menú **File → Open SQL Script...** y abrir `db/esquema.sql` de la carpeta del
   proyecto.
4. Clic en el **rayo** ⚡ de la barra de herramientas (o `Ctrl+Shift+Enter`) para
   ejecutar el script completo.
5. En el panel izquierdo, botón derecho sobre **SCHEMAS → Refresh All**.

Tiene que aparecer el esquema `matafuegos` con **8 tablas**: `clientes`, `direcciones`,
`matafuegos`, `mantenimientos`, `insumos`, `ordenes_servicio`, `orden_matafuegos` y
`orden_insumos`.

> ⚠️ El script empieza con `DROP DATABASE IF EXISTS matafuegos`. Eso significa que
> **borra la base y todo lo cargado** antes de crearla de nuevo. En una máquina nueva es
> lo que querés. En una que ya está funcionando, ejecutarlo borra todos los datos.

### Datos de demostración (opcional pero recomendado)

Con la base recién creada, el sistema arranca vacío. Para verlo funcionando con datos
—y para mostrarlo en una exposición— hay un segundo script.

Repetir los pasos 3 y 4 de arriba pero abriendo `db/datos-demo.sql`. Carga:

| | |
|---|---|
| 10 clientes | de los cuatro tipos, uno dado de baja |
| 15 direcciones | consorcios con varias torres, industrias con dos plantas |
| 30 matafuegos | distintos agentes, capacidades y estados |
| 28 mantenimientos | recargas y pruebas hidráulicas |
| 8 insumos | tres por debajo del stock mínimo |
| 3 órdenes | una entregada y dos pendientes |

Las fechas son **relativas al día en que se ejecuta**, así que el panel de vencimientos
siempre muestra equipos vencidos y equipos por vencer, sin importar cuándo se corra.

> Este script también borra lo que haya cargado: es para dejar la base en un estado
> conocido, no para agregar datos a una base en uso.

---

## 4. Configurar la conexión

El backend necesita saber la contraseña de MySQL. Esos datos van en un archivo llamado
`.env` dentro de `backend/`, que **no se comparte** justamente porque contiene la clave.

Hay una plantilla lista: copiá `backend/.env.example` a `backend/.env`.

En la terminal:

```bash
cd backend
copy .env.example .env      # en Windows
cp .env.example .env        # en Linux o Mac
```

Abrí `backend/.env` con el Bloc de notas y completá la contraseña:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=aca_va_tu_contraseña
DB_NAME=matafuegos
PORT=3001
```

Si durante la instalación de MySQL creaste un usuario distinto de `root`, cambiá también
`DB_USER`.

### De dónde sacar los datos si no los recordás

En Workbench, con la conexión abierta, andá a **Database → Manage Connections**. Ahí
figuran *Hostname* (`DB_HOST`), *Port* (`DB_PORT`) y *Username* (`DB_USER`). La
contraseña no se puede ver desde ahí — si la perdiste, hay que reiniciarla desde el
MySQL Installer (*Reconfigure*).

---

## 5. Instalar las dependencias

Este paso descarga de internet las librerías que el proyecto usa. Hace falta conexión y
se hace una sola vez.

Abrí una terminal en la carpeta del proyecto y ejecutá:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Cada uno tarda entre 15 segundos y un par de minutos según la conexión. Al terminar
aparece la carpeta `node_modules/` en cada uno.

Lo que se instala está fijado en los `package.json`:

| Carpeta | Paquete | Versión | Para qué |
|---|---|---|---|
| backend | `express` | 4.22.3 | Servidor web y ruteo de la API |
| backend | `mysql2` | 3.24.4 | Conexión a MySQL con soporte de promesas |
| frontend | `react` + `react-dom` | 18.3.1 | Interfaz de usuario |
| frontend | `vite` | 6.4.3 | Servidor de desarrollo y empaquetado |
| frontend | `@vitejs/plugin-react` | 4.7.0 | Soporte de JSX |

Son cinco paquetes directos en total: el proyecto se mantuvo deliberadamente con las
mínimas dependencias posibles.

---

## 6. Levantar el sistema

Hacen falta **dos terminales abiertas al mismo tiempo**, una para cada parte.

**Terminal 1 — backend:**

```bash
cd backend
npm run dev
```

Tiene que decir: `Backend escuchando en http://localhost:3001`

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Tiene que decir: `Local: http://localhost:5173/`

Abrí el navegador en **http://localhost:5173**.

> No cierres las terminales mientras usás el sistema: si las cerrás, se apagan los
> servidores. Para detenerlos, `Ctrl+C` en cada una.

### Por qué dos servidores

El frontend (Vite, puerto 5173) sirve la interfaz. El backend (Express, puerto 3001)
atiende la API y habla con MySQL. Vite está configurado para redirigir todo lo que
empiece con `/api` al backend, así que desde el navegador todo parece salir de un solo
lugar. Eso está en `frontend/vite.config.js` y es lo que evita tener que configurar CORS.

---

## 7. Verificar que quedó bien

En el navegador, en **http://localhost:5173**:

1. Se ven las cinco solapas: *Vencimientos*, *Clientes*, *Matafuegos*,
   *Ordenes / Remitos*, *Insumos*.
2. Entrá a **Clientes → Nuevo cliente**, cargá uno cualquiera y guardá. Si aparece en la
   lista, la cadena completa funciona: navegador → Vite → Express → MySQL y vuelta.
3. Abrí **Clientes → la columna "direcciones"** y agregá una dirección.
4. En **Matafuegos → Nuevo matafuego**, cargá un equipo en esa dirección.
5. Abrí la ficha del equipo (clic en el número de tarjeta) y registrá una **recarga** con
   fecha de hace once meses. Tiene que aparecer en la solapa **Vencimientos**.

Si el paso 2 falla con un cartel rojo, andá a la sección siguiente.

---

## 8. Problemas frecuentes

### "Error de conexion con el servidor" en el navegador

El backend no está corriendo. Revisá la Terminal 1.

### `Access denied for user 'root'@'localhost'`

La contraseña de `backend/.env` no coincide con la de MySQL. Revisá el paso 4. Ojo con
los espacios de más y con las comillas: el valor va **sin comillas**.

### `Unknown database 'matafuegos'`

No se ejecutó el script del paso 3, o se ejecutó solo una parte. Volvé a abrir
`db/esquema.sql` en Workbench y asegurate de usar el rayo que ejecuta **todo** el script,
no el que ejecuta solo la línea donde está el cursor.

### `ECONNREFUSED` en la terminal del backend

El servicio de MySQL está detenido. En Windows: tecla Windows → escribir "Servicios" →
buscar **MySQL80** → botón derecho → **Iniciar**.

### `Port 5173 is in use` o `EADDRINUSE: 3001`

Quedó un proceso anterior corriendo. La forma más simple es reiniciar la máquina. Si no,
en PowerShell:

```powershell
Get-Process node | Stop-Process -Force
```

Eso cierra **todos** los procesos de Node, no solo los de este proyecto.

### `npm no se reconoce como un comando`

Node no está instalado, o la terminal se abrió antes de instalarlo. Cerrala y abrí una
nueva.

### La página carga en blanco

Abrí la consola del navegador con `F12` y mirá la solapa *Console*. Casi siempre es que
faltó correr `npm install` en `frontend/`.

---

## 9. Regenerar el diagrama entidad-relación

Si cambia el esquema de la base, el diagrama hay que rehacerlo. En Workbench:

1. **Database → Reverse Engineer...** (`Ctrl+R`).
2. Elegir la conexión → **Next** → contraseña → **Next**.
3. Tildar el esquema **matafuegos** → **Next** → **Next** → **Execute**.
4. **Next → Finish**. Se abre la solapa **EER Diagram** con las tablas y sus relaciones.
5. Las tablas aparecen amontonadas: arrastrarlas para ordenarlas.
6. **File → Save Model As...** → guardar como `db/modelo.mwb`.
7. Para exportar imagen: **File → Export → Export as PNG...**

---

## Resumen para alguien que ya sabe

```bash
# 1. Instalar Node 20.6+ y MySQL Server 8
# 2. Ejecutar db/esquema.sql en Workbench
cd backend  && npm install && cp .env.example .env   # completar DB_PASSWORD
cd ../frontend && npm install
# dos terminales:
cd backend  && npm run dev     # :3001
cd frontend && npm run dev     # :5173
```
