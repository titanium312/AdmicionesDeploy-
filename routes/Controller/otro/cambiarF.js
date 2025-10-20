// ./controllers/facturas.controller.js
const axios = require('axios');
const { obtenerIds } = require('../Base/ids'); // ⬅️ usa lo que sí exporta Base/ids

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

    // 1️⃣ Resolver admisión y obtener facturas asociadas
    // obtenerIds({ institucionId, clave }) devuelve { facturasDetalle, ... }
    const info = await obtenerIds({ institucionId, clave: numeroAdmision });

    const idFacturas = Array.from(
      new Set(
        (info?.facturasDetalle || [])
          .map(f => f?.id_factura)
          .filter(Boolean)
          .map(x => String(x).trim())
      )
    );

    if (idFacturas.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No se encontraron facturas asociadas al número de admisión',
      });
    }

    // 2️⃣ Llamar al endpoint remoto para cambiar fecha de emisión
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
          // Origin/Referer suelen no ser necesarios en servidor; quítalos si molestan
          Origin: 'https://server-03.saludplus.co',
          Referer: 'https://server-03.saludplus.co/instituciones/',
          'User-Agent': 'Node.js Script',
        },
        timeout: 15000,
      }
    );

    // 3️⃣ Devolver respuesta unificada
    return res.json({
      ok: true,
      mensaje: response.data?.mensajeRetorno || 'Facturas actualizadas correctamente',
      resultado: response.data || null,
      facturasProcesadas: idFacturas.length,
      idFacturas,
    });
  } catch (error) {
    console.error('[facturas.controller] Error:', error?.response?.data || error.message);
    return res.status(500).json({
      ok: false,
      error:
        error?.response?.data?.mensaje ||
        error?.message ||
        'Error al cambiar la fecha de emisión',
    });
  }
}

module.exports = { cambiarFechaEmision };
