-- Datos de demostracion del sistema de matafuegos.
--
-- Ejecutar DESPUES de db/esquema.sql. Reemplaza todo el contenido de las
-- tablas por un juego de datos armado para que se vean las seis funciones.
--
-- Las fechas son RELATIVAS al dia en que se ejecuta el script (CURDATE()),
-- asi que el panel de vencimientos siempre muestra equipos vencidos y por
-- vencer, sin importar cuando se corra.

USE matafuegos;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE orden_insumos;
TRUNCATE TABLE orden_matafuegos;
TRUNCATE TABLE ordenes_servicio;
TRUNCATE TABLE mantenimientos;
TRUNCATE TABLE matafuegos;
TRUNCATE TABLE direcciones;
TRUNCATE TABLE clientes;
TRUNCATE TABLE insumos;
SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================================
-- CLIENTES — los cuatro tipos que pide el requerimiento
-- El ultimo esta dado de baja para mostrar la baja logica.
-- ===============================================================
INSERT INTO clientes (id, tipo, razon_social, documento, telefono, email, activo) VALUES
 (1,  'consorcio',  'Consorcio Edificio Belgrano',      '30-71234567-9', '381-4225588', 'administracion@edificiobelgrano.com.ar', 1),
 (2,  'consorcio',  'Consorcio Torres del Parque',      '30-71888222-4', '381-4337711', 'consorcio@torresdelparque.com.ar',      1),
 (3,  'comercio',   'Supermercado La Estrella SRL',     '30-69558741-2', '381-4456699', 'compras@laestrella.com.ar',            1),
 (4,  'comercio',   'Farmacia San Martin',              '27-14785236-3', '381-4271144', 'farmaciasanmartin@gmail.com',          1),
 (5,  'industria',  'Metalurgica del Norte SA',         '30-99887766-1', '381-4901200', 'seguridad@metalnorte.com.ar',          1),
 (6,  'industria',  'Frigorifico Los Alamos SA',        '30-65478912-7', '381-4885544', 'higieneyseguridad@losalamos.com.ar',   1),
 (7,  'particular', 'Juan Carlos Perez',                '20-16548793-5', '381-155874123', 'jcperez@gmail.com',                  1),
 (8,  'particular', 'Maria Elena Gomez',                '27-20458796-8', '381-155963247', 'megomez@hotmail.com',                1),
 (9,  'comercio',   'Hotel Plaza Tucuman',              '30-70125874-6', '381-4302020', 'mantenimiento@hotelplaza.com.ar',      1),
 (10, 'consorcio',  'Consorcio Rivadavia 850',          '30-71002255-8', '381-4224488', NULL,                                   0);

-- ===============================================================
-- DIRECCIONES — varias sucursales por cliente
-- ===============================================================
INSERT INTO direcciones (id, cliente_id, etiqueta, calle, numero, piso_depto, localidad, provincia, codigo_postal) VALUES
 (1,  1, 'Torre A',              'Av. Belgrano',      '1250', NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (2,  1, 'Torre B',              'Av. Belgrano',      '1270', NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (3,  1, 'Cochera y SUM',        'Lamadrid',          '455',  'Subsuelo',   'San Miguel de Tucuman', 'Tucuman', '4000'),
 (4,  2, 'Torre Norte',          'Av. Mate de Luna',  '2890', NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (5,  2, 'Torre Sur',            'Av. Mate de Luna',  '2910', NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (6,  3, 'Casa central',         'Av. Sarmiento',     '780',  NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (7,  3, 'Sucursal Norte',       'Av. Peron',         '1540', NULL,         'Yerba Buena',           'Tucuman', '4107'),
 (8,  4, 'Local',                'San Martin',        '615',  NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (9,  5, 'Planta 1 - Produccion','Ruta 302 km 8',     NULL,   NULL,         'Cevil Pozo',            'Tucuman', '4107'),
 (10, 5, 'Planta 2 - Deposito',  'Ruta 302 km 9',     NULL,   NULL,         'Cevil Pozo',            'Tucuman', '4107'),
 (11, 6, 'Planta frigorifica',   'Ruta 9 km 1294',    NULL,   NULL,         'Banda del Rio Sali',    'Tucuman', '4109'),
 (12, 7, 'Domicilio particular', 'Corrientes',        '1823', '3 B',        'San Miguel de Tucuman', 'Tucuman', '4000'),
 (13, 8, 'Domicilio particular', 'Junin',             '940',  NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (14, 9, 'Hotel',                'San Martin',        '450',  NULL,         'San Miguel de Tucuman', 'Tucuman', '4000'),
 (15, 10,'Edificio',             'Rivadavia',         '850',  NULL,         'San Miguel de Tucuman', 'Tucuman', '4000');

-- ===============================================================
-- MATAFUEGOS — 30 equipos con distintos agentes, capacidades y estados
-- ===============================================================
INSERT INTO matafuegos (id, direccion_id, numero_tarjeta, tipo_agente, capacidad, unidad_capacidad, fecha_fabricacion, estado) VALUES
 (1,  1,  'TJ-00101', 'Polvo ABC',   5.00, 'kg', '2019-04-12', 'en_taller'),
 (2,  1,  'TJ-00102', 'Polvo ABC',   5.00, 'kg', '2019-04-12', 'en_cliente'),
 (3,  1,  'TJ-00103', 'CO2',         3.50, 'kg', '2020-08-03', 'en_cliente'),
 (4,  2,  'TJ-00104', 'Polvo ABC',   5.00, 'kg', '2018-11-20', 'en_cliente'),
 (5,  2,  'TJ-00105', 'Polvo ABC',  10.00, 'kg', '2021-02-15', 'en_cliente'),
 (6,  3,  'TJ-00106', 'CO2',         5.00, 'kg', '2020-06-30', 'en_cliente'),
 (7,  3,  'TJ-00107', 'Agua',        9.00, 'l',  '2023-09-01', 'en_cliente'),
 (8,  4,  'TJ-00201', 'Polvo ABC',   5.00, 'kg', '2019-07-22', 'en_cliente'),
 (9,  4,  'TJ-00202', 'CO2',         3.50, 'kg', '2021-05-10', 'en_cliente'),
 (10, 5,  'TJ-00203', 'Polvo ABC',   5.00, 'kg', '2020-03-18', 'en_cliente'),
 (11, 5,  'TJ-00204', 'Espuma AFFF', 9.00, 'l',  '2022-10-05', 'en_cliente'),
 (12, 6,  'TJ-00301', 'Polvo ABC',  10.00, 'kg', '2018-05-14', 'en_cliente'),
 (13, 6,  'TJ-00302', 'Polvo ABC',  10.00, 'kg', '2018-05-14', 'en_cliente'),
 (14, 6,  'TJ-00303', 'CO2',         5.00, 'kg', '2021-09-27', 'en_cliente'),
 (15, 7,  'TJ-00304', 'Polvo ABC',   5.00, 'kg', '2020-01-09', 'en_cliente'),
 (16, 7,  'TJ-00305', 'CO2',         3.50, 'kg', '2022-04-19', 'en_cliente'),
 (17, 8,  'TJ-00401', 'Polvo ABC',   2.50, 'kg', '2023-03-11', 'en_cliente'),
 (18, 9,  'TJ-00501', 'Polvo ABC',  25.00, 'kg', '2017-08-25', 'en_taller'),
 (19, 9,  'TJ-00502', 'Polvo ABC',  25.00, 'kg', '2017-08-25', 'en_taller'),
 (20, 9,  'TJ-00503', 'CO2',        10.00, 'kg', '2019-12-02', 'en_cliente'),
 (21, 9,  'TJ-00504', 'Espuma AFFF', 9.00, 'l',  '2022-07-14', 'en_cliente'),
 (22, 10, 'TJ-00505', 'Polvo ABC',  10.00, 'kg', '2020-11-30', 'en_cliente'),
 (23, 10, 'TJ-00506', 'Polvo BC',    5.00, 'kg', '2021-06-08', 'en_cliente'),
 (24, 11, 'TJ-00601', 'CO2',        10.00, 'kg', '2016-03-17', 'en_cliente'),
 (25, 11, 'TJ-00602', 'Polvo ABC',  10.00, 'kg', '2019-10-21', 'en_cliente'),
 (26, 12, 'TJ-00701', 'Polvo ABC',   1.00, 'kg', '2018-02-06', 'en_cliente'),
 (27, 13, 'TJ-00801', 'Polvo ABC',   1.00, 'kg', '2023-11-15', 'en_cliente'),
 (28, 14, 'TJ-00901', 'Polvo ABC',   5.00, 'kg', '2020-09-04', 'en_cliente'),
 (29, 14, 'TJ-00902', 'Agua',        9.00, 'l',  '2022-12-12', 'en_cliente'),
 (30, 15, 'TJ-01001', 'Polvo ABC',   5.00, 'kg', '2017-05-23', 'baja');

-- ===============================================================
-- MANTENIMIENTOS
-- La fecha_vencimiento se carga igual a la fecha y se corrige mas
-- abajo con la misma regla que aplica el sistema (recarga +1 anio,
-- prueba hidraulica +5 anios).
-- ===============================================================
INSERT INTO mantenimientos (matafuego_id, tipo, fecha, fecha_vencimiento, observaciones) VALUES
 -- --- VENCIDOS: aparecen en rojo en el panel ---
 (1,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 14 MONTH), CURDATE(), 'Carga completa'),
 (1,  'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 26 MONTH), CURDATE(), 'Aprobada'),
 (4,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 13 MONTH), CURDATE(), NULL),
 (12, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 375 DAY),  CURDATE(), 'Se reemplazo el precinto'),
 -- Este muestra que manda el vencimiento mas cercano: la recarga esta al
 -- dia pero la prueba hidraulica de 5 anios ya vencio.
 (24, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 3 MONTH),  CURDATE(), 'Carga completa'),
 (24, 'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 62 MONTH), CURDATE(), 'Aprobada en su momento'),

 -- --- POR VENCER DENTRO DE 30 DIAS: aparecen en amarillo ---
 (2,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 360 DAY),  CURDATE(), NULL),
 (8,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 350 DAY),  CURDATE(), 'Carga completa'),
 (18, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 340 DAY),  CURDATE(), 'Equipo de 25 kg sobre ruedas'),
 (15, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 336 DAY),  CURDATE(), NULL),
 (26, 'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 1806 DAY), CURDATE(), 'Aprobada'),
 (26, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 2 MONTH),  CURDATE(), NULL),

 -- --- ENTRE 30 Y 90 DIAS: se ven al cambiar el filtro a 60 o 90 ---
 (5,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 320 DAY),  CURDATE(), NULL),
 (10, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 300 DAY),  CURDATE(), 'Carga completa'),
 (19, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 285 DAY),  CURDATE(), NULL),
 (28, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 295 DAY),  CURDATE(), NULL),

 -- --- AL DIA: no aparecen en el panel ---
 (3,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 2 MONTH),  CURDATE(), 'Carga completa'),
 (3,  'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 14 MONTH), CURDATE(), 'Aprobada'),
 (6,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 4 MONTH),  CURDATE(), NULL),
 (9,  'recarga',           DATE_SUB(CURDATE(), INTERVAL 1 MONTH),  CURDATE(), NULL),
 (13, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 20 DAY),   CURDATE(), 'Carga completa'),
 (13, 'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 20 DAY),   CURDATE(), 'Aprobada'),
 (16, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 5 MONTH),  CURDATE(), NULL),
 (20, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 3 MONTH),  CURDATE(), NULL),
 (20, 'prueba_hidraulica', DATE_SUB(CURDATE(), INTERVAL 8 MONTH),  CURDATE(), 'Aprobada'),
 (22, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 6 MONTH),  CURDATE(), NULL),
 (25, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 45 DAY),   CURDATE(), 'Carga completa'),
 (29, 'recarga',           DATE_SUB(CURDATE(), INTERVAL 70 DAY),   CURDATE(), NULL);

-- Los equipos 7, 11, 14, 17, 21, 23, 27 y 30 quedan sin mantenimientos:
-- son altas recientes y por eso no tienen proximo vencimiento.

-- Regla de vencimiento, la misma que aplica el sistema al registrar.
UPDATE mantenimientos
   SET fecha_vencimiento = DATE_ADD(fecha, INTERVAL (CASE tipo WHEN 'recarga' THEN 1 ELSE 5 END) YEAR);

-- ===============================================================
-- INSUMOS DEL TALLER — tres quedan en o por debajo del minimo
-- ===============================================================
INSERT INTO insumos (id, nombre, unidad_medida, stock, stock_minimo, precio_unitario) VALUES
 (1, 'Polvo quimico ABC',         'kg',     45.00,  20.00,  3500.00),
 (2, 'Polvo quimico BC',          'kg',     12.00,  15.00,  3200.00),
 (3, 'Dioxido de carbono (CO2)',  'kg',     30.00,  10.00,  5800.00),
 (4, 'Manometro 0-20 bar',        'unidad',  8.00,  10.00, 12000.00),
 (5, 'Manguera con difusor',      'unidad', 25.00,   8.00,  9500.00),
 (6, 'Valvula completa',          'unidad',  6.00,   6.00, 28000.00),
 (7, 'Precinto de seguridad',     'unidad', 340.00, 100.00,  250.00),
 (8, 'Oblea de control anual',    'unidad', 180.00,  50.00,  900.00);

-- ===============================================================
-- ORDENES DE SERVICIO / REMITOS
-- Una entregada y dos pendientes. El stock de arriba ya contempla
-- lo que estas ordenes consumieron.
-- ===============================================================
INSERT INTO ordenes_servicio (id, numero, cliente_id, direccion_id, fecha, estado, total, observaciones) VALUES
 (1, 'OS-000001', 3, 6, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'entregada', 0, 'Equipos cargados y controlados. Se entregan en casa central.'),
 (2, 'OS-000002', 5, 9, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'pendiente', 0, 'Dos equipos de 25 kg en taller, pendiente de retiro.'),
 (3, 'OS-000003', 1, 1, CURDATE(),                            'pendiente', 0, 'Retirado para recarga anual.');

INSERT INTO orden_matafuegos (orden_id, matafuego_id, mantenimiento_id) VALUES
 (1, 12, NULL), (1, 13, NULL),
 (2, 18, NULL), (2, 19, NULL),
 (3, 1,  NULL);

-- Se asocia a cada equipo de la orden su ultimo mantenimiento registrado.
UPDATE orden_matafuegos om
   SET mantenimiento_id = (SELECT MAX(t.id) FROM mantenimientos t WHERE t.matafuego_id = om.matafuego_id);

INSERT INTO orden_insumos (orden_id, insumo_id, cantidad, precio_unitario) VALUES
 (1, 1, 20.00,  3500.00),
 (1, 7,  2.00,   250.00),
 (1, 8,  2.00,   900.00),
 (2, 1, 50.00,  3500.00),
 (2, 4,  2.00, 12000.00),
 (2, 5,  2.00,  9500.00),
 (3, 1,  5.00,  3500.00),
 (3, 7,  1.00,   250.00);

-- El total de cada orden sale de sus insumos, no se carga a mano.
UPDATE ordenes_servicio o
   SET total = (SELECT COALESCE(SUM(oi.cantidad * oi.precio_unitario), 0)
                  FROM orden_insumos oi WHERE oi.orden_id = o.id);

SELECT 'Datos de demostracion cargados' AS resultado;
