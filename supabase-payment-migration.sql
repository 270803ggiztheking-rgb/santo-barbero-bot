-- Agregar columnas de pago a la tabla citas
ALTER TABLE citas 
ADD COLUMN IF NOT EXISTS payment_preference_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Crear índice para búsquedas rápidas por payment_preference_id
CREATE INDEX IF NOT EXISTS idx_citas_payment_preference 
ON citas(payment_preference_id);

-- Crear tabla para tracking de pagos (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID REFERENCES citas(id),
    preference_id TEXT,
    payment_id TEXT,
    status TEXT,
    amount DECIMAL,
    currency TEXT DEFAULT 'MXN',
    payment_method TEXT,
    payer_email TEXT,
    payer_phone TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por payment_id
CREATE INDEX IF NOT EXISTS idx_payments_payment_id 
ON payments(payment_id);
