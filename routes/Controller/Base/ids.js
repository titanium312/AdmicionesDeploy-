// ./Base/ids.js
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASS || 'lsbQUA2Z75)2',
  server: process.env.DB_HOST || '54.159.152.155',
  database: process.env.DB_NAME || 'SaludPlus24HRS',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: Number(process.env.DB_CONN_TIMEOUT || 15000),
};

let poolPromise;

/**
 * Retorna (o crea) el pool global
 */
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

/**
 * Convierte a arreglo, filtra nulos/undefined y hace único
 */
function uniqArray(v) {
  const arr = v == null ? [] : Array.isArray(v) ? v : [v];
  return [...new Set(arr.filter((x) => x !== null && x !== undefined))];
}

/**
 * INTENTA resolver una admisión partiendo de:
 *  - número_admision
 *  - id_admision
 *  - número_factura
 *
 * Devuelve: { id_admision, fk_paciente, via: 'admision' | 'factura' }
 */
async function resolverAdmision({ institucionId, clave }) {
  if (!institucionId || !clave) {
    throw new Error('institucionId y clave son requeridos');
  }

  const pool = await getPool();
  const idInst = Number(institucionId);

  // Si la clave es numérica, se intenta como numero_admision o id_admision
  const admArg = Number(clave);
  if (!Number.isNaN(admArg)) {
    const rAdm = await pool
      .request()
      .input('idInst', sql.Int, idInst)
      .input('admArg', sql.Int, admArg)
      .query(`
        SELECT TOP 1 id_admision, fk_paciente
        FROM facturacion_admisiones
        WHERE fk_institucion = @idInst
          AND (numero_admision = @admArg OR id_admision = @admArg)
        ORDER BY id_admision DESC
      `);

    if (rAdm.recordset.length > 0) {
      const { id_admision, fk_paciente } = rAdm.recordset[0];
      return { id_admision, fk_paciente, via: 'admision' };
    }
  }

  // Si no hubo match como admisión (o la clave no era numérica), probar como número de factura
  const rFac = await pool
    .request()
    .input('idInst', sql.Int, idInst)
    .input('numFactura', sql.VarChar, String(clave))
    .query(`
      SELECT TOP 1 fk_admision
      FROM facturas
      WHERE fk_institucion = @idInst
        AND numero_factura = @numFactura
      ORDER BY id_factura DESC
    `);

  if (rFac.recordset.length === 0) {
    throw new Error('No se encontró admisión ni factura con la clave proporcionada');
  }

  const id_admision = rFac.recordset[0].fk_admision;

  // Recuperar fk_paciente para la admisión encontrada
  const rAdmFromFactura = await pool
    .request()
    .input('idInst', sql.Int, idInst)
    .input('id_admision', sql.Int, id_admision)
    .query(`
      SELECT TOP 1 fk_paciente
      FROM facturacion_admisiones
      WHERE fk_institucion = @idInst
        AND id_admision = @id_admision
      ORDER BY id_admision DESC
    `);

  const fk_paciente = rAdmFromFactura.recordset[0]?.fk_paciente || null;
  return { id_admision, fk_paciente, via: 'factura' };
}

/**
 * Retorna IDs y metadatos asociados a una admisión
 */
async function obtenerIdsPorAdmision({ institucionId, idAdmision }) {
  if (!institucionId || !idAdmision) {
    throw new Error('institucionId e idAdmision son requeridos');
  }

  const pool = await getPool();
  const idInst = Number(institucionId);
  const admArg = Number(idAdmision);

  // 1) Resolver id_admision y paciente
  const qAdm = `
    SELECT TOP 1 id_admision, fk_paciente
    FROM facturacion_admisiones
    WHERE fk_institucion = @idInst
      AND (numero_admision = @admArg OR id_admision = @admArg)
    ORDER BY id_admision DESC
  `;
  const rAdm = await pool
    .request()
    .input('idInst', sql.Int, idInst)
    .input('admArg', sql.Int, admArg)
    .query(qAdm);

  if (rAdm.recordset.length === 0) {
    throw new Error('Admisión no encontrada para la institución indicada');
  }

  const { id_admision, fk_paciente } = rAdm.recordset[0];

  // 2) Historia clínica
  const qHist = `
    SELECT TOP 1 id_historia
    FROM historias_clinicas
    WHERE fk_admision = @id_admision
    ORDER BY id_historia DESC
  `;
  const rHist = await pool
    .request()
    .input('id_admision', sql.Int, id_admision)
    .query(qHist);

  const id_historia = rHist.recordset[0]?.id_historia || null;

  // 3) Consultas paralelas
  const [rNotas, rOrdenes, rEgresos, rEvol, rAnx2, rFacts, rPaciente, rInstitucion] =
    await Promise.all([
      id_historia
        ? pool
            .request()
            .input('id_historia', sql.Int, id_historia)
            .query('SELECT id_nota_enfermeria FROM notas_enfermeria WHERE fk_historia = @id_historia')
        : { recordset: [] },

      id_historia
        ? pool
            .request()
            .input('id_historia', sql.Int, id_historia)
            .query('SELECT id_orden_medica FROM ordenes_medicas WHERE fk_historia = @id_historia')
        : { recordset: [] },

      id_historia
        ? pool
            .request()
            .input('id_historia', sql.Int, id_historia)
            .query('SELECT id_egreso_historia FROM egresos_historia WHERE fk_historia = @id_historia')
        : { recordset: [] },

      pool
        .request()
        .input('id_admision', sql.Int, id_admision)
        .query('SELECT id_evolucion FROM evoluciones WHERE fk_admision = @id_admision'),

      pool
        .request()
        .input('id_admision', sql.Int, id_admision)
        .query('SELECT id_anexo_tecnico_dos FROM anexoDos WHERE fk_admision = @id_admision'),

      pool
        .request()
        .input('idInst', sql.Int, idInst)
        .input('id_admision', sql.Int, id_admision)
        .query(`
          SELECT id_factura, numero_factura, fk_admision
          FROM facturas
          WHERE fk_institucion = @idInst
            AND fk_admision   = @id_admision
          ORDER BY id_factura DESC
        `),

      fk_paciente
        ? pool
            .request()
            .input('fk_paciente', sql.Int, fk_paciente)
            .query(`
              SELECT tipo_documento_paciente, documento_paciente, nombre1_paciente
              FROM pacientes
              WHERE id_paciente = @fk_paciente
            `)
        : { recordset: [] },

      pool
        .request()
        .input('idInst', sql.Int, idInst)
        .query(`
          SELECT nit_institucion, id_institucion
          FROM instituciones
          WHERE id_institucion = @idInst
        `),
    ]);

  // 4) Normalización de IDs
  const facturasDetalle = (rFacts.recordset || []).map(
    ({ id_factura, numero_factura, fk_admision }) => ({
      id_factura,
      numero_factura,
      id_admision: fk_admision,
    })
  );

  const numerosFacturas = uniqArray(facturasDetalle.map((x) => x.numero_factura));
  const paciente = rPaciente.recordset[0] || null;
  const institucion = rInstitucion.recordset[0] || null;

  const nitInstitucion = institucion?.nit_institucion || null;
  const tipoDocumento = paciente?.tipo_documento_paciente || null;
  const numero_documento = paciente?.documento_paciente || null;
  const numeroFactura = numerosFacturas.length > 0 ? numerosFacturas[0] : null;

  return {
    id_admision,
    id_historia,
    facturasDetalle,
    paciente,
    institucion,
    nitInstitucion,
    numeroFactura,
    tipoDocumento,
    numero_documento,
  };
}

/**
 * Unifica admisión o factura como entrada
 */
async function obtenerIds({ institucionId, clave }) {
  if (!institucionId || !clave) {
    throw new Error('institucionId y clave son requeridos');
  }

  const { id_admision } = await resolverAdmision({ institucionId, clave });
  return obtenerIdsPorAdmision({ institucionId, idAdmision: id_admision });
}

/**
 * NUEVO: devuelve solo id_factura, tipo_documento, numero_documento, nombre
 */
async function obtenerResumenFacturaPaciente({ institucionId, clave }) {
  if (!institucionId || !clave) {
    throw new Error('institucionId y clave son requeridos');
  }

  const { id_admision, fk_paciente } = await resolverAdmision({ institucionId, clave });
  const pool = await getPool();
  const idInst = Number(institucionId);

  const r = await pool
    .request()
    .input('idInst', sql.Int, idInst)
    .input('id_admision', sql.Int, id_admision)
    .input('fk_paciente', sql.Int, fk_paciente ?? null)
    .query(`
      SELECT
        f.id_factura AS id_factura,
        p.tipo_documento_paciente AS tipo_documento,
        p.documento_paciente AS numero_documento,
        p.nombre1_paciente AS nombre
      FROM facturas f
      LEFT JOIN pacientes p ON p.id_paciente = @fk_paciente
      WHERE f.fk_institucion = @idInst
        AND f.fk_admision = @id_admision
      ORDER BY f.id_factura DESC
    `);

  return (r.recordset || []).map(row => ({
    id_factura: row.id_factura,
    tipo_documento: row.tipo_documento ?? null,
    numero_documento: row.numero_documento ?? null,
    nombre: row.nombre ?? null,
  }));
}

// Exportar todo
module.exports = {
  obtenerIdsPorAdmision,
  obtenerIds,
  resolverAdmision,
  obtenerResumenFacturaPaciente,
};
