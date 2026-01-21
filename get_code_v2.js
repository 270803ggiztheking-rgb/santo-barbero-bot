const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session_pairing' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let attempts = 0;
const phoneNumber = '529992235292';

client.on('qr', async (qr) => {
    console.log('--- EVENTO QR DETECTADO ---');
    if (attempts === 0) {
        attempts++;
        console.log('Solicitando código de vinculación para:', phoneNumber);

        // Un delay progresivo para dejar que el sistema asiente
        for (let i = 1; i <= 3; i++) {
            const phoneVariants = ['529992235292', '5219992235292'];
            const trialNumber = phoneVariants[i % 2];
            console.log(`Intento ${i} de obtener el código para ${trialNumber}...`);
            await new Promise(r => setTimeout(r, 10000 * i));
            try {
                const code = await client.requestPairingCode(trialNumber);
                if (code) {
                    console.log('\n******************************************');
                    console.log('🔥 TU CÓDIGO DE 8 DÍGITOS ES:', code);
                    console.log('******************************************\n');
                    return;
                }
            } catch (e) {
                console.log(`Fallo en intento ${i}:`, e.message);
            }
        }

        console.log('\n❌ No se pudo generar el código después de varios intentos.');
        console.log('Por favor, escanea el QR a continuación para no perder más tiempo:');
        qrcode.generate(qr, { small: true });
    }
});

client.on('ready', () => {
    console.log('🚀 Vinculación exitosa. El Bot está listo.');
    process.exit(0);
});

console.log('Iniciando proceso de vinculación...');
client.initialize();
