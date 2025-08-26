const express = require('express');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public'))); // Esto servirá todos los archivos dentro de 'public' automáticamente

// Si deseas servir node_modules de manera separada
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules'))); // Servir 'node_modules' desde '/node_modules'

// Middleware para manejar CORS, y archivos JSON
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear solicitudes JSON
app.use(fileUpload()); // Permitir carga de archivos

// Rutas de tu servidor (asegúrate de que las rutas estén correctamente definidas)
const router = require('./routes/router');
app.use(router); // Usar las rutas definidas en 'router.js'

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});