// ./controllers/facturas.controller.js
const axios = require('axios');
const { obtenerResumenFacturaPaciente } = require('../Base/ids');

/**
 * Cambia la fecha de emisión de las facturas asociadas a un número de admisión.
 *
 * Body esperado:
 * {
 *   institucionId: 20,
 *   numeroAdmision: 142811,
 *   fechaEmision: "10/18/2025"
 * }
 */
async function cambiarFechaEmision(req, res) {
  try {
    const { institucionId, numeroAdmision, fechaEmision } = req.body;

    if (!institucionId || !numeroAdmision || !fechaEmision) {
      return res.status(400).json({
        ok: false,
        error: 'institucionId, numeroAdmision y fechaEmision son requeridos',
        ejemplo: {
          institucionId: 20,
          numeroAdmision: 142811,
          fechaEmision: '10/18/2025',
        },
      });
    }

    // 1️⃣ Buscar facturas asociadas al número de admisión
    const facturas = await obtenerResumenFacturaPaciente({
      institucionId,
      clave: numeroAdmision, // usamos admisión directamente
    });

    if (!facturas || facturas.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No se encontraron facturas asociadas al número de admisión',
      });
    }

    // 2️⃣ Obtener IDs de las facturas
    const idFacturas = facturas.map(f => f.id_factura);

    // 3️⃣ Llamar al endpoint remoto para cambiar fecha de emisión
    const response = await axios.post(
      'https://server-03.saludplus.co/facturasAdministar/cambiarfechaEmisionAccion',
      {
        idFacturas: idFacturas.join(','), // API espera string con comas
        fechaEmision,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          Origin: 'https://server-03.saludplus.co',
          Referer: 'https://server-03.saludplus.co/instituciones/',
          'User-Agent': 'Node.js Script',
        },
      }
    );

    // 4️⃣ Devolver respuesta unificada
    res.json({
      ok: true,
      mensaje: response.data?.mensajeRetorno || 'Facturas actualizadas correctamente',
      resultado: response.data || null,
      facturasProcesadas: idFacturas.length,
      idFacturas,
    });
  } catch (error) {
    console.error('[facturas.controller] Error:', error.message);
    res.status(500).json({
      ok: false,
      error: error.message || 'Error al cambiar la fecha de emisión',
    });
  }
}

module.exports = { cambiarFechaEmision };
