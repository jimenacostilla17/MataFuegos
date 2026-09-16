-- Sistema de gestion de matafuegos
-- Motor: MySQL 8.0
-- Ejecutar completo en MySQL Workbench (rayo) o por consola.

DROP DATABASE IF EXISTS matafuegos;
CREATE DATABASE matafuegos CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE matafuegos;

-- ---------------------------------------------------------------
-- Clientes y sus direcciones / sucursales
-- ---------------------------------------------------------------
CREATE TABLE clientes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo          ENUM('particular','comercio','consorcio','industria') NOT NULL,
  razon_social  VARCHAR(150) NOT NULL,
  documento     VARCHAR(20)  NULL COMMENT 'CUIT o DNI',
  telefono      VARCHAR(40)  NULL,
  email         VARCHAR(120) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'baja logica',
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE direcciones (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id    INT UNSIGNED NOT NULL,
  etiqueta      VARCHAR(100) NOT NULL COMMENT 'Casa central, Sucursal Centro, etc.',
  calle         VARCHAR(150) NOT NULL,
  numero        VARCHAR(20)  NULL,
  piso_depto    VARCHAR(30)  NULL,
  localidad     VARCHAR(100) NOT NULL,
  provincia     VARCHAR(100) NULL,
  codigo_postal VARCHAR(20)  NULL,
  CONSTRAINT fk_direcciones_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Ficha individual de cada matafuego
-- ---------------------------------------------------------------
CREATE TABLE matafuegos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  direccion_id      INT UNSIGNED NOT NULL COMMENT 'donde esta instalado',
  numero_tarjeta    VARCHAR(50)  NOT NULL UNIQUE,
  tipo_agente       ENUM('Agua','Polvo ABC','Polvo BC','CO2','Espuma AFFF','Halotron') NOT NULL,
  capacidad         DECIMAL(6,2) NOT NULL,
  unidad_capacidad  ENUM('kg','l') NOT NULL,
  fecha_fabricacion DATE NOT NULL,
  estado            ENUM('en_cliente','en_taller','baja') NOT NULL DEFAULT 'en_cliente',
  CONSTRAINT fk_matafuegos_direccion
    FOREIGN KEY (direccion_id) REFERENCES direcciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Historial de mantenimientos: recargas y pruebas hidraulicas.
-- fecha_vencimiento se calcula al registrar (recarga +1 anio,
-- prueba hidraulica +5 anios) y no se edita a mano.
-- ---------------------------------------------------------------
CREATE TABLE mantenimientos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  matafuego_id      INT UNSIGNED NOT NULL,
  tipo              ENUM('recarga','prueba_hidraulica') NOT NULL,
  fecha             DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  observaciones     TEXT NULL,
  CONSTRAINT fk_mantenimientos_matafuego
    FOREIGN KEY (matafuego_id) REFERENCES matafuegos(id) ON DELETE CASCADE,
  INDEX idx_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Insumos del taller
-- ---------------------------------------------------------------
CREATE TABLE insumos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  unidad_medida   VARCHAR(20)  NOT NULL COMMENT 'kg, unidad, metro',
  stock           DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo    DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Orden de servicio / remito de entrega
-- ---------------------------------------------------------------
CREATE TABLE ordenes_servicio (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero        VARCHAR(20) NOT NULL UNIQUE,
  cliente_id    INT UNSIGNED NOT NULL,
  direccion_id  INT UNSIGNED NOT NULL,
  fecha         DATE NOT NULL,
  estado        ENUM('pendiente','entregada') NOT NULL DEFAULT 'pendiente',
  total         DECIMAL(10,2) NOT NULL DEFAULT 0,
  observaciones TEXT NULL,
  CONSTRAINT fk_ordenes_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_ordenes_direccion
    FOREIGN KEY (direccion_id) REFERENCES direcciones(id)
) ENGINE=InnoDB;

-- Equipos incluidos en la orden ("cargado y controlado")
CREATE TABLE orden_matafuegos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id         INT UNSIGNED NOT NULL,
  matafuego_id     INT UNSIGNED NOT NULL,
  mantenimiento_id INT UNSIGNED NULL COMMENT 'trabajo realizado en este equipo',
  CONSTRAINT fk_om_orden        FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  CONSTRAINT fk_om_matafuego    FOREIGN KEY (matafuego_id) REFERENCES matafuegos(id),
  CONSTRAINT fk_om_mantenimiento FOREIGN KEY (mantenimiento_id) REFERENCES mantenimientos(id)
) ENGINE=InnoDB;

-- Insumos consumidos: descuentan stock al confirmar la orden
CREATE TABLE orden_insumos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id        INT UNSIGNED NOT NULL,
  insumo_id       INT UNSIGNED NOT NULL,
  cantidad        DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_oi_orden  FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_insumo FOREIGN KEY (insumo_id) REFERENCES insumos(id)
) ENGINE=InnoDB;
