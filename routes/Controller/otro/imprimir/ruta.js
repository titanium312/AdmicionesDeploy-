const express = require('express');
const Comando = require('./controllers/Comando');
const Recibe = require('./controllers/Recibe');

const router = express.Router();

// 👉 Nueva ruta para probar /Imprimir
router.get('/Imprimir', (req, res) => {
  res.json({ ok: true, mensaje: 'Ruta /Imprimir funcionando ✅' });
});

// Rutas existentes
router.post('/comando', Comando.mandarComando);
router.get('/seguimiento/:userId', Comando.seguimiento);
router.get('/recibe/:userId', Recibe.verComandoPendiente);
router.post('/recibe/:userId/respuesta', Recibe.responderComando);

// 👉 Ruta raíz opcional
router.post('/', (req, res) => {
  res.json({ ok: true, mensaje: 'Ruta raíz de /imprimir funcionando ✅' });
});

module.exports = router;
