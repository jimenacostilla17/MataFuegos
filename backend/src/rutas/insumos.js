import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar } from '../ayudas.js';

const router = Router();
const CAMPOS = ['nombre', 'unidad_medida', 'stock', 'stock_minimo', 'precio_unitario'];
const POR_DEFECTO = { stock: 0, stock_minimo: 0, precio_unitario: 0 };

const aValores = (body) => CAMPOS.map((c) => body[c] ?? POR_DEFECTO[c] ?? null);

function validar(body) {
  if (!body.nombre?.trim()) fallar(400, 'El nombre del insumo es obligatorio');
  if (!body.unidad_medida?.trim()) fallar(400, 'La unidad de medida es obligatoria');
  if (Number(body.stock) < 0) fallar(400, 'El stock no puede ser negativo');
}

// Listado; ?faltantes=1 devuelve solo los que estan en o por debajo del minimo.
router.get('/', ruta(async (req, res) => {
  const [filas] = await db.query(
    `SELECT *, (stock <= stock_minimo) AS bajo_minimo
       FROM insumos
       ${req.query.faltantes ? 'WHERE stock <= stock_minimo' : ''}
       ORDER BY nombre`
  );
  res.json(filas);
}));

router.post('/', ruta(async (req, res) => {
  validar(req.body);
  const [r] = await db.query(
    `INSERT INTO insumos (${CAMPOS.join(',')}) VALUES (${CAMPOS.map(() => '?').join(',')})`,
    aValores(req.body)
  );
  res.status(201).json({ id: r.insertId });
}));

router.put('/:id', ruta(async (req, res) => {
  validar(req.body);
  const [r] = await db.query(
    `UPDATE insumos SET ${CAMPOS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
    [...aValores(req.body), req.params.id]
  );
  if (!r.affectedRows) fallar(404, 'Insumo no encontrado');
  res.json({ ok: true });
}));

router.delete('/:id', ruta(async (req, res) => {
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM orden_insumos WHERE insumo_id = ?', [req.params.id]
  );
  if (total) fallar(409, 'No se puede borrar: el insumo figura en ordenes de servicio');
  const [r] = await db.query('DELETE FROM insumos WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) fallar(404, 'Insumo no encontrado');
  res.json({ ok: true });
}));

export default router;
