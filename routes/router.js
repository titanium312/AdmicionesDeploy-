const express = require('express');
const router = express.Router();

// Import controller functions
const { Hs_Anx } = require('./Controller/historias');
const { FacturaElectronica } = require('./Controller/facuraelectronica');
const { obtenerDatosLogin } = require('./Controller/Base/toke');
const { BatAuto } = require('./descargar/descargar');

const { cambiarFechaEmision  } = require('./Controller/otro/cambiarF');
const { DescargarLaboratorio  } = require('./Controller/otro/laboratorio');

// area de gereadorde url pdf
router.get('/Hs_Anx', Hs_Anx);
router.get('/facturaElectronica', FacturaElectronica);
router.post('/DescargarLaboratorio', DescargarLaboratorio);


//area de cosultas
router.post('/descargar', BatAuto);
router.post('/api/istitucion', obtenerDatosLogin);



router.post('/cambiar-fecha', cambiarFechaEmision);

// Route to test server
router.get('/router', (req, res) => {
  res.send('Hola Mundo'); // Send a response to the client
});

module.exports = router;
