
const axios = require('axios');
const fs = require('fs');


async function Informe(req, res) {


  const url = "https://reportes.saludplus.co/View.aspx?modulo=Asistencial&reporte=ListadoHistoriasAsistencialesDestallado&hideTool=true&environment=1&userId=6874&fechaInicial=01/08/2025&fechaFinal=01/08/2025&auditoria=1&token=tZBi6UPE96ymxMl3JkvIgsIwxMl3JkfHG1hQDiXEJ0kTLbS1OBBumQMPor21LdZ6gDYLmv81yuyZ2f4vTZ7p1h2nr9lqPor21LdwYv7xmgesPor21Ldo4j38FL0pSsu36TGxMl3JkxcF9AfZ2sxMl3JkPlY9PmpJNCxMl3JkZCt";

  const nombreArchivo = "ListadoAsistencialHojaGastos_01_08_2025_01_08_2025.pdf";

  try {
    // Realizar la solicitud HTTP para descargar el archivo
    const response = await axios.get(url, { responseType: 'stream' });

    // Crear un archivo y guardar el contenido
    response.data.pipe(fs.createWriteStream(nombreArchivo));

    response.data.on('end', () => {
      console.log(`Archivo descargado como ${nombreArchivo}`);
    });

    response.data.on('error', (err) => {
      console.error('Error al descargar el archivo:', err);
    });
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
  }
}


module.exports = { Informe };
