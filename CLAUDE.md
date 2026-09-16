# CLAUDE.md

Este archivo guía a Claude Code en este repositorio.

## Objetivo

Desarrollar el sistema descrito en `Requerimientos/Software .pdf`. Antes de escribir
código, leer el PDF completo: es la única fuente de verdad sobre qué construir.

Implementar **exactamente** lo que piden los requerimientos: ni más ni menos. No agregar
funcionalidades, pantallas, roles, autenticación, reportes, tests exhaustivos,
Docker ni ninguna otra cosa que el PDF no solicite. Si algo del PDF es ambiguo, preguntar
antes de asumir.

## Stack (obligatorio)

- **100% JavaScript**, en frontend y backend. **Prohibido TypeScript** (ni archivos
  `.ts`/`.tsx`, ni `tsconfig`, ni tipos JSDoc forzados).
- Backend: Node.js + Express.
- Frontend: React + Vite (plantilla JavaScript).
- Base de datos: elegir la opción más simple de desplegar y de enviar. Antes de crear el
  proyecto, **confirmar con el usuario el motor de base de datos** (recomendación: SQLite,
  porque no requiere instalar un servidor y el proyecto se puede entregar tal cual).
- Mínimas dependencias. Solo agregar una librería si resuelve algo que el requerimiento
  necesita y hacerlo a mano sería desproporcionado.
- Estructura simple: una carpeta `backend/` y una `frontend/`, cada una con su
  `package.json`, más un `README.md` en la raíz con los pasos para instalar y ejecutar.

## Permisos: qué puede hacer Claude y qué no

### Puede hacer por su cuenta (dentro de la carpeta del proyecto)

- Navegar carpetas, leer cualquier archivo del proyecto y contextualizarse libremente.
- Crear, editar y borrar archivos del proyecto.
- Ejecutar comandos de terminal necesarios para desarrollar y probar: `npm install`,
  `npm run dev`, `npm run build`, scripts del proyecto, etc.
- Ejecutar migraciones y seeds de la base de datos una vez que la base exista.
- Git local: `git init`, `git add`, `git commit`, crear y cambiar de ramas.
  Commits pequeños, uno por avance lógico, con mensajes descriptivos en español.

### No puede hacer

- `git push`, crear repositorios remotos ni configurar `git remote` (el repositorio
  remoto todavía no existe).
- Ejecutar comandos o modificar archivos **fuera** de la carpeta del proyecto.
- Instalar software global en el sistema (motores de base de datos, `npm install -g`,
  gestores de paquetes del sistema, etc.).
- Abrir o manejar otros programas (gestores de base de datos, consolas externas,
  paneles de hosting, etc.).

### Cuando haga falta algo fuera de su alcance

Detenerse y darle al usuario instrucciones paso a paso, claras y concretas, para que
lo haga él (por ejemplo: instalar un motor de base de datos, crear la base y el usuario,
completar un archivo `.env`). Indicar exactamente qué valores usar y qué avisar al
terminar. Continuar solo cuando el usuario confirme.

## Forma de trabajo

1. Leer `Requerimientos/Software .pdf`.
2. Confirmar el motor de base de datos con el usuario.
3. Crear la estructura del proyecto y hacer el primer commit.
4. Implementar módulo por módulo, probando cada uno antes de pasar al siguiente, con un
   commit por módulo o avance.
5. Mantener el `README.md` actualizado con los comandos reales de instalación y ejecución.
6. Una vez creado el proyecto, reemplazar la sección "Comandos" de abajo con los comandos
   reales.

## Comandos

Todavía no hay código. Completar cuando exista el proyecto.

## Dominio: gestión de servicio de matafuegos

Proyecto académico — Instituto Superior San Cristóbal, *Técnicas Avanzadas de
Programación* (Prof. Costilla Nelson). Equipo de dos personas.

El sistema gestiona clientes, stock y el **ciclo de vida de cada matafuego** para un
taller que recarga y certifica unidades. El vocabulario del dominio es en español y así
debe quedar en el modelo, la base de datos y la interfaz (*matafuego*, *remito*,
*consorcio*, etc.).

### Módulos requeridos

1. **Clientes** — CRUD completo sobre cuatro tipos: `particular`, `comercio`,
   `consorcio`, `industria`. Un cliente tiene **muchas direcciones/sucursales**; los
   matafuegos están en una dirección, no directamente en el cliente.
2. **Matafuegos** — una ficha por unidad física: número de tarjeta / código, tipo de
   agente (Agua, Polvo ABC, CO2, …), capacidad (kg o litros), fecha de fabricación.
   Cada unidad se sigue individualmente y se mueve entre el cliente y el taller.
3. **Mantenimientos** — historial por unidad de *recargas* y *prueba hidráulica*
   (obligatoria cada 5 años), cada una con su **fecha de próximo vencimiento**. El
   próximo vencimiento se calcula a partir del historial, no es un campo editable suelto.
4. **Alertas y vencimientos** — listado de unidades que vencen en los próximos 30 días,
   para coordinar el retiro con el cliente. Es el núcleo operativo de la aplicación.
5. **Facturación y stock** — insumos consumidos en el taller (kilos de polvo,
   manómetros, mangueras, repuestos), que se descuentan con cada servicio.
6. **Órdenes de servicio / remitos de entrega** — documento imprimible que se emite
   cuando la unidad se devuelve "cargada y controlada".

### Notas de modelado

- Recarga y prueba hidráulica tienen vencimientos independientes por unidad; el panel de
  alertas debe considerar el que venza primero.
- El descuento de stock y el registro de mantenimiento son parte del mismo evento de
  servicio: guardarlos juntos (en una misma transacción) para que el inventario no quede
  desfasado del historial.
- Si al leer el PDF algo de esta sección no coincide con lo que dice, manda el PDF.