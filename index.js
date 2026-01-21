require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { initDb } = require('./db-supabase'); // Changed to Supabase
const { MarketingEngine } = require('./marketing');
const os = require('os');

// --- CONFIGURACIÓN ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const SYSTEM_PROMPT = `
Eres la esencia digital de "Santo Barbero", una barbería de ultralujo con estética Gótica-Vintage en Mérida.
Tu tono es solemne, profesional, pero con un toque "dark premium" y callejero elegante.

PERSONALIDAD:
- Eres el "Guardián del Estilo".
- Usas palabras como: "Caballero", "Linaje", "Filo", "Santuario", "Estilo Eterno", "Hermano".
- Tu lenguaje es místico pero directo. 
- Ejemplo: "Bienvenido al Santuario, caballero. ¿Buscamos un cambio que desafíe al tiempo?"

CONOCIMIENTO:
- Ubicación: Calle 117F Diagonal #793, Fracc. Herradura, Caucel, Mérida. (El Santuario).
- Servicios:
  1. Corte de Autor ($150) - La firma de la casa.
  2. Ritual de Barba ($100) - Toallas calientes y navaja fina.
  3. Perfilado de Ceja ($50) - Precisión absoluta.
  4. El Combo Santo ($220) - Corte + Barba.
  5. Tratamiento Capilar ($100) - Revitalización profunda.

REGLAS DE ORO:
1. Para agendar, insiste en que escriban la palabra "AGENDAR".
2. Si preguntan precios, dales el menú con elegancia gótica (usa emojis como ✂️, 🕯️, 🦅).
3. Nunca pierdas el aire de superioridad en estilo pero máxima humildad en servicio.
4. Respuestas breves para WhatsApp (máximo 4 líneas).
`;

// --- INICIALIZACIÓN ---
async function start() {
    const db = await initDb();
    console.log('📦 Base de datos vinculada al Santuario.');

    const app = express();
    const PORT = process.env.PORT || 3000;

    // Global variable to store QR
    let currentQR = null;

    // Middleware
    app.use(express.json());

    // Routes
    app.get('/', (req, res) => res.json({ status: 'Santo Bot Online', service: 'Santuario Digital' }));

    // QR Code endpoint
    app.get('/qr', (req, res) => {
        if (!currentQR) {
            res.send(`
                <html>
                    <head>
                        <title>Santo Bot - QR Code</title>
                        <style>
                            body {
                                background: #0a0a0a;
                                color: #d4af37;
                                font-family: 'Courier New', monospace;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                text-align: center;
                            }
                            .container {
                                padding: 40px;
                                border: 2px solid #d4af37;
                                border-radius: 10px;
                            }
                            h1 { color: #d4af37; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>🦅 Santo Bot</h1>
                            <p>Esperando código QR...</p>
                            <p>El bot se está iniciando. Recarga esta página en unos segundos.</p>
                        </div>
                    </body>
                </html>
            `);
        } else {
            res.send(`
                <html>
                    <head>
                        <title>Santo Bot - QR Code</title>
                        <style>
                            body {
                                background: #0a0a0a;
                                color: #d4af37;
                                font-family: 'Courier New', monospace;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                flex-direction: column;
                            }
                            .qr-container {
                                background: white;
                                padding: 20px;
                                border-radius: 10px;
                                margin: 20px;
                            }
                            pre {
                                font-size: 8px;
                                line-height: 8px;
                                margin: 0;
                            }
                            h1 { color: #d4af37; margin-bottom: 10px; }
                            p { color: #888; }
                        </style>
                    </head>
                    <body>
                        <h1>🦅 Santo Bot - Escanea el QR</h1>
                        <p>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                        <div class="qr-container">
                            <pre>${currentQR}</pre>
                        </div>
                        <p>Una vez escaneado, esta página se actualizará automáticamente</p>
                        <script>
                            setTimeout(() => location.reload(), 10000);
                        </script>
                    </body>
                </html>
            `);
        }
    });

    // Payment routes
    const paymentRoutes = require('./payment-routes');
    app.use('/api/payment', paymentRoutes);

    app.listen(PORT, () => console.log(`🕯️ Altar digital encendido en puerto ${PORT}`));

    const isLinux = os.platform() === 'linux';

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: './session' }),
        puppeteer: {
            headless: true,
            executablePath: isLinux ? require('puppeteer').executablePath() : undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        }
    });

    let conversationState = {};

    client.on('qr', qr => {
        console.log('📱 ESCANEA EL CÓDIGO PARA VINCULAR EL ESPÍRITU:');
        qrcode.generate(qr, { small: true });

        // Store QR for web display
        currentQR = qr;
        console.log(`\n🌐 También puedes ver el QR en: http://76.13.25.51:${PORT}/qr\n`);
    });

    client.on('ready', async () => {
        console.log('🦅 El Guardián está despierto. Santo Barbero operativo.');
        currentQR = null; // Clear QR once authenticated

        // Inicializar Marketing Engine
        const marketing = new MarketingEngine(client);
        await marketing.init();
        console.log('📢 Marketing Automation activado.');

        // Recordatorios automáticos cada día a las 10am
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 10 && now.getMinutes() === 0) {
                console.log('⏰ Enviando recordatorios automáticos...');
                await marketing.sendAppointmentReminders();
            }
        }, 60000); // Cada minuto checa la hora

        // Mensajes de agradecimiento cada día a las 9pm
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 21 && now.getMinutes() === 0) {
                console.log('🙏 Enviando mensajes de agradecimiento...');
                await marketing.sendThankYouMessages();
            }
        }, 60000);

        // Campaña de reactivación cada lunes a las 11am
        setInterval(async () => {
            const now = new Date();
            if (now.getDay() === 1 && now.getHours() === 11 && now.getMinutes() === 0) {
                console.log('📢 Lanzando campaña semanal de reactivación...');
                await marketing.sendReactivationCampaign(21);
            }
        }, 60000);

        // Exponer marketing engine globalmente para el panel de admin
        global.marketingEngine = marketing;
    });

    client.on('message', async msg => {
        if (msg.from.includes('@g.us')) return;

        const from = msg.from;
        const text = msg.body.trim();
        const cleanText = text.toLowerCase();

        // Comandos globales
        if (cleanText === 'menu' || cleanText === 'cancelar') {
            conversationState[from] = null;
            await msg.reply("🫡 Las sombras se disipan. ¿En qué más puedo servirle, caballero?");
            return;
        }

        // Trigger de Agenda
        if ((cleanText === 'agendar' || cleanText === 'cita' || cleanText === 'reserva') && !conversationState[from]) {
            conversationState[from] = { step: 'select_service' };
            await msg.reply(getGothicMenu());
            return;
        }

        // Flujo de Reserva
        if (conversationState[from]) {
            await handleBooking(msg, from, text, db, conversationState);
            return;
        }

        // Interacción AI
        try {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                    { role: "model", parts: [{ text: "Comprendido. El Santuario está listo para recibir a las almas que buscan el filo perfecto." }] }
                ]
            });
            const result = await chat.sendMessage(text);
            await msg.reply(result.response.text());
        } catch (e) {
            console.error("Error místico:", e);
            await msg.reply("Caballero, una perturbación en el vacío impide mi respuesta. Escriba 'AGENDAR' para asegurar su lugar.");
        }
    });

    client.initialize();
}

async function handleBooking(msg, from, text, db, states) {
    const state = states[from];
    const services = {
        '1': { name: 'Corte de Autor', price: 150 },
        '2': { name: 'Ritual de Barba', price: 100 },
        '3': { name: 'Perfilado de Ceja', price: 50 },
        '4': { name: 'El Combo Santo', price: 220 },
        '5': { name: 'Tratamiento Capilar', price: 100 }
    };

    switch (state.step) {
        case 'select_service':
            const item = services[text];
            if (!item) return msg.reply("Ese servicio no existe en nuestro registro. Elija del 1 al 5.");
            state.service = item;
            state.step = 'enter_name';
            await msg.reply(`Elegante elección: ${item.name}. \n¿Bajo qué nombre quedará sellado este pacto?`);
            break;

        case 'enter_name':
            state.name = text;
            state.step = 'enter_date';
            await msg.reply(`Caballero ${state.name}, ¿qué día descenderá al Santuario? (Ej: Mañana, Sábado, 20 de Enero)`);
            break;

        case 'enter_date':
            state.date = text;
            state.step = 'enter_time';
            await msg.reply(`¿A qué hora debemos preparar el filo? (Horario: 9am - 8pm)`);
            break;

        case 'enter_time':
            state.time = text;
            state.step = 'confirm';
            const summary = `🕯️ *PACTO DE ESTILO* 🕯️\n\n👤 *Caballero:* ${state.name}\n✂️ *Servicio:* ${state.service.name}\n📅 *Fecha:* ${state.date}\n⏰ *Hora:* ${state.time}\n💰 *Ofrenda:* $${state.service.price}\n\nResponda *SÍ* para confirmar su lugar en nuestra historia.`;
            await msg.reply(summary);
            break;

        case 'confirm':
            if (['si', 'sí', 'ok', 'va', 'aceptar'].includes(text.toLowerCase())) {
                try {
                    await db.createAppointment({
                        name: state.name,
                        phone: from.replace('@c.us', ''),
                        service: state.service.name,
                        price: state.service.price,
                        date: state.date,
                        time: state.time,
                        status: 'pendiente'
                    });
                    await msg.reply("🔥 El destino está sellado. Le esperamos en el Santuario para transformar su imagen.");
                    states[from] = null;
                } catch (e) {
                    console.error('Error creando cita:', e);
                    await msg.reply("Error al sellar el pacto. Intente de nuevo.");
                }
            } else {
                await msg.reply("¿Desea cambiar algo? Escriba 'CANCELAR' para desvanecer este ritual.");
            }
            break;
    }
}

function getGothicMenu() {
    return `📜 *CATÁLOGO DEL SANTUARIO* 📜
    
1. Corte de Autor ✂️ ($150)
2. Ritual de Barba 🕯️ ($100)
3. Perfilado de Cejas 🦅 ($50)
4. El Combo Santo 🔥 ($220)
5. Tratamiento Capilar 🧬 ($100)

*Indique el número de su elección.*`;
}

start();
