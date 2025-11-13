const axios = require('axios');

async function EnviarADian(req, res) {
    const { idFacturas } = req.body;

    if (!idFacturas) {
        return res.status(400).json({ error: 'idFacturas es requerido' });
    }

    const url = 'https://balance.saludplus.co/facturasAdministar/facturacionElectronica';

    const headers = {
        'authority': 'balance.saludplus.co',
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'es-419,es;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'cookie': '_ga=GA1.1.1469375648.1751036181; twk_uuid_61e04197b84f7301d32ada9f=%7B%22uuid%22%3A%221.SwxyeCTT34Mmmd16IGFZEIs4qnqw08vJoA7Zp7CyZZfO4Px2I8wN3tVWTiqG8H9ydM6KgdmIcX6mJor6fjU6jTf8qykLvXKYBIUOklHi0fz5sNXBSz1vD%22%2C%22version%22%3A3%2C%22domain%22%3A%22saludplus.co%22%2C%22ts%22%3A1751040824136%7D; _clck=mhdvxt%5E2%5Eg0y%5E0%5E2004; _ga_581YHK4S33=GS2.1.s1762956582$o82$g1$t1762956713$j59$l0$h0; ASP.NET_SessionId=xr5rgu1l4ij1f35rex2k4kjl; _clsk=7tqj8p%5E1762977209509%5E1%5E1%5Eb.clarity.ms%2Fcollect',
        'data': 'kC0YDHEUO0vlftrAtYHllfCjAqT8zXGwj/hFT8ULo8k=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
        'origin': 'https://balance.saludplus.co',
        'priority': 'u=1, i',
        'referer': 'https://balance.saludplus.co/instituciones/IndexV1?data=kC0YDHEUO0vlftrAtYHllfCjAqT8zXGwj/hFT8ULo8k=.1SS9/UCeyjpq9PyT8MBqPg==.wcFkBNOeMUO3EbN8I4nUXw==',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
    };

    const data = {
        idFacturas: idFacturas.toString(),
        idNotasCredito: "",
        idNotasDebito: ""
    };

    try {
        const response = await axios.post(url, data, { headers });

        // Respuesta exitosa del curl: {"valorRetorno":1,"mensajeRetorno":""}
        res.json(response.data);
    } catch (error) {
        console.error('Error al enviar a DIAN:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Error al enviar factura a DIAN',
            details: error.response?.data || error.message
        });
    }
}

module.exports = { EnviarADian };