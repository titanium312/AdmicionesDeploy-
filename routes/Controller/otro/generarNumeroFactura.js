const axios = require('axios');
const { obtenerIds } = require('../Base/ids');

async function getIdFacturaPorAdmision(req, res) {
  try {
    const { institucionId, numeroAdmision } = req.query;

    if (!institucionId || !numeroAdmision) {
      return res.status(400).json({
        ok: false,
        error: 'institucionId y numeroAdmision son requeridos',
      });
    }

    // 1️⃣ Obtener la factura
    const info = await obtenerIds({ institucionId, clave: numeroAdmision });
    const idFactura = info?.facturasDetalle?.[0]?.id_factura ?? null;

    if (!idFactura) {
      return res.status(404).json({
        ok: false,
        error: 'No se encontró factura para el número de admisión dado',
      });
    }

    // 2️⃣ Ejecutar la petición cURL remota
    const url = `https://server-03.saludplus.co/facturasAdministar/Numerarfacturas?idFacturas=${idFactura}&numeroFactura=`;

    const headers = {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      data: '+PvTvwUmZ3+gAG2Ugdtbd60KDp85DDaXPPFG1fsbc0w=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
      Cookie: 'ASP.NET_SessionId=ab123xyz45; ARRAffinity=eaf4e0b5b2abcdef123456',
    };

    console.log(`🔹 Numerando factura ID ${idFactura}...`);

    const response = await axios.get(url, { headers });

    console.log('✅ Numeración completada en servidor remoto');

    // 3️⃣ Responder al cliente local
    return res.json({
      ok: true,
      id_factura: idFactura,
      resultado_remoto: response.data,
    });

  } catch (err) {
    console.error('❌ Error en getIdFacturaPorAdmision:', err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Error interno del servidor',
    });
  }
}

module.exports = { getIdFacturaPorAdmision };
