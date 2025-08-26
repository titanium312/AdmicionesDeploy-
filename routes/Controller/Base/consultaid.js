const sql = require('mssql');

// Configuración de la base de datos
const dbConfig = {
  user: 'developer',
  password: 'lsbQUA2Z75)2',
  server: '54.159.152.155',
  database: 'SaludPlus24HRS',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  connectionTimeout: 15000
};

const institucion = async (req, res) => {
  const { idUsuario } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('idUsuario', sql.Int, idUsuario)
      .query(`
        SELECT id_institucion, nombre_institucion 
        FROM instituciones 
        JOIN instituciones_usuarios ON fk_institucion = id_institucion 
        WHERE fk_usuario = @idUsuario
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching institutions:', error.message);
    res.status(500).json({ error: 'Error fetching institutions' });
  }
};





module.exports = { institucion };