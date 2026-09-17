import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar } from '../ayudas.js';

const router = Router();

const ALICUOTA = 21.0;

router.get('/', ruta(async (req, res) => {
  const [filas] = await db.query(
    `SELECT f.*, o.numero AS numero_orden, c.razon_social, c.documento
       FROM facturas f
       JOIN ordenes_servicio o ON o.id = f.orden_id
       JOIN clientes c         ON c.id = f.cliente_id
       ORDER BY f.fecha DESC, f.id DESC`
  );
  res.json(filas);
}));

// Ordenes que todavia no fueron facturadas, para el desplegable del alta.
router.get('/pendientes', ruta(async (req, res) => {
  const [filas] = await db.query(
    `SELECT o.id, o.numero, o.fecha, o.total, c.razon_social
       FROM ordenes_servicio o
       JOIN clientes c ON c.id = o.cliente_id
      WHERE o.id NOT IN (SELECT orden_id FROM facturas)
      ORDER BY o.fecha DESC, o.id DESC`
  );
  res.json(filas);
}));

// Factura completa con el detalle de la orden que le dio origen.
router.get('/:id', ruta(async (req, res) => {
  const [[factura]] = await db.query(
    `SELECT f.*, o.numero AS numero_orden, o.fecha AS fecha_orden,
            c.razon_social, c.documento, c.tipo, c.telefono,
            d.etiqueta, d.calle, d.numero AS direccion_numero, d.piso_depto,
            d.localidad, d.provincia
       FROM facturas f
       JOIN ordenes_servicio o ON o.id = f.orden_id
       JOIN clientes c         ON c.id = f.cliente_id
       JOIN direcciones d      ON d.id = o.direccion_id
      WHERE f.id = ?`,
    [req.params.id]
  );
  if (!factura) fallar(404, 'Factura no encontrada');

  const [equipos] = await db.query(
    `SELECT m.numero_tarjeta, m.tipo_agente, m.capacidad, m.unidad_capacidad, t.tipo AS trabajo
       FROM orden_matafuegos om
       JOIN matafuegos m ON m.id = om.matafuego_id
       LEFT JOIN mantenimientos t ON t.id = om.mantenimiento_id
      WHERE om.orden_id = ?`,
    [factura.orden_id]
  );
  const [insumos] = await db.query(
    `SELECT i.nombre, i.unidad_medida, oi.cantidad, oi.precio_unitario,
            (oi.cantidad * oi.precio_unitario) AS subtotal
       FROM orden_insumos oi
       JOIN insumos i ON i.id = oi.insumo_id
      WHERE oi.orden_id = ?`,
    [factura.orden_id]
  );
  res.json({ ...factura, equipos, insumos });
}));

// Alta: el importe no se escribe a mano, sale de la orden.
router.post('/', ruta(async (req, res) => {
  const { orden_id, fecha, condicion_iva = 'consumidor_final' } = req.body;
  if (!orden_id) fallar(400, 'Falta la orden de servicio a facturar');
  if (!fecha) fallar(400, 'Falta la fecha de emision');

  const [[orden]] = await db.query(
    'SELECT id, cliente_id, total FROM ordenes_servicio WHERE id = ?', [orden_id]
  );
  if (!orden) fallar(404, 'Orden de servicio no encontrada');

  const neto = Number(orden.total);
  const iva = Math.round(neto * ALICUOTA) / 100;
  const total = neto + iva;

  try {
    const [r] = await db.query(
      `INSERT INTO facturas (numero, orden_id, cliente_id, fecha, condicion_iva, neto, alicuota_iva, iva, total)
       VALUES ('', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orden_id, orden.cliente_id, fecha, condicion_iva, neto, ALICUOTA, iva, total]
    );
    const numero = `FC-${String(r.insertId).padStart(6, '0')}`;
    await db.query('UPDATE facturas SET numero = ? WHERE id = ?', [numero, r.insertId]);
    res.status(201).json({ id: r.insertId, numero, neto, iva, total });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') fallar(409, 'Esa orden de servicio ya fue facturada');
    throw e;
  }
}));

// Una factura emitida no se borra: se anula y queda en el historial.
router.post('/:id/anular', ruta(async (req, res) => {
  const [r] = await db.query(
    'UPDATE facturas SET anulada = 1 WHERE id = ? AND anulada = 0', [req.params.id]
  );
  if (!r.affectedRows) fallar(409, 'La factura no existe o ya estaba anulada');
  res.json({ ok: true });
}));

export default router;
