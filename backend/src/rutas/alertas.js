import { Router } from 'express';
import { db } from '../db.js';
import { ruta, SQL_PROXIMO_VENCIMIENTO } from '../ayudas.js';

const router = Router();

// Panel de vencimientos: equipos que vencen dentro de los proximos N dias
// (30 por defecto) mas los que ya estan vencidos, para coordinar el retiro.
router.get('/', ruta(async (req, res) => {
  const dias = Number(req.query.dias) || 30;
  const [filas] = await db.query(
    `SELECT * FROM (
       ${`SELECT m.id, m.numero_tarjeta, m.tipo_agente, m.capacidad, m.unidad_capacidad, m.estado,
                 ${SQL_PROXIMO_VENCIMIENTO} AS proximo_vencimiento,
                 d.id AS direccion_id, d.etiqueta, d.calle, d.numero, d.localidad,
                 c.id AS cliente_id, c.razon_social, c.telefono, c.email
            FROM matafuegos m
            JOIN direcciones d ON d.id = m.direccion_id
            JOIN clientes c    ON c.id = d.cliente_id
           WHERE m.estado <> 'baja'`}
     ) AS q
     WHERE q.proximo_vencimiento IS NOT NULL
       AND q.proximo_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
     ORDER BY q.proximo_vencimiento`,
    [dias]
  );
  const hoy = new Date().toISOString().slice(0, 10);
  res.json(filas.map((f) => ({ ...f, vencido: f.proximo_vencimiento < hoy })));
}));

export default router;
