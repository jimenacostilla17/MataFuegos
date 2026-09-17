import express from 'express';
import clientes from './rutas/clientes.js';
import direcciones from './rutas/direcciones.js';
import matafuegos from './rutas/matafuegos.js';
import mantenimientos from './rutas/mantenimientos.js';
import alertas from './rutas/alertas.js';
import insumos from './rutas/insumos.js';
import ordenes from './rutas/ordenes.js';
import facturas from './rutas/facturas.js';

const app = express();
app.use(express.json());

app.use('/api/clientes', clientes);
app.use('/api/direcciones', direcciones);
app.use('/api/matafuegos', matafuegos);
app.use('/api/mantenimientos', mantenimientos);
app.use('/api/alertas', alertas);
app.use('/api/insumos', insumos);
app.use('/api/ordenes', ordenes);
app.use('/api/facturas', facturas);

// Manejo unico de errores: cualquier throw en una ruta termina aca.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.mensaje || 'Error interno del servidor' });
});

const puerto = process.env.PORT || 3001;
app.listen(puerto, () => console.log(`Backend escuchando en http://localhost:${puerto}`));
