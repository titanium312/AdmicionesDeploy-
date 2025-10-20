const express = require('express');
const path = require('path');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public'))); 
// Esto permite acceder directamente a cualquier archivo dentro de 'public' 
// Ejemplo: http://localhost:3000/lab.html

// Si deseas servir 'node_modules' de manera separada (útil para cargar librerías en HTML)
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Middleware para manejar CORS, JSON y carga de archivos
app.use(cors()); 
app.use(express.json()); 
app.use(fileUpload());

// Rutas del servidor (asegúrate de que exista el archivo './routes/router.js')
const router = require('./routes/router');
app.use(router);

// ✅ Ruta personalizada para 'laboratorio'
app.get('/laboratorio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lab.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Página de laboratorio: http://localhost:${PORT}/laboratorio`);
});
