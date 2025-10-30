// store.js (en ...\imprimir\store.js)
const { randomUUID } = require('crypto');

const comandos = []; 
// estructura: { id, userId, cmd, estado: 'pendiente'|'respondido', resultado, creadoEn, respondidoEn }

function crearComando(userId, cmd) {
  const nuevo = {
    id: randomUUID(),
    userId,
    cmd,
    estado: 'pendiente',
    resultado: null,
    creadoEn: new Date().toISOString(),
    respondidoEn: null,
  };
  comandos.push(nuevo);
  return nuevo;
}

function listarPorUsuario(userId) {
  return comandos
    .filter(c => c.userId === userId)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

function obtenerPendienteMasReciente(userId) {
  return listarPorUsuario(userId).find(c => c.estado === 'pendiente') || null;
}

function responder(userId, comandoId, resultado) {
  const c = comandos.find(x => x.id === comandoId && x.userId === userId);
  if (!c) return null;
  if (c.estado === 'respondido') return c; // opcional: evitar doble respuesta
  c.estado = 'respondido';
  c.resultado = resultado;
  c.respondidoEn = new Date().toISOString();
  return c;
}

module.exports = {
  crearComando,
  listarPorUsuario,
  obtenerPendienteMasReciente,
  responder,
};
