// ./controllers/facturas.controller.js
const axios = require('axios');
const querystring = require('querystring'); // para x-www-form-urlencoded

// POST /facturas/cambiar-fecha-emision
// body esperado: { idFactura: "3607138", fechaEmision: "11/11/2025" }
async function cambiarFechaEmision(req, res) {
  try {
    const { idFactura, fechaEmision } = req.body;

    if (!idFactura || !fechaEmision) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Faltan parámetros: idFactura y/o fechaEmision',
      });
    }

    const uri = 'https://balance.saludplus.co/facturasAdministar/cambiarfechaEmisionAccion';

    // El endpoint espera application/x-www-form-urlencoded
    const body = querystring.stringify({
      idFacturas: idFactura,   // nombre EXACTO del parámetro en el endpoint VB
      fechaEmision: fechaEmision,
    });

    // Encabezados similares a los de PowerShell
    // IMPORTANTE: ajusta el origen de las cookies a tu caso real:
    // - o las lees de req.headers.cookie
    // - o usas una cookie fija en una variable de entorno
    const headers = {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Cookie: req.headers.cookie || process.env.SALUDPLUS_COOKIE || '',
    };

    const { data } = await axios.post(uri, body, { headers });

    // data debería contener algo como:
    // { mensajeRetorno: 'las facturas se modificaron  correctamente', valorretorno: 1 }
    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error('Error al cambiar fecha de emisión:', error.message);

    const status = error.response?.status || 500;
    const serverBody = error.response?.data;

    return res.status(status).json({
      ok: false,
      mensaje: 'Error al llamar al servicio cambiarfechaEmisionAccion',
      error: error.message,
      serverBody, // opcional, por si quieres ver la respuesta cruda del servidor
    });
  }
}

module.exports = { cambiarFechaEmision };
