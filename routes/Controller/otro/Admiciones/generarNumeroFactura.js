const axios = require('axios');

async function NumeroFactura(req, res) {
  try {
    const { idFacturas, numeroFactura = '' } = req.query;

    if (!idFacturas) {
      return res.status(400).json({ error: 'idFacturas is required' });
    }

    const url = `https://balance.saludplus.co/facturasAdministar/Numerarfacturas?idFacturas=${idFacturas}&numeroFactura=${numeroFactura}`;

    // Hardcoded headers and cookies for simplicity (update as needed for auth/expiration)
    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
      'Cookie': '_ga=GA1.1.1469375648.1751036181; twk_uuid_61e04197b84f7301d32ada9f=%7B%22uuid%22%3A%221.SwxyeCTT34Mmmd16IGFZEIs4qnqw08vJoA7Zp7CyZZfO4Px2I8wN3tVWTiqG8H9ydM6KgdmIcX6mJor6fjU6jTf8qykLvXKYBIUOklHi0fz5sNXBSz1vD%22%2C%22version%22%3A3%2C%22domain%22%3A%22saludplus.co%22%2C%22ts%22%3A1751040824136%7D; _clck=mhdvxt%5E2%5Eg0y%5E0%5E2004; _ga_581YHK4S33=GS2.1.s1762956582$o82$g1$t1762956713$j59$l0$h0; _clsk=y510cq%5E1762962008433%5E2%5E1%5Eb.clarity.ms%2Fcollect',
      'data': '3KpvkLUGr3iohpFUZSKPvAkg2A/bXYWC9XP9o9K5Ppc=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
      'Referer': 'https://balance.saludplus.co/instituciones/IndexV1?data=3KpvkLUGr3iohpFUZSKPvAkg2A/bXYWC9XP9o9K5Ppc=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    };

    const response = await axios.get(url, { headers });

    res.json(response.data);
  } catch (error) {
    console.error('Error in NumeroFactura:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { NumeroFactura };