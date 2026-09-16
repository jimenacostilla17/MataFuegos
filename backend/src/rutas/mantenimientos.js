import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar, calcularVencimiento } from '../ayudas.js';

const router = Router();

router.get('/', ruta(async (req, res) => {
  const { matafuego_id } = req.query;
  if (!matafuego_id) fallar(400, 'Falta el matafuego');
  const [filas] = await db.query(
    'SELECT * FROM mantenimientos WHERE matafuego_id = ? ORDER BY fecha DESC, id DESC',
    [matafuego_id]
  );
  res.json(filas);
}));

// El vencimiento no se recibe del cliente: se calcula segun el tipo.
router.post('/', ruta(async (req, res) => {
  const { matafuego_id, tipo, fecha, observaciones = null } = req.body;
  if (!matafuego_id) fallar(400, 'Falta el matafuego');
  if (!fecha) fallar(400, 'Falta la fecha del trabajo');
  const fecha_vencimiento = calcularVencimiento(tipo, fecha);

  const [[equipo]] = await db.query('SELECT id FROM matafuegos WHERE id = ?', [matafuego_id]);
  if (!equipo) fallar(404, 'Matafuego no encontrado');

  const [r] = await db.query(
    'INSERT INTO mantenimientos (matafuego_id, tipo, fecha, fecha_vencimiento, observaciones) VALUES (?,?,?,?,?)',
    [matafuego_id, tipo, fecha, fecha_vencimiento, observaciones]
  );
  res.status(201).json({ id: r.insertId, fecha_vencimiento });
}));

router.delete('/:id', ruta(async (req, res) => {
  const [r] = await db.query('DELETE FROM mantenimientos WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) fallar(404, 'Mantenimiento no encontrado');
  res.json({ ok: true });
}));

export default router;
