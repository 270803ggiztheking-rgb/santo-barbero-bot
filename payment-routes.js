const express = require('express');
const { PaymentEngine } = require('./payments');
const { supabase } = require('./supabaseClient');

const router = express.Router();
const paymentEngine = new PaymentEngine();

// Inicializar con access token de MercadoPago
if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    paymentEngine.init(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

// Crear link de pago para una cita
router.post('/appointment/create', async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Obtener datos de la cita desde Supabase
        const { data: cita, error } = await supabase
            .from('citas')
            .select('*')
            .eq('id', appointmentId)
            .single();

        if (error || !cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        const paymentData = {
            service: 'Servicio de Barbería', // TODO: lookup real service name
            price: cita.precio_final,
            date: cita.fecha,
            time: cita.hora_inicio,
            clientName: cita.cliente_nombre,
            clientPhone: cita.cliente_telefono,
            appointmentId: cita.id
        };

        const result = await paymentEngine.createAppointmentPayment(paymentData);

        if (result.success) {
            // Guardar preference_id en la cita
            await supabase
                .from('citas')
                .update({
                    payment_preference_id: result.preferenceId,
                    payment_status: 'pending'
                })
                .eq('id', appointmentId);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear link de pago rápido (productos)
router.post('/product/create', async (req, res) => {
    try {
        const { name, price, quantity, description, clientPhone } = req.body;

        const result = await paymentEngine.createQuickPayment({
            name,
            price,
            quantity: quantity || 1,
            description,
            clientPhone,
            orderId: `PROD-${Date.now()}`
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('📢 Webhook recibido:', webhookData);

        const result = await paymentEngine.processWebhook(webhookData);

        if (result.shouldUpdateAppointment) {
            // Buscar cita por payment_id y actualizar estado
            const { data: citas } = await supabase
                .from('citas')
                .select('*')
                .eq('payment_preference_id', webhookData.data.id);

            if (citas && citas.length > 0) {
                await supabase
                    .from('citas')
                    .update({
                        payment_status: 'approved',
                        estado: 'confirmado'
                    })
                    .eq('id', citas[0].id);

                console.log(`✅ Pago aprobado para cita ${citas[0].id}`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verificar estado de pago
router.get('/status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const result = await paymentEngine.checkPaymentStatus(paymentId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
