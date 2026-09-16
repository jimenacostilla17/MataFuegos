import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar } from '../ayudas.js';

const router = Router();
const CAMPOS = ['cliente_id', 'etiqueta', 'calle', 'numero', 'piso_depto', 'localidad', 'provincia', 'codigo_postal'];

function validar(body) {
  if (!body.cliente_id) fallar(400, 'Falta el cliente');
  if (!body.etiqueta?.trim()) fallar(400, 'La etiqueta es obligatoria');
  if (!body.calle?.trim()) fallar(400, 'La calle es obligatoria');
  if (!body.localidad?.trim()) fallar(400, 'La localidad es obligatoria');
}

// Todas las direcciones, opcionalmente filtradas por cliente
router.get('/', ruta(async (req, res) => {
  const { cliente_id } = req.query;
  const [filas] = await db.query(
    `SELECT d.*, c.razon_social,
            (SELECT COUNT(*) FROM matafuegos m WHERE m.direccion_id = d.id) AS cantidad_matafuegos
       FROM direcciones d
       JOIN clientes c ON c.id = d.cliente_id
       ${cliente_id ? 'WHERE d.cliente_id = ?' : ''}
       ORDER BY c.razon_social, d.etiqueta`,
    cliente_id ? [cliente_id] : []
  );
  res.json(filas);
}));

router.post('/', ruta(async (req, res) => {
  validar(req.body);
  const valores = CAMPOS.map((c) => req.body[c] ?? null);
  const [r] = await db.query(
    `INSERT INTO direcciones (${CAMPOS.join(',')}) VALUES (${CAMPOS.map(() => '?').join(',')})`,
    valores
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', ruta(async (req, res) => {
  validar(req.body);
  const valores = CAMPOS.map((c) => req.body[c] ?? null);
  const [r] = await db.query(
    `UPDATE direcciones SET ${CAMPOS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    [...valores, req.params.id]
  );
  if (!r.affectedRows) fallar(404, 'Direccion no encontrada');
  res.json({ ok: true });
}));

router.delete('/:id', ruta(async (req, res) => {
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM matafuegos WHERE direccion_id = ?', [req.params.id]
  );
  if (total) fallar(409, 'No se puede borrar: la direccion tiene matafuegos asignados');
  const [r] = await db.query('DELETE FROM direcciones WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) fallar(404, 'Direccion no encontrada');
  res.json({ ok: true });
}));

export default router;
