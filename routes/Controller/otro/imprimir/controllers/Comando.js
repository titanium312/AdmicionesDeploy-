// controllers/Comando.js
const store = require('./store');

// POST /comando  { userId, cmd }
async function mandarComando(req, res) {
  try {
    const { userId, cmd } = req.body || {};
    if (!userId || !cmd) {
      return res.status(400).json({ error: 'userId y cmd son requeridos' });
    }
    const creado = store.crearComando(String(userId), String(cmd));
    return res.status(201).json({ ok: true, comando: creado });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error creando comando' });
  }
}

// GET /seguimiento/:userId  — historial de comandos de ese usuario
async function seguimiento(req, res) {
  try {
    const { userId } = req.params;
    const lista = store.listarPorUsuario(String(userId));
    return res.json({ userId, total: lista.length, comandos: lista });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error obteniendo seguimiento' });
  }
}

module.exports = {
  mandarComando,
  seguimiento,
};
