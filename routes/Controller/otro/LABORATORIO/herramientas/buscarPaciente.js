// routes/Controller/buscarPaciente.js
const axios = require('axios');
const qs = require('qs');

// ⚠️ Lo ideal: guardar el token en variable de entorno
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IlJiYXJyZXRvIiwianRpIjoiNmVmM2Q0ODgtMThhYi00NzZmLWI5NzgtMmRkMzlkYjE0YWM4IiwidXNlcm5hbWUiOiJSYmFycmV0byIsImFkbWluIjoiTiIsInVzZXJpZCI6IjY4NzQiLCJwZXJtaXNzaW9ucyI6Ilt7XCJtXCI6MixcImNcIjpbe1wiY1wiOjIsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NixcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjE1LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6MjIsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjoyNCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjQyLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NDMsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo0NCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjQ1LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NDgsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo5MSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUxNDgsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MTYwLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIzNSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyNDAsXCJsXCI6WzEsNF19LHtcImNcIjo1MjQxLFwibFwiOlsxLDRdfSx7XCJjXCI6NTI0MixcImxcIjpbMSw0XX0se1wiY1wiOjUyNDMsXCJsXCI6WzEsNF19LHtcImNcIjo1MjQ0LFwibFwiOlsxLDRdfSx7XCJjXCI6NTI0NSxcImxcIjpbMSw0XX0se1wiY1wiOjUyNTAsXCJsXCI6WzEsNF19LHtcImNcIjo1MjU1LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTM4MCxcImxcIjpbMCwxLDMsMiw0XX1dfSx7XCJtXCI6MyxcImNcIjpbe1wiY1wiOjEwLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6MTYsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjozMyxcImxcIjpbMSw0XX0se1wiY1wiOjQ5LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTAsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1NCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjg0LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6ODksXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo5MyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjEwOTUsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjozMTAzLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6MzEwNCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjMxMDUsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjozMTA2LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTExMCxcImxcIjpbMSw0XX0se1wiY1wiOjUxMTQsXCJsXCI6WzEsNF19LHtcImNcIjo1MTE1LFwibFwiOlsxLDRdfSx7XCJjXCI6NTExOCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUxMTksXCJsXCI6WzEsNF19LHtcImNcIjo1MTQ0LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTE0NSxcImxcIjpbMSw0XX0se1wiY1wiOjUxNjUsXCJsXCI6WzEsNF19LHtcImNcIjo1MTY2LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTE3MCxcImxcIjpbMSw0XX0se1wiY1wiOjUxNzEsXCJsXCI6WzEsNF19LHtcImNcIjo1MTczLFwibFwiOlsxLDRdfSx7XCJjXCI6NTE3NSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyMDEsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MjA0LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIxMCxcImxcIjpbMSw0XX0se1wiY1wiOjUyMTEsXCJsXCI6WzEsNF19LHtcImNcIjo1MjEyLFwibFwiOlsxLDRdfSx7XCJjXCI6NTIxNCxcImxcIjpbMSw0XX0se1wiY1wiOjUyMTUsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MjI2LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIzMyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyNDYsXCJsXCI6WzEsNF19LHtcImNcIjo1MjQ4LFwibFwiOlsxLDRdfSx7XCJjXCI6NTI0OSxcImxcIjpbMSw0XX0se1wiY1wiOjUyNTMsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MzY2LFwibFwiOlswLDEsMywyLDRdfV19LHtcIm1cIjo0LFwiY1wiOlt7XCJjXCI6MjYsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjoyNyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjMwLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6MzIsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjozNSxcImxcIjpbMSw0XX0se1wiY1wiOjM2LFwibFwiOlsxLDRdfSx7XCJjXCI6MzcsXCJsXCI6WzEsNF19LHtcImNcIjozOSxcImxcIjpbMSw0XX0se1wiY1wiOjQwLFwibFwiOlsxLDRdfSx7XCJjXCI6NTIsXCJsXCI6WzEsNF19LHtcImNcIjo1MyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjU1LFwibFwiOlsxLDRdfSx7XCJjXCI6NTE3MixcImxcIjpbMSw0XX0se1wiY1wiOjUxODcsXCJsXCI6WzEsNF19LHtcImNcIjo1MTg4LFwibFwiOlsxLDRdfSx7XCJjXCI6NTE4OSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUxOTQsXCJsXCI6WzEsNF19LHtcImNcIjo1MTk5LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIzMCxcImxcIjpbMSw0XX0se1wiY1wiOjUyNTQsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1Mzc4LFwibFwiOlsxLDRdfSx7XCJjXCI6NTM3OSxcImxcIjpbMSw0XX1dfSx7XCJtXCI6NSxcImNcIjpbe1wiY1wiOjQxLFwibFwiOlsxLDRdfSx7XCJjXCI6NDcsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MTkwLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTE5NyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyMTksXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MzY5LFwibFwiOlswLDEsMywyLDRdfV19LHtcIm1cIjo2LFwiY1wiOlt7XCJjXCI6NTEsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjozMTA5LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6MzExMSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyMDIsXCJsXCI6WzEsNF19LHtcImNcIjo1MjAzLFwibFwiOlsxLDRdfV19LHtcIm1cIjo3LFwiY1wiOlt7XCJjXCI6NTcsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1OCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjU5LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NjAsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo2MSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjYyLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NjMsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo2NCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjY1LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NjYsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo2NyxcImxcIjpbMSw0XX0se1wiY1wiOjcyLFwibFwiOlsxLDRdfSx7XCJjXCI6NzQsXCJsXCI6WzEsNF19LHtcImNcIjo3NSxcImxcIjpbMSw0XX0se1wiY1wiOjc3LFwibFwiOlsxLDRdfSx7XCJjXCI6OTAsXCJsXCI6WzEsNF19LHtcImNcIjoxMDkzLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTE0NixcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUxNjQsXCJsXCI6WzEsNF19LHtcImNcIjo1MTY3LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIwNixcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUyMDcsXCJsXCI6WzAsMSwzLDIsNF19XX0se1wibVwiOjgsXCJjXCI6W3tcImNcIjo1MTkyLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTE5MyxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUzNzEsXCJsXCI6WzEsNF19LHtcImNcIjo1Mzc1LFwibFwiOlswLDEsMywyLDRdfV19LHtcIm1cIjoxMCxcImNcIjpbe1wiY1wiOjc4LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NzksXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo4MSxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUxMTIsXCJsXCI6WzEsNF19LHtcImNcIjo1MjM5LFwibFwiOlsxLDRdfV19LHtcIm1cIjoxMSxcImNcIjpbe1wiY1wiOjM0LFwibFwiOlsxLDRdfSx7XCJjXCI6ODMsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MTE2LFwibFwiOlsxLDRdfSx7XCJjXCI6NTIyMCxcImxcIjpbMSw0XX0se1wiY1wiOjUyMzEsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MjMyLFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTIzNCxcImxcIjpbMSw0XX0se1wiY1wiOjUyMzcsXCJsXCI6WzAsMSwzLDIsNF19LHtcImNcIjo1MjM4LFwibFwiOlswLDEsMywyLDRdfSx7XCJjXCI6NTM2MCxcImxcIjpbMCwxLDMsMiw0XX0se1wiY1wiOjUzNjUsXCJsXCI6WzEsNF19XX1dIiwiaW5zdGl0dXRpb24iOiIyMCIsInBhZ29zIjoiMCIsInZlcnNpb24iOiIxLjAuMC4wIiwiZW52aXJvbm1lbnQiOiJQcm9kdWN0aW9uIiwiZXhwIjoxNzY0MjU5NzMyLCJpc3MiOiJ0ZWdldHQubG9naW4iLCJhdWQiOiJ0ZWdldHQuY29tIn0._5rIxldcFS_iMScCUkse_jill6SiZm9xx1BfuO914qQ";


// =======================
// Constantes de APIs
// =======================
const URL_PACIENTES = 'https://api.saludplus.co/api/pacientes/ListadoPacientes';

const COOKIE = 'ASP.NET_SessionId=p1hvukwfamgtp52yudog24rf';
const DATA_HEADER = '3KpvkLUGr3iohpFUZSKPvAkg2A/bXYWC9XP9o9K5Ppc=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==';
const REFERER =
  'https://balance.saludplus.co/instituciones/indexV1?data=3KpvkLUGr3iohpFUZSKPvAkg2A%2FbXYWC9XP9o9K5Ppc%3D.1SS9%2FUCeyjp9PyT8MBqPg%3D%3D';

const URL_ADMISIONES =
  'https://balance.saludplus.co/admisiones/BucardorAdmisionesDatos?fechaInicial=%2A&fechaFinal=%2A&idRecurso=0&SinCargo=False&idServicioIngreso=3&idCaracteristica=0&validarSede=True';

// =======================
// Helper: obtiene fecha de nacimiento desde API de pacientes
// =======================
async function obtenerFechaNacimiento(documento) {
  if (!documento) {
    throw new Error('Falta el parámetro "documento"');
  }

  const { data } = await axios.get(URL_PACIENTES, {
    timeout: 15000,
    headers: {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/142.0.0.0 Safari/537.36',
      Referer: 'https://app.saludplus.co/',
    },
    params: {
      pageSize: 30,
      pageNumber: 1,
      order: 'desc',
      properties:
        'documentoPaciente,nombre1Paciente,nombre2Paciente,apellido1Paciente,apellido2Paciente,estado,tipoDocumentoPaciente,fkSede',
      filter: documento,
      filterAudit: 3,
      sort: 'idPaciente',
    },
  });

  if (!data?.result?.length) {
    throw new Error('Paciente no encontrado');
  }

  const paciente = data.result[0];
  return paciente.fechaNacimiento || null;
}

// =======================
// Helper: consulta admisiones en Balance + fechaNacimiento
// =======================
async function fetchAdmisionesBalance(sSearch) {
  const form = {
    sEcho: 5,
    iColumns: 8,
    sColumns: ',CODIGO,DOCUMENTO,NOMBRE,Entidad,FECHA,HORA,ESTADO',
    iDisplayStart: 0,
    iDisplayLength: 10000,
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
  };

  const { data } = await axios.post(URL_ADMISIONES, qs.stringify(form), {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      Origin: 'https://balance.saludplus.co',
      Referer: REFERER,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      data: DATA_HEADER,
      Cookie: COOKIE,
    },
    timeout: 15000,
    maxRedirects: 5,
  });

  const filas = Array.isArray(data?.aaData) ? data.aaData : [];

  const resultadosBase = filas.map((row) => {
    const idAdmision = row?.[0] ?? '';
    const numeroAdmision = row?.[1] ?? '';
    const docCrudo = row?.[2] ?? ''; // "CC 1066514435"

    let tipoDocumento = '';
    let numeroDocumento = '';

    if (typeof docCrudo === 'string') {
      const partes = docCrudo.trim().split(/\s+/);
      tipoDocumento = partes.shift() || '';
      numeroDocumento = partes.join(' ') || '';
    }

    return { idAdmision, numeroAdmision, tipoDocumento, numeroDocumento };
  });

  // Agregar fechaNacimiento vía API de pacientes
  const resultados = await Promise.all(
    resultadosBase.map(async (item) => {
      let fechaNacimiento = null;

      try {
        fechaNacimiento = await obtenerFechaNacimiento(item.numeroDocumento);
      } catch (error) {
        console.error(
          'Error consultando fechaNacimiento para documento',
          item.numeroDocumento,
          error.message
        );
      }

      return {
        idAdmision: item.idAdmision,
        numeroAdmision: item.numeroAdmision,
        tipoDocumento: item.tipoDocumento,
        numeroDocumento: item.numeroDocumento,
        fechaNacimiento,
      };
    })
  );

  return resultados;
}

// =======================
// Controller HTTP: /buscarPaciente
// =======================
function normalizar(valor) {
  return String(valor || '').trim().toLowerCase();
}

async function buscarPaciente(req, res) {
  const sSearchRaw = req.body?.sSearch ?? req.body?.documento ?? '';
  const sSearch = String(sSearchRaw).trim();

  if (!sSearch) {
    return res.status(400).json({
      error: 'Falta el parámetro sSearch (número de admisión)',
    });
  }

  try {
    const resultados = await fetchAdmisionesBalance(sSearch);
    const buscado = normalizar(sSearch);

    // 1️⃣ Coincidencia EXACTA de numeroAdmision
    let resultadosFiltrados = resultados.filter(
      (r) => normalizar(r.numeroAdmision) === buscado
    );

    // 2️⃣ Si no hay exactos, los que EMPIECEN por "sSearch " (ej: "1 FEH23121")
    if (!resultadosFiltrados.length) {
      resultadosFiltrados = resultados.filter((r) =>
        normalizar(r.numeroAdmision).startsWith(buscado + ' ')
      );
    }

    return res.json({
      resultados: resultadosFiltrados,
      total: resultadosFiltrados.length,
    });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status || 500).json({
        error: 'Error consultando Balance SaludPlus',
        detalle: err.response.data || err.response.statusText,
      });
    }

    return res.status(500).json({
      error: 'Error inesperado',
      detalle: err.message,
    });
  }
}

module.exports = {
  buscarPaciente,
};
