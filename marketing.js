const { initDb } = require('./db-supabase');
const { format, subDays } = require('date-fns');

class MarketingEngine {
    constructor(whatsappClient) {
        this.client = whatsappClient;
        this.db = null;
    }

    async init() {
        this.db = await initDb();
    }

    // Enviar campaña a clientes inactivos
    async sendReactivationCampaign(daysInactive = 21, customMessage = null) {
        try {
            // Obtener clientes que no han venido en X días
            const inactiveClients = await this.db.getInactiveClients(daysInactive);

            const message = customMessage ||
                `Caballero, hace tiempo que no pasas por el Santuario. 🦅\\n\\n` +
                `El filo te espera. 20% de descuento si agendas hoy.\\n\\n` +
                `Escribe *AGENDAR* para reservar tu lugar.`;

            let sentCount = 0;
            for (const client of inactiveClients) {
                try {
                    await this.client.sendMessage(client.telefono + '@c.us', message);
                    sentCount++;
                    // Delay para no saturar
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.error(`Error enviando a ${client.telefono}:`, e.message);
                }
            }

            console.log(`📢 Campaña enviada a ${sentCount}/${inactiveClients.length} clientes`);
            return { success: true, sent: sentCount, total: inactiveClients.length };
        } catch (error) {
            console.error('Error en campaña:', error);
            return { success: false, error: error.message };
        }
    }

    // Recordatorio automático 24h antes de cita
    async sendAppointmentReminders() {
        try {
            const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            const upcomingAppointments = await this.db.getAppointmentsByDate(tomorrow);

            for (const apt of upcomingAppointments) {
                const message =
                    `🦅 *RECORDATORIO DEL SANTUARIO* 🦅\n\n` +
                    `Caballero ${apt.name}, mañana tienes cita:\n\n` +
                    `✂️ Servicio: ${apt.service}\n` +
                    `⏰ Hora: ${apt.time}\n` +
                    `💰 Precio: $${apt.price}\n\n` +
                    `Si necesitas reagendar, escribe *CANCELAR*.`;

                try {
                    await this.client.sendMessage(apt.phone + '@c.us', message);
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.error(`Error enviando recordatorio a ${apt.phone}:`, e.message);
                }
            }

            console.log(`⏰ Recordatorios enviados: ${upcomingAppointments.length}`);
            return { success: true, sent: upcomingAppointments.length };
        } catch (error) {
            console.error('Error en recordatorios:', error);
            return { success: false, error: error.message };
        }
    }

    // Mensaje de agradecimiento post-servicio
    async sendThankYouMessages() {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');

            const allToday = await this.db.getAppointmentsByDate(today);
            const completedToday = allToday.filter(apt => apt.status === 'completado');

            for (const apt of completedToday) {
                const message =
                    `Gracias por visitar el Santuario, ${apt.name}. 🦅\n\n` +
                    `Tu estilo quedó impecable. Esperamos verte pronto.\n\n` +
                    `¿Nos dejas una reseña? Comparte tu experiencia.`;

                try {
                    await this.client.sendMessage(apt.phone + '@c.us', message);
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    console.error(`Error enviando agradecimiento a ${apt.phone}:`, e.message);
                }
            }

            console.log(`🙏 Mensajes de agradecimiento enviados: ${completedToday.length}`);
            return { success: true, sent: completedToday.length };
        } catch (error) {
            console.error('Error en agradecimientos:', error);
            return { success: false, error: error.message };
        }
    }

    // Programa de referidos
    async sendReferralOffer(phone, clientName) {
        const message =
            `${clientName}, eres parte del Santuario. 🦅\n\n` +
            `Trae un amigo y *ambos* reciben 15% de descuento.\n\n` +
            `Solo menciona este mensaje al agendar.`;

        try {
            await this.client.sendMessage(phone + '@c.us', message);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Promociones especiales (cumpleaños, fechas especiales)
    async sendBirthdayPromo(phone, clientName) {
        const message =
            `¡Felicidades ${clientName}! 🎉🦅\n\n` +
            `El Santuario te regala 30% de descuento en tu cumpleaños.\n\n` +
            `Válido hoy. Escribe *AGENDAR* para reservar.`;

        try {
            await this.client.sendMessage(phone + '@c.us', message);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = { MarketingEngine };
