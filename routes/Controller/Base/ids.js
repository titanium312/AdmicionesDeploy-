// Base/ids.js
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASS || 'lsbQUA2Z75)2',
  server: process.env.DB_HOST || '54.159.152.155',
  database: process.env.DB_NAME || 'SaludPlus24HRS',
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: Number(process.env.DB_CONN_TIMEOUT || 15000),
};

let poolPromise;

/** Pool global */
async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

/** Array único sin nulos */
function uniqArray(v) {
  const arr = v == null ? [] : Array.isArray(v) ? v : [v];
  return [...new Set(arr.filter((x) => x !== null && x !== undefined))];
}

/** Detecta la columna de fecha disponible en facturacion_admisiones (dinámico) */
async function pickAdmDateColumn(pool) {
  // Prioridad de nombres comunes; agrega aquí otros si tu esquema usa otro alias
  const candidatos = [
    'fecha_admision',
    'fec_admision',
    'fecha_ingreso',
    'fec_ingreso',
    'fecha_ing',
    'f_admision',
    'admision_fecha',
    'fechaadmision',
    'fecha_ingreso_admision',
  ];
  const r = await pool.request().query(`
    SELECT name
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.facturacion_admisiones')
  `);
  const cols = new Set((r.recordset || []).map(x => String(x.name).toLowerCase()));
  const hit = candidatos.find(n => cols.has(n.toLowerCase()));
  return hit || null; // null si no hay ninguna de las candidatas
}

/** Resolver admisión a partir de clave (número admisión/id admisión o número de factura) */
async function resolverAdmision({ institucionId, clave }) {
  if (!institucionId || !clave) throw new Error('institucionId y clave son requeridos');

  const pool = await getPool();
  const idInst = Number(institucionId);
  const admArg = Number(clave);

  // Intento por numero_admision o id_admision
  if (!Number.isNaN(admArg)) {
    const rAdm = await pool.request()
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

  // Intento por número de factura
  const rFac = await pool.request()
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

  const rAdmFromFactura = await pool.request()
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

/** IDs y metadatos por admisión (fecha_admision con selección dinámica) */
async function obtenerIdsPorAdmision({ institucionId, idAdmision }) {
  if (!institucionId || !idAdmision) throw new Error('institucionId e idAdmision son requeridos');

  const pool = await getPool();
  const idInst = Number(institucionId);
  const admArg = Number(idAdmision);

  // fecha_admision dinámica
  const dateCol = await pickAdmDateColumn(pool);
  const dateSelect = dateCol
    ? `, [${dateCol}] AS fecha_admision`
    : `, CAST(NULL AS datetime) AS fecha_admision`;

  // 1) admisión + paciente + fecha_admision
  const rAdm = await pool.request()
    .input('idInst', sql.Int, idInst)
    .input('admArg', sql.Int, admArg)
    .query(`
      SELECT TOP 1
        id_admision,
        fk_paciente
        ${dateSelect}
      FROM facturacion_admisiones
      WHERE fk_institucion = @idInst
        AND (numero_admision = @admArg OR id_admision = @admArg)
      ORDER BY id_admision DESC
    `);

  if (rAdm.recordset.length === 0) {
    throw new Error('Admisión no encontrada para la institución indicada');
  }

  const { id_admision, fk_paciente, fecha_admision } = rAdm.recordset[0];

  // 2) historia (por si la usas en otros reportes)
  const rHist = await pool.request()
    .input('id_admision', sql.Int, id_admision)
    .query(`
      SELECT TOP 1 id_historia
      FROM historias_clinicas
      WHERE fk_admision = @id_admision
      ORDER BY id_historia DESC
    `);
  const id_historia = rHist.recordset[0]?.id_historia || null;

  // 3) facturas, paciente, institución
  const [rFacts, rPaciente, rInstitucion] = await Promise.all([
    pool.request()
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
      ? pool.request()
          .input('fk_paciente', sql.Int, fk_paciente)
          .query(`
            SELECT
              fecha_nacimiento,
              tipo_documento_Paciente,
              documento_paciente,
              nombre1_paciente
            FROM pacientes
            WHERE id_paciente = @fk_paciente
          `)
      : { recordset: [] },

    pool.request()
      .input('idInst', sql.Int, idInst)
      .query(`
        SELECT nit_institucion, id_institucion
        FROM instituciones
        WHERE id_institucion = @idInst
      `),
  ]);

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
  const tipoDocumento = paciente?.tipo_documento_Paciente || null;
  const numero_documento = paciente?.documento_paciente || null;
  const fecha_nacimiento = paciente?.fecha_nacimiento || null;
  const numeroFactura = numerosFacturas.length > 0 ? numerosFacturas[0] : null;

  return {
    id_admision,
    id_historia,
    facturasDetalle,
    paciente,
    institucion,
    nitInstitucion,
    numeroFactura,
    // Campos solicitados
    tipoDocumento,
    numero_documento,
    fecha_nacimiento,
    fecha_admision,
  };
}

/** Unificar entrada por clave (admision o factura) */
async function obtenerIds({ institucionId, clave }) {
  if (!institucionId || !clave) throw new Error('institucionId y clave son requeridos');
  const { id_admision } = await resolverAdmision({ institucionId, clave });
  return obtenerIdsPorAdmision({ institucionId, idAdmision: id_admision });
}

/** Factura por numero_admision (tu SELECT exacto) */
async function obtenerFacturaPorNumeroAdmision({ institucionId, numeroAdmision }) {
  if (!institucionId || !numeroAdmision) {
    throw new Error('institucionId y numeroAdmision son requeridos');
  }
  const pool = await getPool();
  const r = await pool.request()
    .input('idInst', sql.Int, Number(institucionId))
    .input('numAdm', sql.Int, Number(numeroAdmision))
    .query(`
      SELECT TOP 1 id_factura, fecha_emision, numero_factura, fk_paciente, fk_admision
      FROM facturas
      WHERE fk_institucion = @idInst
        AND fk_admision = (
          SELECT id_admision
          FROM facturacion_admisiones
          WHERE fk_institucion = @idInst
            AND numero_admision = @numAdm
        )
      ORDER BY id_factura DESC
    `);
  return r.recordset[0] || null;
}

/** Paciente por id e institución (nombres tal cual compartiste) */
async function obtenerPacientePorId({ institucionId, idPaciente }) {
  if (!institucionId || !idPaciente) {
    throw new Error('institucionId e idPaciente son requeridos');
  }
  const pool = await getPool();
  const r = await pool.request()
    .input('idInst', sql.Int, Number(institucionId))
    .input('idPac', sql.Int, Number(idPaciente))
    .query(`
      SELECT fecha_nacimiento,
             tipo_documento_Paciente,
             documento_paciente,
             nombre1_paciente
      FROM pacientes
      WHERE fk_institucion = @idInst
        AND id_paciente = @idPac
    `);
  return r.recordset[0] || null;
}

/** Fecha de admisión por numero_admision (dinámico) */
async function obtenerFechaAdmisionPorNumero({ institucionId, numeroAdmision }) {
  const pool = await getPool();
  const idInst = Number(institucionId);
  const numAdm = Number(numeroAdmision);

  const dateCol = await pickAdmDateColumn(pool);
  const dateSelect = dateCol
    ? `[${dateCol}] AS fecha_admision`
    : `CAST(NULL AS datetime) AS fecha_admision`;

  const r = await pool.request()
    .input('idInst', sql.Int, idInst)
    .input('numAdm', sql.Int, numAdm)
    .query(`
      SELECT TOP 1 ${dateSelect}
      FROM facturacion_admisiones
      WHERE fk_institucion = @idInst
        AND numero_admision = @numAdm
      ORDER BY id_admision DESC
    `);

  return r.recordset[0]?.fecha_admision || null;
}

/** Resumen completo por numero_admision (lo que usa el Controller en mode=json) */
async function obtenerIdentidadPorNumeroAdmision({ institucionId, numeroAdmision }) {
  const factura = await obtenerFacturaPorNumeroAdmision({ institucionId, numeroAdmision });
  if (!factura) return null;

  const paciente = factura.fk_paciente
    ? await obtenerPacientePorId({ institucionId, idPaciente: factura.fk_paciente })
    : null;

  const fecha_admision = await obtenerFechaAdmisionPorNumero({ institucionId, numeroAdmision });

  return {
    // de facturas
    id_factura: factura.id_factura,
    fecha_emision: factura.fecha_emision,
    numero_factura: factura.numero_factura,
    fk_admision: factura.fk_admision,
    fk_paciente: factura.fk_paciente,
    // de pacientes
    fecha_nacimiento: paciente?.fecha_nacimiento ?? null,
    tipo_documento: paciente?.tipo_documento_Paciente ?? null,
    numero_documento: paciente?.documento_paciente ?? null,
    nombre: paciente?.nombre1_paciente ?? null,
    // de admisiones
    fecha_admision,
  };
}

module.exports = {
  getPool,
  resolverAdmision,
  obtenerIdsPorAdmision,
  obtenerIds,
  obtenerFacturaPorNumeroAdmision,
  obtenerPacientePorId,
  obtenerFechaAdmisionPorNumero,
  obtenerIdentidadPorNumeroAdmision,
};
