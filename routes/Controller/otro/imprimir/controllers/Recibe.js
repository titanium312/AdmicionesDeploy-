// controllers/Recibe.js
const store = require('./store');

// GET /recibe/:userId  — opción 1: ver el comando pendiente (el más reciente)
async function verComandoPendiente(req, res) {
  try {
    const { userId } = req.params;
    const cmd = store.obtenerPendienteMasReciente(String(userId));
    if (!cmd) {
      return res.status(204).send(); // sin contenido (no hay pendientes)
    }
    return res.json({ pendiente: cmd });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error obteniendo comando pendiente' });
  }
}

// POST /recibe/:userId/respuesta  — opción 2: responder resultado del comando
// body: { comandoId, resultado }
async function responderComando(req, res) {
  try {
    const { userId } = req.params;
    const { comandoId, resultado } = req.body || {};
    if (!comandoId) {
      return res.status(400).json({ error: 'comandoId es requerido' });
    }
    const actualizado = store.responder(String(userId), String(comandoId), resultado ?? null);
    if (!actualizado) {
      return res.status(404).json({ error: 'Comando no encontrado para ese userId' });
    }
    return res.json({ ok: true, comando: actualizado });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error actualizando respuesta' });
  }
}

module.exports = {
  verComandoPendiente,
  responderComando,
};
