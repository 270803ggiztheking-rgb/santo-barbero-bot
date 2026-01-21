const mercadopago = require('mercadopago');

class PaymentEngine {
    constructor() {
        this.client = null;
    }

    init(accessToken) {
        this.client = new mercadopago.MercadoPagoConfig({
            accessToken: accessToken
        });
    }

    // Crear link de pago para una cita
    async createAppointmentPayment(appointmentData) {
        try {
            const preference = new mercadopago.Preference(this.client);

            const preferenceData = {
                items: [
                    {
                        title: `${appointmentData.service} - Santo Barbero`,
                        description: `Cita: ${appointmentData.date} a las ${appointmentData.time}`,
                        quantity: 1,
                        unit_price: appointmentData.price,
                        currency_id: 'MXN'
                    }
                ],
                payer: {
                    name: appointmentData.clientName,
                    phone: {
                        number: appointmentData.clientPhone
                    }
                },
                back_urls: {
                    success: `${process.env.SHOP_URL}/payment/success`,
                    failure: `${process.env.SHOP_URL}/payment/failure`,
                    pending: `${process.env.SHOP_URL}/payment/pending`
                },
                auto_return: 'approved',
                notification_url: `${process.env.SHOP_URL}/api/payment/webhook`,
                external_reference: appointmentData.appointmentId,
                statement_descriptor: 'SANTO BARBERO'
            };

            const result = await preference.create({ body: preferenceData });

            return {
                success: true,
                paymentLink: result.init_point, // Link para pagar
                preferenceId: result.id
            };
        } catch (error) {
            console.error('Error creando pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Crear link de pago rápido (para productos)
    async createQuickPayment(productData) {
        try {
            const preference = new mercadopago.Preference(this.client);

            const preferenceData = {
                items: [
                    {
                        title: productData.name,
                        description: productData.description || '',
                        quantity: productData.quantity || 1,
                        unit_price: productData.price,
                        currency_id: 'MXN'
                    }
                ],
                payer: {
                    phone: {
                        number: productData.clientPhone
                    }
                },
                back_urls: {
                    success: `${process.env.SHOP_URL}/payment/success`,
                    failure: `${process.env.SHOP_URL}/payment/failure`,
                    pending: `${process.env.SHOP_URL}/payment/pending`
                },
                auto_return: 'approved',
                external_reference: productData.orderId || `ORDER-${Date.now()}`,
                statement_descriptor: 'SANTO BARBERO'
            };

            const result = await preference.create({ body: preferenceData });

            return {
                success: true,
                paymentLink: result.init_point,
                preferenceId: result.id
            };
        } catch (error) {
            console.error('Error creando pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Verificar estado de un pago
    async checkPaymentStatus(paymentId) {
        try {
            const payment = new mercadopago.Payment(this.client);
            const result = await payment.get({ id: paymentId });

            return {
                success: true,
                status: result.status, // approved, pending, rejected, etc.
                statusDetail: result.status_detail,
                amount: result.transaction_amount,
                paidAt: result.date_approved
            };
        } catch (error) {
            console.error('Error verificando pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Procesar webhook de MercadoPago
    async processWebhook(webhookData) {
        try {
            if (webhookData.type === 'payment') {
                const paymentId = webhookData.data.id;
                const paymentStatus = await this.checkPaymentStatus(paymentId);

                return {
                    success: true,
                    paymentId,
                    status: paymentStatus.status,
                    shouldUpdateAppointment: paymentStatus.status === 'approved'
                };
            }

            return { success: true, processed: false };
        } catch (error) {
            console.error('Error procesando webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = { PaymentEngine };
