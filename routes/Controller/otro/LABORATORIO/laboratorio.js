// routes/Controller/Laboratorio.js
const { search } = require('../../../router');
const { createToken } = require('../../Base/toke');
const axios = require('axios'); // npm install axios

// Controller: descarga directamente el PDF del resultado de laboratorio
async function DescargarLaboratorio(req, res) {
  try {
    // Soporta tanto GET (query) como POST (body)
    const source = req.method === 'GET' ? req.query : req.body;

    // Extraemos parámetros del request
    const {
      institucionId,
      idUser,
      numeroAdmicion,    // dato que ingresa el usuario
      tipoDocumento,     // datos que ingresa el usuario
      numeroDocumento,
      fechaNacimiento,
    } = source;

    // --- Validación básica de parámetros ---
    const faltantes = [];
    if (!institucionId) faltantes.push('institucionId');
    if (!idUser) faltantes.push('idUser');
    if (!numeroAdmicion) faltantes.push('numeroAdmicion');
    if (!tipoDocumento) faltantes.push('tipoDocumento');
    if (!numeroDocumento) faltantes.push('numeroDocumento');
    if (!fechaNacimiento) faltantes.push('fechaNacimiento');

    if (faltantes.length) {
      return res.status(400).json({
        success: false,
        message: `❌ Faltan parámetros: ${faltantes.join(', ')}`,
      });
    }

    const instId = Number(institucionId);
    const userId = Number(idUser);

    if (!Number.isFinite(instId) || !Number.isFinite(userId)) {
      return res.status(400).json({
        success: false,
        message: '❌ institucionId e idUser deben ser numéricos',
      });
    }

    // ================= Resolver idAdmision usando numeroAdmicion =================
    // numeroAdmicion puede venir como "1 FEH23121" o como "1"
    // La ruta /buscarPaciente funciona buscando por el PRIMER fragmento ("1")
    const numeroStr = String(numeroAdmicion).trim();   // lo que escribe el usuario
    const primerFragmento = numeroStr.split(' ')[0];   // "1" de "1 FEH23121"
    const sSearch = primerFragmento;

    const baseUrl = `${req.protocol}://${req.get('host')}`; // ej: http://localhost:3000

    // Llamada interna a /buscarPaciente
    const resp = await axios.post(`${baseUrl}/buscarPaciente`, {
      sSearch, // ej: "1"
    });

    const resultados = resp.data && resp.data.resultados;

    // ===== 1) validar que exista paciente/admisión =====
    if (!Array.isArray(resultados) || resultados.length === 0) {
      return res.status(404).json({
        success: false,
        message: `❌ No se encontró ningún paciente/admisión para ese numeroAdmicion (${numeroStr}) usando sSearch=${sSearch}`,
      });
    }

    // Tomamos el primer paciente/admisión encontrado
    const paciente = resultados[0];
    const {
      idAdmision: idAdmisionStr,
      tipoDocumento: tipoDocBD,
      numeroDocumento: numeroDocBD,
      fechaNacimiento: fechaNacBD,
      numeroAdmision: numeroAdmisionBD, // así lo devuelve /buscarPaciente (ej: "1 FEH23121")
    } = paciente;

    // ===== 2) Validación de seguridad: TODOS los datos deben ser coherentes =====

    // Normalizamos strings para comparación robusta
    const norm = (v) =>
      v === undefined || v === null ? '' : String(v).trim().toUpperCase();

    const mismatches = [];

    if (norm(tipoDocBD) !== norm(tipoDocumento)) {
      mismatches.push('tipoDocumento');
    }

    if (norm(numeroDocBD) !== norm(numeroDocumento)) {
      mismatches.push('numeroDocumento');
    }

    if (norm(fechaNacBD) !== norm(fechaNacimiento)) {
      mismatches.push('fechaNacimiento');
    }

    // === Comparación del número de admisión ===
    // BD: "1 FEH23121"
    // Usuario puede enviar:
    //   - "1"
    //   - "1 FEH23121"
    const partesUsuario = numeroStr.split(/\s+/).filter(Boolean);
    const partesBD = String(numeroAdmisionBD || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let admisionCoincide = false;

    if (partesUsuario.length === 1) {
      // Usuario envió solo "1" -> comparamos solo el primer fragmento
      admisionCoincide = norm(partesUsuario[0]) === norm(partesBD[0] || '');
    } else {
      // Usuario envió "1 FEH23121" -> exigimos coincidencia exacta
      admisionCoincide = norm(numeroAdmisionBD) === norm(numeroStr);
    }

    if (!admisionCoincide) {
      mismatches.push('numeroAdmision');
    }

    // Si hay cualquier diferencia relevante, no autorizamos la descarga
    if (mismatches.length > 0) {
      // Logs internos (solo consola, no para el cliente)
      console.log('🔎 Validación de identidad fallida');
      console.log('  BD:', {
        tipoDocumento: tipoDocBD,
        numeroDocumento: numeroDocBD,
        fechaNacimiento: fechaNacBD,
        numeroAdmision: numeroAdmisionBD,
      });
      console.log('  Request:', {
        tipoDocumento,
        numeroDocumento,
        fechaNacimiento,
        numeroAdmicion: numeroStr,
      });

      return res.status(401).json({
        success: false,
        message:
          '❌ Los datos del paciente no coinciden. No se autoriza la descarga del resultado.',
        camposQueNoCoinciden: mismatches,
      });
    }

    // ===== 3) Validar idAdmision numérico =====
    const resolvedAdmisionId = Number(idAdmisionStr);

    if (!Number.isFinite(resolvedAdmisionId) || resolvedAdmisionId <= 0) {
      return res.status(400).json({
        success: false,
        message: '❌ idAdmision obtenido debe ser numérico y mayor que cero',
      });
    }

    // ================= 4) Datos del reporte =================
    const reporte = 'ListadoInformesResultadosLaboratorio';
    const modulo = 'Laboratorio';

    const token = createToken(reporte, instId, 83, userId);

    const urlParams = new URLSearchParams({
      modulo,
      reporte,
      render: 'pdf',
      hideTool: 'true',
      environment: '1',
      userId: String(userId),
      idAdmision: String(resolvedAdmisionId),
      token,
    });

    const reportHost = 'https://reportes.saludplus.co';
    const url = `${reportHost}/view.aspx?${urlParams.toString()}`;
    const filename = `laboratorio_${resolvedAdmisionId}.pdf`;

    // ================= 5) Descargar el PDF y enviarlo al cliente =================
    const reportResponse = await axios.get(url, {
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    const contentLength = reportResponse.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    reportResponse.data.pipe(res);
  } catch (error) {
    console.error('🔥 Error en DescargarLaboratorio:', {
      msg: error?.message,
      stack: error?.stack,
    });

    if (error.response) {
      return res.status(502).json({
        success: false,
        error: '❌ Error al obtener el PDF desde el servidor de reportes',
        statusReportes: error.response.status,
      });
    }

    return res.status(500).json({
      success: false,
      error: '❌ Error interno del servidor',
      detalle: error.message,
    });
  }
}

module.exports = { DescargarLaboratorio };
