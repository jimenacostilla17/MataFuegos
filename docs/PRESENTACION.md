# Sistema de Gestión de Matafuegos — Documento de presentación

Material de respaldo para exponer y defender el proyecto.

**Instituto Superior San Cristóbal** — Técnicas Avanzadas de Programación
Prof. Costilla Nelson

---

## Índice

1. [El problema](#1-el-problema)
2. [Qué hace el sistema](#2-qué-hace-el-sistema)
3. [Tecnologías y por qué](#3-tecnologías-y-por-qué)
4. [Arquitectura](#4-arquitectura)
5. [Modelo de datos](#5-modelo-de-datos)
6. [La lógica del negocio](#6-la-lógica-del-negocio)
7. [Recorrido por los módulos](#7-recorrido-por-los-módulos)
8. [Decisiones de diseño](#8-decisiones-de-diseño)
9. [Cómo se desarrolló](#9-cómo-se-desarrolló)
10. [Pruebas realizadas](#10-pruebas-realizadas)
11. [Números del proyecto](#11-números-del-proyecto)
12. [Limitaciones y trabajo futuro](#12-limitaciones-y-trabajo-futuro)
13. [Guion para la demostración](#13-guion-para-la-demostración)
14. [Preguntas probables y cómo responderlas](#14-preguntas-probables-y-cómo-responderlas)

---

## 1. El problema

Una empresa que da servicio a extintores (matafuegos) tiene que resolver algo que parece
simple y no lo es: **saber qué equipo vence cuándo, y dónde está ese equipo**.

Un taller de recarga maneja miles de matafuegos repartidos entre cientos de clientes. No
alcanza con saber "el consorcio Mitre tiene 12 matafuegos": cada extintor es una unidad
individual, con su propio número de tarjeta, su propia historia de recargas y su propia
fecha de vencimiento. Y cada uno está físicamente en una dirección concreta, que puede no
ser la del cliente: un consorcio puede tener tres edificios, una industria cinco plantas.

Cuando eso se lleva en papel o en una planilla, pasan tres cosas:

- **Se pierden vencimientos.** Nadie avisa al cliente y el equipo queda fuera de norma.
- **No se sabe dónde está cada equipo**, si está en el cliente o en el taller.
- **El stock del taller se descontrola**, porque el consumo de polvo o manómetros se
  anota aparte del trabajo que lo consumió, cuando se anota.

El sistema ataca esos tres puntos.

---

## 2. Qué hace el sistema

Seis módulos, los que pide el requerimiento:

| Módulo | Qué resuelve |
|---|---|
| **Clientes** | Alta, baja y modificación de particulares, comercios, consorcios e industrias |
| **Direcciones** | Varias sucursales por cliente; los equipos se ubican en la dirección, no en el cliente |
| **Matafuegos** | Ficha individual: tarjeta, agente extintor, capacidad, fabricación, estado |
| **Mantenimientos** | Historial de recargas y pruebas hidráulicas, con vencimiento calculado |
| **Alertas** | Panel de equipos que vencen en los próximos 30 días, con el contacto del cliente |
| **Stock y remitos** | Insumos del taller y orden de servicio que descuenta lo consumido |

---

## 3. Tecnologías y por qué

Todo el sistema está escrito en **un solo lenguaje: JavaScript**. El mismo del lado del
servidor y del lado del navegador. Eso reduce el costo de cambiar de contexto: no hay que
pensar en dos sintaxis, dos formas de manejar fechas ni dos maneras de recorrer un
arreglo.

| Capa | Tecnología | Versión | Por qué esta |
|---|---|---|---|
| Base de datos | MySQL | 8.0.46 | Relacional: el dominio son entidades con relaciones claras y reglas de integridad que conviene que las haga el motor |
| Servidor | Node.js | 24.15.0 | Permite JavaScript fuera del navegador |
| API | Express | 4.22.3 | El estándar de facto en Node; ruteo mínimo sin imponer estructura |
| Driver | mysql2 | 3.24.4 | Conexión a MySQL con promesas (`async/await`) y consultas parametrizadas |
| Interfaz | React | 18.3.1 | Interfaz por componentes; el estado cambia y la pantalla se actualiza sola |
| Empaquetado | Vite | 6.4.3 | Servidor de desarrollo instantáneo y proxy integrado hacia la API |

**Seis dependencias directas en total.** Fue una decisión consciente: cada librería que
se agrega es código que hay que entender, mantener y poder explicar. Todo lo que se pudo
hacer con lo que ya venía incluido, se hizo así:

- **Sin librería de variables de entorno** (`dotenv`): Node 20.6+ lee el `.env` de fábrica
  con la opción `--env-file`.
- **Sin librería de CORS**: el proxy de Vite hace que navegador y API compartan origen,
  así que el problema directamente no existe.
- **Sin ORM** (Sequelize, Prisma): las consultas son SQL directo. En un proyecto de esta
  escala un ORM agrega una capa de abstracción que hay que aprender y depurar, y esconde
  justamente lo que la materia quiere ver.
- **Sin librería de rutas en el frontend**: son cinco pantallas; un `useState` con la
  sección activa alcanza.

---

## 4. Arquitectura

Tres capas separadas, cada una con una única responsabilidad:

```
┌──────────────────────────────────────────────────────────────┐
│  NAVEGADOR                                                   │
│  React — cinco pantallas, formularios, tablas                │
│  Puerto 5173 (Vite)                                          │
└────────────────────────┬─────────────────────────────────────┘
                         │  fetch('/api/...')  → HTTP + JSON
                         │  (Vite redirige /api al backend)
┌────────────────────────▼─────────────────────────────────────┐
│  SERVIDOR                                                    │
│  Express — 28 endpoints REST, validaciones, transacciones    │
│  Puerto 3001                                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │  SQL parametrizado (mysql2)
┌────────────────────────▼─────────────────────────────────────┐
│  BASE DE DATOS                                               │
│  MySQL 8 — 8 tablas, claves foráneas, integridad referencial │
│  Puerto 3306                                                 │
└──────────────────────────────────────────────────────────────┘
```

**La regla que ordena todo:** el navegador nunca habla con la base de datos. Pide datos a
la API; la API es la única que sabe SQL. Eso permite cambiar la interfaz sin tocar la
lógica, y viceversa.

### Estructura de carpetas

```
db/
  esquema.sql          Script que crea la base entera

backend/
  .env                 Credenciales (no se comparte)
  src/
    servidor.js        Arranca Express y monta las rutas
    db.js              Pool de conexiones a MySQL
    ayudas.js          Helpers: errores, cálculo de vencimientos
    rutas/             Un archivo por recurso
      clientes.js  direcciones.js  matafuegos.js
      mantenimientos.js  alertas.js  insumos.js  ordenes.js

frontend/
  vite.config.js       Configuración y proxy hacia la API
  src/
    main.jsx           Punto de entrada
    App.jsx            Navegación entre secciones
    api.js             Único lugar que habla con el backend
    componentes.jsx    Modal, campos de formulario, cartel de error
    formato.js         Fechas, moneda y domicilios
    estilos.css        Estilos de toda la aplicación
    paginas/           Una pantalla por módulo
```

### Tres decisiones estructurales que conviene poder explicar

**1. Un archivo de rutas por recurso.** `clientes.js` sabe todo sobre clientes y nada
sobre órdenes. Para encontrar dónde se valida un cliente no hay que buscar: está donde
tiene que estar.

**2. Un único punto de manejo de errores.** Ninguna ruta arma respuestas de error por su
cuenta. Cuando algo falla, se llama a `fallar(409, "Stock insuficiente...")`, que lanza
una excepción; un solo middleware al final de `servidor.js` la atrapa y la convierte en
la respuesta HTTP. Eso garantiza que **todos** los errores salgan con el mismo formato:

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.mensaje || 'Error interno del servidor' });
});
```

**3. Un único punto de acceso a la API desde el frontend.** Todas las pantallas usan
`api.js`. Ninguna llama a `fetch` directamente. Si mañana hay que agregar autenticación,
se toca un solo archivo.

---

## 5. Modelo de datos

Ocho tablas. El diagrama entidad-relación se genera desde MySQL Workbench con
**Database → Reverse Engineer** sobre el esquema `matafuegos` (pasos detallados en
`docs/INSTALACION.md`).

```
clientes ──1:N──> direcciones ──1:N──> matafuegos ──1:N──> mantenimientos
   │                   │                     ▲                    ▲
   │                   │                     │                    │
   └───────┬───────────┘                     │                    │
           │                                 │                    │
           ▼                                 │                    │
   ordenes_servicio ──1:N──> orden_matafuegos┘────────────────────┘
           │
           └──1:N──> orden_insumos ──N:1──> insumos
```

### La relación que define el modelo

```
clientes 1 ──── N direcciones 1 ──── N matafuegos
```

**Un matafuego no cuelga del cliente: cuelga de una dirección.** Es la decisión de
modelado más importante del proyecto y la que más conviene tener clara.

Si los equipos colgaran directamente del cliente, un consorcio con tres edificios tendría
sus 36 matafuegos en una bolsa única, sin forma de saber cuáles están en cuál edificio. Y
cuando el panel de alertas avisa que hay cinco equipos por vencer, el operario necesita
saber **a qué dirección ir a buscarlos**. Por eso el requerimiento pide explícitamente
"asociación de múltiples direcciones o sucursales a un mismo cliente", y por eso la
dirección es una entidad propia y no un campo de texto dentro del cliente.

### Tablas

| Tabla | Guarda | Detalle relevante |
|---|---|---|
| `clientes` | Razón social, tipo, CUIT, contacto | `tipo` es un ENUM con los cuatro tipos pedidos |
| `direcciones` | Sucursales | Borrado en cascada: si se borra el cliente, se van sus direcciones |
| `matafuegos` | Ficha por unidad física | `numero_tarjeta` es UNIQUE: no puede haber dos iguales |
| `mantenimientos` | Cada recarga y prueba hidráulica | Guarda su propia `fecha_vencimiento` |
| `insumos` | Polvo, manómetros, mangueras | Con stock actual, mínimo y precio |
| `ordenes_servicio` | Cabecera del remito | Numeración propia `OS-000001` |
| `orden_matafuegos` | Qué equipos incluye la orden | Enlaza con el mantenimiento realizado |
| `orden_insumos` | Qué insumos consumió | Guarda el precio del momento |

### Integridad delegada al motor

Varias reglas están en la base, no en el código:

- **Claves foráneas**: no se puede cargar un matafuego en una dirección inexistente.
- **`UNIQUE` en `numero_tarjeta`**: si dos operarios cargan la misma tarjeta a la vez, uno
  de los dos falla. Si la validación estuviera solo en el código, ambos podrían pasar el
  control y entrar.
- **`ENUM`** en tipo de cliente, agente extintor y estado: valores fuera de la lista no
  entran.
- **`ON DELETE CASCADE`** de cliente a direcciones y de matafuego a mantenimientos: no
  quedan registros huérfanos.

La validación en el servidor existe igual, pero para **dar un mensaje claro al usuario**.
La garantía de que el dato no se corrompe la da la base.

### Por qué el precio se copia en `orden_insumos`

`orden_insumos` guarda `precio_unitario` aunque el precio ya esté en `insumos`. No es
redundancia por error: es deliberado. Si el polvo sube de $3.500 a $4.200, un remito
emitido el mes pasado tiene que seguir mostrando $3.500. Un documento emitido no puede
cambiar retroactivamente porque cambió una tabla maestra.

---

## 6. La lógica del negocio

Es lo que diferencia este sistema de un ABM genérico. Tres puntos.

### 6.1 Dos relojes por equipo

Cada matafuego tiene **dos ciclos de vencimiento que corren en paralelo y por separado**:

- **Recarga** — vence al año.
- **Prueba hidráulica** — vence a los 5 años (lo fija el requerimiento).

Un equipo puede tener la recarga al día y la prueba hidráulica vencida, o al revés. Por
eso el próximo vencimiento de un equipo es **el más cercano de los dos**.

Esto se resuelve en SQL, en `backend/src/ayudas.js`:

```sql
(SELECT MIN(t.venc)
   FROM (SELECT matafuego_id, tipo, MAX(fecha_vencimiento) AS venc
           FROM mantenimientos GROUP BY matafuego_id, tipo) t
  WHERE t.matafuego_id = m.id)
```

Se lee de adentro hacia afuera: la consulta interna toma, para cada equipo **y cada
tipo**, el vencimiento más lejano (el del último trabajo de ese tipo). La externa toma el
**más cercano** entre esos dos. El resultado es la fecha que hay que vigilar.

Está escrito una sola vez y se reutiliza en el listado de matafuegos, en la ficha y en el
panel de alertas.

### 6.2 El vencimiento se calcula, no se escribe

El usuario nunca tipea una fecha de vencimiento. Carga el trabajo y la fecha en que se
hizo; el sistema calcula el vencimiento:

```js
const ANIOS_POR_TIPO = { recarga: 1, prueba_hidraulica: 5 };
```

Si el vencimiento fuera un campo libre, alcanzaría un error de tipeo para que un equipo
quede fuera del panel de alertas. La regla vive en un solo lugar y se aplica siempre
igual.

### 6.3 El stock y el trabajo son el mismo hecho

Cuando el taller recarga un matafuego, pasan dos cosas **que son la misma**: se registra
el trabajo y se consumen 5 kg de polvo. Si se guardan por separado, tarde o temprano el
inventario deja de coincidir con la realidad.

Por eso el alta de una orden de servicio es una **transacción**: o se guarda todo, o no
se guarda nada.

```js
await conexion.beginTransaction();
// 1. verificar stock de cada insumo (con FOR UPDATE)
// 2. insertar la orden
// 3. insertar equipos e insumos
// 4. descontar el stock
await conexion.commit();      // si algo falló: rollback
```

El `SELECT ... FOR UPDATE` bloquea la fila del insumo hasta terminar. Sin eso, dos órdenes
simultáneas podrían leer "quedan 5 kg", ambas dar el visto bueno y dejar el stock en
negativo.

Anular una orden hace el camino inverso dentro de otra transacción: devuelve al stock lo
que se había consumido.

---

## 7. Recorrido por los módulos

### Clientes

ABM con búsqueda por nombre o CUIT y filtro por tipo. La baja es **lógica**: marca el
cliente como inactivo en vez de borrarlo. Si se borrara de verdad, se perdería el
historial de mantenimiento de todos sus equipos, que es información que el taller necesita
conservar aunque el cliente ya no sea cliente.

### Direcciones

Se administran desde la ficha del cliente. No deja borrar una dirección que tiene equipos
asignados: devuelve un error explicando por qué, en vez de borrar los equipos en silencio.

### Matafuegos

Ficha individual con número de tarjeta único, tipo de agente (Agua, Polvo ABC, Polvo BC,
CO2, Espuma AFFF, Halotron), capacidad en kg o litros, fecha de fabricación y estado (en
cliente / en taller / baja). Desde la ficha se ve el historial completo y se registran
mantenimientos.

### Panel de vencimientos

Es la pantalla que se abre primero, porque es la que dispara el trabajo diario. Lista los
equipos que vencen dentro de los próximos 30 días (configurable a 60 o 90) **e incluye los
ya vencidos**, que son los más urgentes.

Cada fila trae el teléfono y el mail del cliente. Eso no es decorativo: el flujo real es
"veo que vence, llamo para coordinar el retiro", y sin el contacto habría que ir a
buscarlo a otra pantalla.

Los vencidos se marcan en rojo con los días de atraso; los próximos, en amarillo con los
días restantes.

### Insumos

ABM con stock actual, stock mínimo y precio. Los que están en o por debajo del mínimo se
marcan con una etiqueta "reponer" y un aviso arriba de la tabla. No deja borrar un insumo
que figura en órdenes ya emitidas: rompería el historial.

### Órdenes de servicio / remitos

Al crear una orden se elige el cliente y la dirección, se tildan los equipos que se
devuelven (el sistema trae automáticamente el último trabajo hecho a cada uno) y se cargan
los insumos consumidos. El total se calcula solo.

El remito resultante se imprime desde el navegador. Al imprimir, una regla
`@media print` oculta la interfaz y deja solo el documento, con las dos líneas de firma.

---

## 8. Decisiones de diseño

Cinco decisiones que conviene poder justificar:

**1. SQL directo en vez de un ORM.** Las consultas del proyecto —sobre todo la de
vencimientos— se expresan mejor en SQL que a través de una capa de abstracción. Además, el
SQL se puede probar en Workbench y explicar línea por línea.

**2. Bajas lógicas en clientes, físicas en el resto.** Un cliente que se da de baja sigue
teniendo historial que vale la pena conservar. Un insumo mal cargado no: se borra, salvo
que ya figure en una orden emitida.

**3. Remito operativo, no factura fiscal.** El requerimiento pide "orden de servicio /
remito de entrega" y no menciona IVA, CAE ni condición fiscal. Se implementó el documento
que el taller necesita para entregar el equipo, sin la maquinaria de facturación
electrónica que nadie pidió. Es una decisión de alcance, y es defendible: agregar
numeración AFIP habría sido inventar requisitos.

**4. El proxy en lugar de CORS.** Configurar CORS es la solución habitual cuando el
frontend y la API están en puertos distintos. El proxy de Vite hace que compartan origen,
con lo cual el problema desaparece en vez de resolverse. Menos configuración y menos
superficie para equivocarse.

**5. Consultas siempre parametrizadas.** Ningún dato del usuario se concatena dentro de un
string de SQL. Siempre `?` y un arreglo de valores:

```js
await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
```

Eso es lo que hace que una inyección SQL no sea posible: el driver manda la consulta y los
datos por separado, y el motor nunca interpreta un dato como instrucción.

---

## 9. Cómo se desarrolló

El orden de construcción fue de abajo hacia arriba, y no por casualidad:

1. **Esquema de la base.** Primero el modelo de datos, porque todo lo demás depende de
   cómo estén organizadas las entidades.
2. **Backend por recurso.** Clientes, direcciones, matafuegos, mantenimientos, alertas.
   Cada uno se probó con peticiones HTTP antes de que existiera una pantalla.
3. **Frontend sobre una API ya funcionando.** Al llegar a la interfaz, los datos ya
   llegaban bien; los problemas que aparecían eran de presentación, no de lógica.
4. **Stock y órdenes al final**, porque dependen de que existan clientes, equipos y
   mantenimientos.

El control de versiones se llevó con Git, un commit por avance lógico. Cada commit deja el
proyecto en un estado que funciona.

---

## 10. Pruebas realizadas

El sistema se probó en tres niveles:

**API.** Cada endpoint, con peticiones HTTP directas: altas, modificaciones, bajas, y
también los casos que **tienen que fallar** — tarjeta duplicada, capacidad negativa, tipo
de cliente inválido, borrar una dirección con equipos, entregar dos veces la misma orden.

**Transacciones.** Se emitió una orden con un insumo con stock insuficiente y se verificó
que el stock quedara **exactamente igual** que antes: ningún insumo de la misma orden se
descontó a medias.

**Interfaz.** Se manejó la aplicación en un navegador real, recorriendo las cinco
pantallas y abriendo los modales de ficha y de remito, verificando que no hubiera errores
de consola.

### Dos errores encontrados así

Vale la pena mencionarlos, porque muestran para qué sirve probar:

1. **Alta de matafuego sin estado.** Si el campo no venía, se mandaba `NULL` a una columna
   `NOT NULL` y el alta fallaba con error 500. Se corrigió completando el valor por
   defecto antes del INSERT.

2. **El número de orden pisado en el remito.** La consulta del remito une
   `ordenes_servicio` con `direcciones`, y **ambas tablas tienen una columna `numero`**:
   el número de orden y la altura de la calle. Al combinarlas, la altura sobrescribía el
   número de orden, y el remito mostraba "1234" en vez de "OS-000002". Se resolvió
   renombrando la columna en la consulta con un alias.

El segundo es el más interesante para contar: es un error que **no rompe nada** —no hay
excepción, no hay pantalla en blanco— y solo se detecta mirando el resultado final.

---

## 11. Números del proyecto

| | |
|---|---|
| Líneas de código | ~1.970 |
| Tablas | 8 |
| Endpoints REST | 28 |
| Pantallas | 5 |
| Dependencias directas | 6 |
| Archivos de código | 22 |

Reparto: backend ~600 líneas, frontend ~1.250, esquema SQL 120.

---

## 12. Limitaciones y trabajo futuro

Reconocer los límites del trabajo es parte de defenderlo:

**No tiene usuarios ni login.** Cualquiera que abra la aplicación puede hacer todo. Para
un sistema real haría falta autenticación y permisos por rol (operario de taller vs.
administración). No se implementó porque el requerimiento no lo pide.

**Está pensado para red local.** Frontend y backend corren en la misma máquina. Publicarlo
en internet exigiría HTTPS, autenticación y revisar la configuración del proxy.

**El período de recarga está fijo en un año.** El requerimiento especifica los 5 años de la
prueba hidráulica pero no dice nada de la recarga; se asumió el año, que es lo habitual.
Está en una constante, en un solo lugar, listo para cambiarse.

**No hay avisos automáticos.** El panel de vencimientos hay que abrirlo. Un paso natural
sería mandar un mail o un WhatsApp automático al cliente cuando faltan 30 días.

**Sin exportación a Excel ni PDF nativo.** El remito se imprime desde el navegador, que
permite "guardar como PDF", pero no se genera el archivo desde el servidor.

**Otras mejoras posibles:** código QR en la tarjeta de cada equipo para ficharlo con el
celular, historial de precios de insumos, y reportes de facturación por período.

---

## 13. Guion para la demostración

Ocho minutos, en este orden. La secuencia está armada para que cada paso construya sobre
el anterior y el último cierre el círculo.

**Antes de empezar:** los dos servidores levantados y el navegador abierto en
http://localhost:5173.

| # | Qué mostrar | Qué decir mientras tanto |
|---|---|---|
| 1 | La solapa **Vencimientos**, que abre primero | "Esta es la pantalla que se abre al entrar, porque es la que dispara el trabajo del día: qué equipos hay que ir a buscar." |
| 2 | Crear un **cliente** tipo consorcio | "Los cuatro tipos que pide el requerimiento son un ENUM en la base: no entra un valor fuera de la lista." |
| 3 | Agregarle **dos direcciones** | "Acá está la decisión de modelado principal: el equipo cuelga de la dirección, no del cliente. Un consorcio puede tener tres edificios." |
| 4 | Cargar un **matafuego** en una de ellas | "Ficha individual: tarjeta única, agente, capacidad, fabricación." |
| 5 | Intentar cargar **otro con la misma tarjeta** | "El error no lo da el código: lo da la restricción UNIQUE de la base. Si lo validara solo el servidor, dos altas simultáneas podrían pasar las dos." |
| 6 | Abrir la ficha y registrar una **recarga de hace once meses** | "La fecha de vencimiento no se tipea: el sistema la calcula. Recarga, un año." |
| 7 | Volver a **Vencimientos**: aparece el equipo | "Y acá cierra el círculo. Fijate que trae el teléfono del cliente: el flujo real es ver el vencimiento y llamar para coordinar el retiro." |
| 8 | **Insumos**: mostrar uno bajo el mínimo | "El taller controla polvo, manómetros, mangueras." |
| 9 | Emitir una **orden**, tildar el equipo, cargar 5 kg de polvo | "Mirá el stock antes de confirmar." |
| 10 | Mostrar el **stock descontado** | "El descuento va en la misma transacción que la orden. No se puede registrar el trabajo sin descontar lo que consumió." |
| 11 | Abrir el **remito** e imprimir | "Al imprimir desaparece la interfaz y queda solo el documento, con las dos firmas." |

**Si sobra tiempo:** mostrar el diagrama entidad-relación en Workbench y recorrer las
relaciones.

**Si falta tiempo:** saltear los pasos 8 a 10 y pasar directo al remito.

---

## 14. Preguntas probables y cómo responderlas

**¿Por qué MySQL y no MongoDB?**
Porque el dominio es relacional. Un matafuego pertenece a una dirección que pertenece a un
cliente, y esas relaciones tienen reglas que conviene que garantice el motor. En una base
documental habría que replicar datos o mantener esas reglas a mano desde el código.

**¿Por qué no usaste un ORM?**
La consulta central del sistema —el próximo vencimiento entre dos ciclos— se expresa
naturalmente en SQL y se vuelve confusa a través de un ORM. Además el SQL se puede probar
directo en Workbench.

**¿Cómo evitás la inyección SQL?**
Todas las consultas son parametrizadas: los datos del usuario nunca se concatenan al
string de la consulta, van en un arreglo aparte. El driver manda consulta y datos por
separado y el motor nunca interpreta un dato como instrucción.

**¿Qué pasa si dos personas cargan la misma tarjeta al mismo tiempo?**
Entra una sola. La restricción `UNIQUE` está en la base, así que el motor rechaza la
segunda aunque las dos hayan pasado la validación del servidor.

**¿Y si se corta la luz mientras se emite una orden?**
No queda nada a medias. El alta es una transacción: o se guardan la orden, los equipos y
el descuento de stock, o no se guarda nada.

**¿Por qué el vencimiento se guarda en cada mantenimiento y no se calcula al vuelo?**
Porque es un dato del hecho ocurrido. La recarga del 1/10/2025 venció el 1/10/2026, y eso
no cambia aunque mañana se modifique la regla del año. Lo que sí se calcula al vuelo es el
*próximo* vencimiento del equipo, que surge de comparar los dos ciclos.

**¿Por qué la baja de clientes es lógica?**
Porque borrarlo se llevaría el historial de mantenimiento de todos sus equipos, que es
información que el taller necesita conservar.

**¿Se puede usar desde varias computadoras a la vez?**
Sí, en red local: la base y el backend corren en una máquina y las demás acceden por el
navegador. Haría falta ajustar la configuración del proxy y, para un uso real, agregar
autenticación.

**¿Cuánto tardarías en agregar facturación con AFIP?**
Es un módulo aparte: haría falta la integración con el web service de AFIP, guardar el CAE
y los datos fiscales del cliente. El modelo ya está preparado para colgarlo de
`ordenes_servicio` sin rehacer nada.

**¿Qué fue lo más difícil?**
La consulta del próximo vencimiento. No es obvia porque hay que tomar, para cada equipo, el
último vencimiento **de cada tipo** y después quedarse con el más cercano entre ellos: dos
agregaciones anidadas en sentidos opuestos, un MAX adentro y un MIN afuera.
