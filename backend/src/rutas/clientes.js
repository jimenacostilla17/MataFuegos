import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar } from '../ayudas.js';

const router = Router();

const CAMPOS = ['tipo', 'razon_social', 'documento', 'telefono', 'email'];

function validar(body) {
  if (!body.razon_social?.trim()) fallar(400, 'La razon social es obligatoria');
  if (!['particular', 'comercio', 'consorcio', 'industria'].includes(body.tipo)) {
    fallar(400, 'Tipo de cliente invalido');
  }
}

// Listado con busqueda y filtro por tipo
router.get('/', ruta(async (req, res) => {
  const { buscar = '', tipo = '', incluir_inactivos } = req.query;
  const where = [];
  const params = [];
  if (!incluir_inactivos) where.push('c.activo = 1');
  if (tipo) { where.push('c.tipo = ?'); params.push(tipo); }
  if (buscar) {
    where.push('(c.razon_social LIKE ? OR c.documento LIKE ?)');
    params.push(`%${buscar}%`, `%${buscar}%`);
  }
  const [filas] = await db.query(
    `SELECT c.*, (SELECT COUNT(*) FROM direcciones d WHERE d.cliente_id = c.id) AS cantidad_direcciones
       FROM clientes c
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY c.razon_social`,
    params
  );
  res.json(filas);
}));

// Ficha del cliente con todas sus direcciones
router.get('/:id', ruta(async (req, res) => {
  const [[cliente]] = await db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
  if (!cliente) fallar(404, 'Cliente no encontrado');
  const [direcciones] = await db.query(
    'SELECT * FROM direcciones WHERE cliente_id = ? ORDER BY etiqueta', [req.params.id]
  );
  res.json({ ...cliente, direcciones });
}));

router.post('/', ruta(async (req, res) => {
  validar(req.body);
  const valores = CAMPOS.map((c) => req.body[c] ?? null);
  const [r] = await db.query(
    `INSERT INTO clientes (${CAMPOS.join(',')}) VALUES (${CAMPOS.map(() => '?').join(',')})`,
    valores
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', ruta(async (req, res) => {
  validar(req.body);
  const valores = CAMPOS.map((c) => req.body[c] ?? null);
  const [r] = await db.query(
    `UPDATE clientes SET ${CAMPOS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    [...valores, req.params.id]
  );
  if (!r.affectedRows) fallar(404, 'Cliente no encontrado');
  res.json({ ok: true });
}));

// Baja logica: el historial de sus matafuegos se conserva.
router.delete('/:id', ruta(async (req, res) => {
  const [r] = await db.query('UPDATE clientes SET activo = 0 WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) fallar(404, 'Cliente no encontrado');
  res.json({ ok: true });
}));

router.post('/:id/reactivar', ruta(async (req, res) => {
  await db.query('UPDATE clientes SET activo = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
