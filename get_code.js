const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './test_session' }),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
    console.log('[SISTEMA] Imagen QR generada, pero estamos intentando obtener el código de 8 dígitos para ti...');
});

client.on('ready', () => {
    console.log('Cliente listo');
});

async function run() {
    console.log('Iniciando vinculación por número...');
    client.initialize();

    // Esperamos 20 segundos a que el navegador esté bien cargado
    await new Promise(r => setTimeout(r, 20000));

    try {
        console.log('Solicitando código de 8 dígitos para +529992235292...');
        const code = await client.requestPairingCode('529992235292');
        console.log('\n******************************************');
        console.log('🔥 TU CÓDIGO DE 8 DÍGITOS ES:', code);
        console.log('******************************************\n');
    } catch (e) {
        console.log('Error:', e.message);
        if (e.message.includes('onCodeReceivedEvent')) {
            console.log('Reintentando en 10 segundos...');
            await new Promise(r => setTimeout(r, 10000));
            try {
                const code = await client.requestPairingCode('529992235292');
                console.log('\n🔥 CÓDIGO (REINTENTO):', code);
            } catch (e2) {
                console.log('No se pudo generar el código. ¿Deseas usar el QR mejor?');
            }
        }
    }
}

run();
