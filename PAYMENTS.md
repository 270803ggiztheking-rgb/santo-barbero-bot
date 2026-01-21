# 💰 Sistema de Pagos - Santo Barbero

## Configuración de MercadoPago

### 1. Obtener Credenciales

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.mx/developers/panel)
2. Crea una aplicación o usa una existente
3. Copia tu **Access Token** (producción o prueba)

### 2. Configurar Variables de Entorno

Agrega a tu `.env`:

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui
SHOP_URL=https://santobarbero.com.mx
```

---

## Endpoints Disponibles

### 1. Crear Pago para Cita

**POST** `/api/payment/appointment/create`

```json
{
  "appointmentId": "uuid-de-la-cita"
}
```

**Respuesta:**

```json
{
  "success": true,
  "paymentLink": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=...",
  "preferenceId": "123456789-abc..."
}
```

### 2. Crear Pago Rápido (Productos)

**POST** `/api/payment/product/create`

```json
{
  "name": "Cera para Cabello Premium",
  "price": 250,
  "quantity": 2,
  "description": "Cera de alta fijación",
  "clientPhone": "5219991234567"
}
```

**Respuesta:**

```json
{
  "success": true,
  "paymentLink": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=...",
  "preferenceId": "123456789-abc..."
}
```

### 3. Verificar Estado de Pago

**GET** `/api/payment/status/:paymentId`

**Respuesta:**

```json
{
  "success": true,
  "status": "approved",
  "statusDetail": "accredited",
  "amount": 500,
  "paidAt": "2026-01-16T12:00:00Z"
}
```

### 4. Webhook (MercadoPago lo llama automáticamente)

**POST** `/api/payment/webhook`

Este endpoint recibe notificaciones de MercadoPago cuando cambia el estado de un pago.

---

## Integración con WhatsApp Bot

### Flujo de Pago con Cita

```javascript
// En el bot, después de confirmar la cita:
const citaId = '...'; // ID de la cita creada

// Crear link de pago
const response = await fetch('http://localhost:3000/api/payment/appointment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId: citaId })
});

const { paymentLink } = await response.json();

// Enviar link al cliente por WhatsApp
await msg.reply(
    `🔥 Tu cita está reservada, caballero.\n\n` +
    `Para confirmarla, realiza el pago aquí:\n${paymentLink}\n\n` +
    `Una vez pagado, recibirás confirmación automática.`
);
```

### Flujo de Venta de Productos

```javascript
// Cliente: "Quiero comprar la cera"
const response = await fetch('http://localhost:3000/api/payment/product/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'Cera Premium Santo Barbero',
        price: 250,
        quantity: 1,
        description: 'Cera de alta fijación con aroma a cedro',
        clientPhone: from.replace('@c.us', '')
    })
});

const { paymentLink } = await response.json();

await msg.reply(
    `🦅 Excelente elección.\n\n` +
    `Cera Premium: $250 MXN\n\n` +
    `Paga aquí: ${paymentLink}\n\n` +
    `Envío gratis en Mérida.`
);
```

---

## Configurar Webhook en MercadoPago

1. Ve a tu aplicación en [MercadoPago Developers](https://www.mercadopago.com.mx/developers/panel)
2. En "Webhooks", agrega:

   ```
   https://santobarbero.com.mx/api/payment/webhook
   ```

   o si usas IP:

   ```
   http://76.13.25.51:3000/api/payment/webhook
   ```

3. Selecciona eventos:
   - `payment` (pagos)
   - `merchant_order` (órdenes)

---

## Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `pending` | Pago pendiente |
| `approved` | Pago aprobado ✅ |
| `authorized` | Pago autorizado (captura pendiente) |
| `in_process` | En proceso |
| `in_mediation` | En mediación |
| `rejected` | Rechazado ❌ |
| `cancelled` | Cancelado |
| `refunded` | Reembolsado |
| `charged_back` | Contracargo |

---

## Actualizar Supabase

Agrega columnas a la tabla `citas`:

```sql
ALTER TABLE citas 
ADD COLUMN payment_preference_id TEXT,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN payment_id TEXT,
ADD COLUMN paid_at TIMESTAMP;
```

---

## Testing

### Modo Sandbox (Pruebas)

1. Usa el **Access Token de prueba** en `.env`
2. Tarjetas de prueba de MercadoPago:

**Aprobada:**

- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura

**Rechazada:**

- Número: `5031 4332 1540 6351`
- CVV: `123`
- Fecha: Cualquier fecha futura

### Probar Webhook Localmente

Usa [ngrok](https://ngrok.com/) para exponer tu localhost:

```bash
ngrok http 3000
```

Luego configura el webhook con la URL de ngrok:

```
https://abc123.ngrok.io/api/payment/webhook
```

---

## Seguridad

1. **Nunca compartas** tu Access Token de producción
2. **Valida webhooks** usando la firma de MercadoPago
3. **Usa HTTPS** en producción
4. **Verifica pagos** en el servidor, nunca confíes solo en el cliente

---

## Próximos Pasos

1. ✅ Configurar Access Token de MercadoPago
2. ✅ Actualizar tabla `citas` en Supabase
3. ✅ Configurar webhook en MercadoPago
4. ✅ Integrar con el bot de WhatsApp
5. ✅ Probar con tarjetas de prueba
6. ✅ Deploy al VPS
7. ✅ Activar modo producción

---

**RICO O MUERTO** 💀💰🔥
