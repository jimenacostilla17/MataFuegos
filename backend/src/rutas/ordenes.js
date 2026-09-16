import { Router } from 'express';
import { db } from '../db.js';
import { ruta, fallar } from '../ayudas.js';

const router = Router();

router.get('/', ruta(async (req, res) => {
  const [filas] = await db.query(
    `SELECT o.*, c.razon_social, d.etiqueta,
            (SELECT COUNT(*) FROM orden_matafuegos om WHERE om.orden_id = o.id) AS cantidad_equipos
       FROM ordenes_servicio o
       JOIN clientes c    ON c.id = o.cliente_id
       JOIN direcciones d ON d.id = o.direccion_id
       ORDER BY o.fecha DESC, o.id DESC`
  );
  res.json(filas);
}));

// Remito completo: cabecera, equipos entregados e insumos consumidos.
router.get('/:id', ruta(async (req, res) => {
  const [[orden]] = await db.query(
    // d.numero se renombra: si no, la altura de la calle pisa el numero de orden.
    `SELECT o.*, c.razon_social, c.documento, c.telefono, c.tipo,
            d.etiqueta, d.calle, d.numero AS direccion_numero, d.piso_depto,
            d.localidad, d.provincia
       FROM ordenes_servicio o
       JOIN clientes c    ON c.id = o.cliente_id
       JOIN direcciones d ON d.id = o.direccion_id
      WHERE o.id = ?`,
    [req.params.id]
  );
  if (!orden) fallar(404, 'Orden no encontrada');

  const [equipos] = await db.query(
    `SELECT om.id, m.numero_tarjeta, m.tipo_agente, m.capacidad, m.unidad_capacidad,
            t.tipo AS trabajo, t.fecha AS fecha_trabajo, t.fecha_vencimiento
       FROM orden_matafuegos om
       JOIN matafuegos m ON m.id = om.matafuego_id
       LEFT JOIN mantenimientos t ON t.id = om.mantenimiento_id
      WHERE om.orden_id = ?`,
    [req.params.id]
  );
  const [insumos] = await db.query(
    `SELECT oi.id, i.nombre, i.unidad_medida, oi.cantidad, oi.precio_unitario,
            (oi.cantidad * oi.precio_unitario) AS subtotal
       FROM orden_insumos oi
       JOIN insumos i ON i.id = oi.insumo_id
      WHERE oi.orden_id = ?`,
    [req.params.id]
  );
  res.json({ ...orden, equipos, insumos });
}));

// Alta de la orden. Todo en una transaccion: si falla el descuento de stock
// no queda ni la orden ni el consumo a medias.
router.post('/', ruta(async (req, res) => {
  const { cliente_id, direccion_id, fecha, observaciones = null, equipos = [], insumos = [] } = req.body;
  if (!cliente_id || !direccion_id) fallar(400, 'Falta el cliente o la direccion');
  if (!fecha) fallar(400, 'Falta la fecha de la orden');
  if (equipos.length === 0) fallar(400, 'La orden debe incluir al menos un equipo');

  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();

    // Precio y stock se leen con FOR UPDATE para que dos ordenes simultaneas
    // no consuman el mismo stock.
    let total = 0;
    const consumos = [];
    for (const linea of insumos) {
      const cantidad = Number(linea.cantidad);
      if (!(cantidad > 0)) fallar(400, 'La cantidad de cada insumo debe ser mayor a cero');
      const [[insumo]] = await conexion.query(
        'SELECT id, nombre, stock, precio_unitario FROM insumos WHERE id = ? FOR UPDATE',
        [linea.insumo_id]
      );
      if (!insumo) fallar(404, 'Insumo no encontrado');
      if (Number(insumo.stock) < cantidad) {
        fallar(409, `Stock insuficiente de ${insumo.nombre}: quedan ${insumo.stock}`);
      }
      total += cantidad * Number(insumo.precio_unitario);
      consumos.push({ ...linea, cantidad, precio_unitario: insumo.precio_unitario });
    }

    const [r] = await conexion.query(
      `INSERT INTO ordenes_servicio (numero, cliente_id, direccion_id, fecha, total, observaciones)
       VALUES ('', ?, ?, ?, ?, ?)`,
      [cliente_id, direccion_id, fecha, total, observaciones]
    );
    const ordenId = r.insertId;
    const numero = `OS-${String(ordenId).padStart(6, '0')}`;
    await conexion.query('UPDATE ordenes_servicio SET numero = ? WHERE id = ?', [numero, ordenId]);

    for (const e of equipos) {
      await conexion.query(
        'INSERT INTO orden_matafuegos (orden_id, matafuego_id, mantenimiento_id) VALUES (?,?,?)',
        [ordenId, e.matafuego_id, e.mantenimiento_id ?? null]
      );
    }
    for (const c of consumos) {
      await conexion.query(
        'INSERT INTO orden_insumos (orden_id, insumo_id, cantidad, precio_unitario) VALUES (?,?,?,?)',
        [ordenId, c.insumo_id, c.cantidad, c.precio_unitario]
      );
      await conexion.query('UPDATE insumos SET stock = stock - ? WHERE id = ?', [c.cantidad, c.insumo_id]);
    }

    await conexion.commit();
    res.status(201).json({ id: ordenId, numero, total });
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }
}));

// Entrega: los equipos vuelven al cliente ya cargados y controlados.
router.post('/:id/entregar', ruta(async (req, res) => {
  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    const [r] = await conexion.query(
      "UPDATE ordenes_servicio SET estado = 'entregada' WHERE id = ? AND estado = 'pendiente'",
      [req.params.id]
    );
    if (!r.affectedRows) fallar(409, 'La orden no existe o ya fue entregada');
    await conexion.query(
      `UPDATE matafuegos SET estado = 'en_cliente'
        WHERE id IN (SELECT matafuego_id FROM orden_matafuegos WHERE orden_id = ?)`,
      [req.params.id]
    );
    await conexion.commit();
    res.json({ ok: true });
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }
}));

// Anular devuelve al stock lo que la orden habia consumido.
router.delete('/:id', ruta(async (req, res) => {
  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    const [consumos] = await conexion.query(
      'SELECT insumo_id, cantidad FROM orden_insumos WHERE orden_id = ?', [req.params.id]
    );
    for (const c of consumos) {
      await conexion.query('UPDATE insumos SET stock = stock + ? WHERE id = ?', [c.cantidad, c.insumo_id]);
    }
    const [r] = await conexion.query('DELETE FROM ordenes_servicio WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) fallar(404, 'Orden no encontrada');
    await conexion.commit();
    res.json({ ok: true });
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }
}));

export default router;
