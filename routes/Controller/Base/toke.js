const fetch = require('node-fetch');
const { institucion } = require('./consultaid');
const CryptoJS = require('crypto-js');

const LOGIN_URL = 'https://api.saludplus.co/api/Auth/login';

// 🔧 Lógica para obtener la institución desde tu backend
// Lógica para obtener la institución desde tu backend
function obtenerInstitucionPorUsuario(idUsuario) {
  return new Promise((resolve, reject) => {
    const req = { body: { idUsuario } };
    const res = {
      json: (data) => resolve(data), // Resolver la promesa con los datos que vienen
      status: (code) => ({
        json: (err) => reject(new Error(err.error || 'Error desconocido')), // Rechazar si algo falla
      }),
    };

    console.log('Llamando a la función institucion con el idUsuario:', idUsuario);
    institucion(req, res); // Llamar a la función que maneja la respuesta de la institución
  });
}


// 🔐 Endpoint Express que hace login y obtiene la institución
async function obtenerDatosLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    // Paso 1: Hacer login contra la API externa
    const loginResponse = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!loginResponse.ok) {
      const errorResponse = await loginResponse.json();
      return res.status(loginResponse.status).json({ error: errorResponse.error || 'Credenciales incorrectas' });
    }

    const loginData = await loginResponse.json();
    const idUsuario = loginData.id;

    if (!idUsuario) {
      return res.status(400).json({ error: 'No se encontró ID de usuario en la respuesta' });
    }

    // Paso 2: Obtener la institución usando el ID de usuario
    console.log(`Obteniendo institución para el usuario con ID: ${idUsuario}`);
    
    const institucionData = await obtenerInstitucionPorUsuario(idUsuario);
    console.log('Datos recibidos de la institución:', institucionData);

    if (!Array.isArray(institucionData) || institucionData.length === 0) {
      return res.status(404).json({ error: 'Institución no encontrada para este usuario' });
    }

    // Crear objeto usuario simplificado
    const usuario = {
      id_usuario: loginData.id,
      nombre: loginData.nombre,
      usuario: loginData.usuario,
      perfiles: loginData.perfiles
    };

    console.log('Datos de usuario:', usuario);

    // Respuesta final
    return res.json({
      token: loginData.token || null,
      usuario,
      institucion: institucionData[0],
      perfiles: loginData.perfiles || [],
    });

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return res.status(500).json({ error: error.message });
  }
}


module.exports = { obtenerDatosLogin };












// Ahora recibe el userId como parámetro, no intenta importar nada
function createToken(reportName, institucionId, idCaracteristica, userId) {
  let now = new Date();
  let dateini = new Date(now.getTime() + 15 * 60000); // Expira en 15 minutos

  let tokenOut = reportName;
  if (tokenOut.length < 16) {
    tokenOut = tokenOut.padEnd(16, '0');
  } else if (tokenOut.length > 16) {
    tokenOut = tokenOut.substring(0, 16);
  }

  let key = CryptoJS.enc.Utf8.parse(tokenOut);
  let iv = CryptoJS.enc.Utf8.parse(tokenOut);

  let data = {
    institucionId: Number(institucionId),
    userId: userId,
    expiration: dateini.getTime(),
    permiso: {
      Caracteristica: idCaracteristica,
    },
  };

  let dataToSend = JSON.stringify(data);

  let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(dataToSend), key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  let dataSend = encrypted
    .toString()
    .replaceAll('+', 'xMl3Jk')
    .replaceAll('/', 'Por21Ld')
    .replaceAll('=', 'Ml32');

  return dataSend;
}

// Exporta con nombres correctos
module.exports = { createToken, obtenerDatosLogin };
