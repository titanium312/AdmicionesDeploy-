const axios = require('axios');

/**
 * Busca facturas en el endpoint de SaludPlus.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function buscarFactura(req, res) {
  const sSearch = req.body.sSearch?.trim() ?? '';

  const fechaInicial = '01/01/2024';
  const fechaFinal   = '11/12/2026';
  const idEntidad    = 0;
  const idContrato   = 0;
  const duplicadas   = false;
  const idCuentaCobro = 0;
  const estadoFacturacionElectronica = 0;

  const dataTablesParams = {
    sEcho: 2,
    iColumns: 8,
    sColumns: ',CHECK,NUMERO,FECHA,RESOLUCION,PACIENTE,ENTIDAD,ESTADO',
    iDisplayStart: 0,
    iDisplayLength: 10,
    mDataProp_0: 0,
    mDataProp_1: 1,
    mDataProp_2: 2,
    mDataProp_3: 3,
    mDataProp_4: 4,
    mDataProp_5: 5,
    mDataProp_6: 6,
    mDataProp_7: 7,
    sSearch,
    bRegex: false,
    sSearch_0: '',
    bRegex_0: false,
    bSearchable_0: true,
    sSearch_1: '',
    bRegex_1: false,
    bSearchable_1: false,
    sSearch_2: '',
    bRegex_2: false,
    bSearchable_2: false,
    sSearch_3: '',
    bRegex_3: false,
    bSearchable_3: false,
    sSearch_4: '',
    bRegex_4: false,
    bSearchable_4: false,
    sSearch_5: '',
    bRegex_5: false,
    bSearchable_5: false,
    sSearch_6: '',
    bRegex_6: false,
    bSearchable_6: false,
    sSearch_7: '',
    bRegex_7: false,
    bSearchable_7: false,
    iSortingCols: 1,
    iSortCol_0: 0,
    sSortDir_0: 'asc',
    bSortable_0: true,
    bSortable_1: false,
    bSortable_2: false,
    bSortable_3: false,
    bSortable_4: false,
    bSortable_5: false,
    bSortable_6: false,
    bSortable_7: false,
  };

  const baseUrl = 'https://balance.saludplus.co/facturasAdministar/BuscarListadofacturasDatos';

  const headers = {
    authority: 'balance.saludplus.co',
    accept: 'application/json, text/javascript, */*; q=0.01',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'es-419,es;q=0.9,en;q=0.8',
    'cache-control': 'no-cache',
    'content-type': 'application/x-www-form-urlencoded',
    cookie:
      '_ga=GA1.1.1469375648.1751036181; twk_uuid_61e04197b84f7301d32ada9f=%7B%22uuid%22%3A%221.SwxyeCTT34Mmmd16IGFZEIs4qnqw08vJoA7Zp7CyZZfO4Px2I8wN3tVWTiqG8H9ydM6KgdmIcX6mJor6fjU6jTf8qykLvXKYBIUOklHi0fz5sNXBSz1vD%22%2C%22version%22%3A%223%22%2C%22domain%22%3A%22saludplus.co%22%2C%22ts%22%3A1751040824136%7D; _clck=mhdvxt%5E2%5Eg0y%5E0%5E2004; _ga_581YHK4S33=GS2.1.s1762956582$o82$g1$t1762956713$j59$l0$h0; ASP.NET_SessionId=xr5rgu1l4ij1f35rex2k4kjl; _clsk=7tqj8p%5E1762977209509%5E1%5E1%5Eb.clarity.ms%2Fcollect',
    data: 'kC0YDHEUO0vlftrAtYHllfCjAqT8zXGwj/hFT8ULo8k=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
    origin: 'https://balance.saludplus.co',
    priority: 'u=1, i',
    referer:
      'https://balance.saludplus.co/instituciones/IndexV1?data=kC0YDHEUO0vlftrAtYHllfCjAqT8zXGwj/hFT8ULo8k=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
    'sec-ch-ua':
      '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest',
  };

  let data = null;

  // Intentar primero con SinNumero = true
  let SinNumero = true;
  let queryParams = new URLSearchParams({
    fechaInicial,
    fechaFinal,
    idEntidad,
    idContrato,
    SinNumero,
    duplicadas,
    idCuentaCobro,
    estadoFacturacionElectronica,
  }).toString();

  let url = `${baseUrl}?${queryParams}`;

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        ...dataTablesParams,
        fechaInicial,
        fechaFinal,
        idEntidad,
        idContrato,
        SinNumero,
        duplicadas,
        idCuentaCobro,
        estadoFacturacionElectronica,
      }),
      { headers }
    );

    data = response.data;

    // Si no hay resultados, intentar con SinNumero = false
    if (!data.aaData || data.aaData.length === 0) {
      SinNumero = false;
      queryParams = new URLSearchParams({
        fechaInicial,
        fechaFinal,
        idEntidad,
        idContrato,
        SinNumero,
        duplicadas,
        idCuentaCobro,
        estadoFacturacionElectronica,
      }).toString();

      url = `${baseUrl}?${queryParams}`;

      const responseRetry = await axios.post(
        url,
        new URLSearchParams({
          ...dataTablesParams,
          fechaInicial,
          fechaFinal,
          idEntidad,
          idContrato,
          SinNumero,
          duplicadas,
          idCuentaCobro,
          estadoFacturacionElectronica,
        }),
        { headers }
      );

      data = responseRetry.data;
    }
  } catch (error) {
    console.error('Error al buscar facturas:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'No se pudo obtener la información de facturas',
      details: error.response?.data || error.message,
    });
  }

  // Tomamos solo la primera fila de resultados
  const row = data.aaData?.[0];

  if (!row) {
    return res.status(404).json({
      error: 'No se encontraron facturas para el criterio de búsqueda',
    });
  }

  // Según el ejemplo:
  // ["5334294","5334294","156728 - FEH25957", ...]
  const respuestaSimplificada = {
    idFactura: row[0],        // 5334294
    numeroAdmision: row[2],   // "156728 - FEH25957"
  };

  res.json(respuestaSimplificada);
}

module.exports = { buscarFactura };