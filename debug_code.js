const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session_debug' }),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', async (qr) => {
    console.log('QR RECIBIDO');
    try {
        const code = await client.requestPairingCode('529992235292');
        console.log('CODIGO:', code);
    } catch (e) {
        console.log('ERROR COMPLETO:', e);
    }
});

client.initialize().catch(e => console.log('INIT ERROR:', e));
