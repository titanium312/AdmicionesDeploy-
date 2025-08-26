const fs = require('fs');
const path = require('path');

function EliminarCarpeta(req, res) {
  try {
    const { nombreCarpeta, confirmacion } = req.query;

    // Validar que se haya pasado el nombre de la carpeta
    if (!nombreCarpeta) {
      return res.status(400).send('❌ El parámetro nombreCarpeta es requerido');
    }

    // Verificar si la carpeta existe
    const carpetaABorrar = path.resolve(__dirname, 'descarga', nombreCarpeta);
    if (!fs.existsSync(carpetaABorrar)) {
      return res.status(400).send('❌ La carpeta especificada no existe');
    }

    // Si no se recibe la confirmación, solicitarla
    if (confirmacion !== 'si') {
      return res.status(400).send('❌ Para eliminar la carpeta, debes confirmar la eliminación enviando el parámetro confirmacion=si');
    }

    // Eliminar la carpeta de forma recursiva
    fs.rmSync(carpetaABorrar, { recursive: true, force: true });

    // Responder con éxito
    res.json({
      mensaje: '✅ Carpeta eliminada correctamente',
      carpetaEliminada: nombreCarpeta
    });
  } catch (error) {
    console.error('🔥 Error eliminando la carpeta:', error);
    res.status(500).send('❌ Error interno al eliminar la carpeta');
  }
}

module.exports = { EliminarCarpeta };
