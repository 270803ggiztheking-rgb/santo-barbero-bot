const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session_final' }),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', async (qr) => {
    console.log('--- QR Recibido, intentando forzar el código de 8 dígitos ---');
    const phone = '5219992235292';

    for (let i = 0; i < 15; i++) {
        try {
            console.log(`Petición ${i + 1}...`);
            const code = await client.requestPairingCode(phone);
            if (code) {
                console.log('\n✅ CÓDIGO GENERADO:', code);
                console.log('\nCópialo ahora en tu cel!');
                return;
            }
        } catch (e) {
            // Ignorar errores hasta que funcione
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log('No se pudo. Sugerencia: Intenta escanear el QR mejor.');
});

client.initialize();
