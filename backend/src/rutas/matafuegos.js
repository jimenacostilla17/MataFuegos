import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar, SQL_PROXIMO_VENCIMIENTO } from '../ayudas.js';

const router = Router();
const CAMPOS = ['direccion_id', 'numero_tarjeta', 'tipo_agente', 'capacidad', 'unidad_capacidad', 'fecha_fabricacion', 'estado'];

// Campos con valor por defecto en la base: si no vienen, se completan aca
// (mandar NULL explicito falla porque la columna es NOT NULL).
const POR_DEFECTO = { estado: 'en_cliente', unidad_capacidad: 'kg' };

const aValores = (body) =>
  CAMPOS.map((c) => body[c] ?? POR_DEFECTO[c] ?? null);

function validar(body) {
  if (!body.direccion_id) fallar(400, 'Falta la direccion donde esta instalado');
  if (!body.numero_tarjeta?.trim()) fallar(400, 'El numero de tarjeta es obligatorio');
  if (!body.tipo_agente) fallar(400, 'Falta el tipo de agente extintor');
  if (!(Number(body.capacidad) > 0)) fallar(400, 'La capacidad debe ser mayor a cero');
  if (!body.fecha_fabricacion) fallar(400, 'Falta la fecha de fabricacion');
}

const SELECT_BASE = `
  SELECT m.*, ${SQL_PROXIMO_VENCIMIENTO} AS proximo_vencimiento,
         d.etiqueta, d.calle, d.numero, d.localidad,
         c.id AS cliente_id, c.razon_social
    FROM matafuegos m
    JOIN direcciones d ON d.id = m.direccion_id
    JOIN clientes c    ON c.id = d.cliente_id`;

router.get('/', ruta(async (req, res) => {
  const { buscar = '', cliente_id = '', direccion_id = '', estado = '' } = req.query;
  const where = [];
  const params = [];
  if (buscar) { where.push('m.numero_tarjeta LIKE ?'); params.push(`%${buscar}%`); }
  if (cliente_id) { where.push('c.id = ?'); params.push(cliente_id); }
  if (direccion_id) { where.push('m.direccion_id = ?'); params.push(direccion_id); }
  if (estado) { where.push('m.estado = ?'); params.push(estado); }
  const [filas] = await db.query(
    `${SELECT_BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.numero_tarjeta`,
    params
  );
  res.json(filas);
}));

// Ficha completa con historial de mantenimientos
router.get('/:id', ruta(async (req, res) => {
  const [[equipo]] = await db.query(`${SELECT_BASE} WHERE m.id = ?`, [req.params.id]);
  if (!equipo) fallar(404, 'Matafuego no encontrado');
  const [historial] = await db.query(
    'SELECT * FROM mantenimientos WHERE matafuego_id = ? ORDER BY fecha DESC, id DESC',
    [req.params.id]
  );
  res.json({ ...equipo, historial });
}));

router.post('/', ruta(async (req, res) => {
  validar(req.body);
  const valores = aValores(req.body);
  try {
    const [r] = await db.query(
      `INSERT INTO matafuegos (${CAMPOS.join(',')}) VALUES (${CAMPOS.map(() => '?').join(',')})`,
      valores
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') fallar(409, 'Ya existe un matafuego con ese numero de tarjeta');
    throw e;
  }
}));

router.put('/:id', ruta(async (req, res) => {
  validar(req.body);
  const valores = aValores(req.body);
  try {
    const [r] = await db.query(
      `UPDATE matafuegos SET ${CAMPOS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...valores, req.params.id]
    );
    if (!r.affectedRows) fallar(404, 'Matafuego no encontrado');
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') fallar(409, 'Ya existe un matafuego con ese numero de tarjeta');
    throw e;
  }
}));

router.delete('/:id', ruta(async (req, res) => {
  const [r] = await db.query('DELETE FROM matafuegos WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) fallar(404, 'Matafuego no encontrado');
  res.json({ ok: true });
}));

export default router;
