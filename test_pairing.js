const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './test_session' }),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', async (qr) => {
    console.log('Evento QR fired');
    try {
        console.log('Solicitando código...');
        const code = await client.requestPairingCode('529992235292');
        console.log('CÓDIGO GENERADO:', code);
        process.exit(0);
    } catch (e) {
        console.error('Error en test:', e.message);
        process.exit(1);
    }
});

console.log('Iniciando...');
client.initialize();
