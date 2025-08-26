const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function descargarCarpeta(req, res) {
  try {
    // Ruta de la carpeta que queremos comprimir
    const carpetaPath = path.join(__dirname, 'descarga');

    // Verificar si la carpeta existe
    if (!fs.existsSync(carpetaPath)) {
      return res.status(404).send('La carpeta no existe.');
    }

    // Nombre del archivo ZIP de salida
    const zipFileName = 'descarga.zip';

    // Establecer los encabezados para la respuesta
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);

    // Crear un archivo de salida para el ZIP
    const archive = archiver('zip', {
      zlib: { level: 9 } // Nivel de compresión
    });

    // Piping del archivo ZIP a la respuesta
    archive.pipe(res);

    // Agregar la carpeta al archivo ZIP
    archive.directory(carpetaPath, false); // El segundo parámetro es para omitir un prefijo en el ZIP

    // Finalizar el archivo ZIP
    await archive.finalize();
  } catch (error) {
    console.error('Error al generar el ZIP:', error);
    res.status(500).send('Error al generar el archivo comprimido.');
  }
}

module.exports = { descargarCarpeta };
