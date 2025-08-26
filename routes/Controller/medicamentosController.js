const { descargarConToken } = require('./../descargas/descargas');

// 📌 URL base de descarga del PDF
const BASE_PDF_URL = 'https://reportes.saludplus.co/Default.aspx';

async function descargarMedicamentos(req, res) {
  const { idOrdenMedica, token } = req.query;

  // ⚠️ Validar parámetros obligatorios
  if (!idOrdenMedica || !token) {
    return res.status(400).send('❌ Faltan parámetros: idOrdenMedica o token');
  }

  try {
    // 🛠 Construir URL de descarga
    const pdfUrl = `${BASE_PDF_URL}?modulo=Asistencial&reporte=ListadoOrdenDeMedicamentos&hideTool=true&environment=1&render=pdf&IdOrdenMedica=${idOrdenMedica}`;

    console.log(`➡️ Descargando PDF desde: ${pdfUrl}`);

    // 📝 Generar nombre único para el archivo
    const nombreArchivo = `reporte_orden_medicamentos_${idOrdenMedica}_${Date.now()}.pdf`;

    // 📥 Usar la función descargarConToken
    const filePath = await descargarConToken(nombreArchivo, pdfUrl, token);

    console.log('✅ PDF guardado correctamente en:', filePath);
    
    res.status(200).json({
      message: '✅ PDF descargado y guardado correctamente',
      filePath: filePath,
      fileName: nombreArchivo,
      idOrdenMedica: idOrdenMedica
    });

  } catch (err) {
    console.error('🔥 Error inesperado:', err);
    
    // Manejar errores específicos
    if (err.response && err.response.status) {
      return res.status(err.response.status).send(`❌ Error HTTP ${err.response.status}: ${err.response.statusText}`);
    }
    
    res.status(500).send(`❌ Error inesperado: ${err.message || err}`);
  }
}

module.exports = {
  descargarMedicamentos,
};