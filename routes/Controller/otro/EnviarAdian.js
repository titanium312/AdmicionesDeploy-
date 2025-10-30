const axios = require('axios');
const { obtenerIds } = require('../Base/ids');

async function EnviarADian(req, res) {
  try {
    const { institucionId, numeroAdmision } = req.query;
    
    // Validaciones (solo institucionId y numeroAdmision)
    if (!institucionId || !numeroAdmision) {
      return res.status(400).json({ ok: false, error: 'institucionId y numeroAdmision son requeridos' });
    }

    // Sanitiza inputs (evita inyecciones)
    const safeInstitucionId = parseInt(institucionId, 10);
    const safeNumeroAdmision = numeroAdmision.toString().trim();
    if (isNaN(safeInstitucionId) || !safeNumeroAdmision) {
      return res.status(400).json({ ok: false, error: 'Parámetros inválidos' });
    }

    // Obtener IDs
    const info = await obtenerIds({ institucionId: safeInstitucionId, clave: safeNumeroAdmision });
    const idFactura = info?.facturasDetalle?.[0]?.id_factura ?? null;

    if (!idFactura) {
      return res.status(404).json({ ok: false, error: 'No se encontró factura para el número de admisión dado' });
    }

    // Token hardcoded (del ejemplo en curl; úsalo para testing. En prod, genera dinámicamente)
    const token = 'L2opRU12cOZx4OUQlzsjmCRzFRro3llfGUtzSyyPkLg=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';

    // Petición al endpoint externo con token en header 'data'
    const response = await axios.post(
      'https://server-03.saludplus.co/facturasAdministar/facturacionElectronica',
      {
        idFacturas: idFactura.toString(),  // Asegura string como en frontend
        idNotasCredito: '',
        idNotasDebito: ''
      },
      {
        headers: {
          'accept': 'application/json, text/javascript, */*; q=0.01',
          'content-type': 'application/json; charset=UTF-8',
          'x-requested-with': 'XMLHttpRequest',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'origin': 'https://server-03.saludplus.co',
          'referer': 'https://server-03.saludplus.co/instituciones/?origen=1&theme=false',
          'data': token  // Token incluido directamente
        },
        timeout: 30000  // 30s timeout para evitar hangs
      }
    );

    const resultado = response.data;

    // Manejo inteligente de respuesta (como en frontend)
    if (resultado.valorRetorno === -1) {
      console.warn('Advertencia en facturación electrónica:', resultado.mensajeRetorno || 'Error desconocido');
      return res.status(400).json({ 
        ok: false, 
        error: 'Error en facturación electrónica', 
        detalle: resultado.mensajeRetorno || 'Sin detalles del servidor' 
      });
    }

    // Éxito: retorna datos limpios
    return res.json({ 
      ok: true, 
      data: {
        valorRetorno: resultado.valorRetorno,
        mensajeRetorno: resultado.mensajeRetorno,
        // Agrega más si el externo retorna extras
      } 
    });

  } catch (error) {
    console.error('Error al enviar factura electrónica:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Maneja errores específicos de axios
    if (error.response) {
      // Error del servidor externo (e.g., 4xx/5xx)
      return res.status(error.response.status).json({ 
        ok: false, 
        error: 'Error del servicio externo', 
        detalle: error.response.data 
      });
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ ok: false, error: 'Timeout en solicitud' });
    }

    // Error genérico
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno al enviar factura electrónica', 
      detalle: error.message 
    });
  }
}

module.exports = { EnviarADian };