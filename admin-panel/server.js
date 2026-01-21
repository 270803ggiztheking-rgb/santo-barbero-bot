require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Dashboard principal
app.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Stats generales usando Supabase
        const { count: totalAppointments } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true });

        const { count: todayAppointments } = await supabase
            .from('citas')
            .select('*', { count: 'exact', head: true })
            .eq('fecha', today);

        const { count: totalClients } = await supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true });

        const { data: completedCitas } = await supabase
            .from('citas')
            .select('precio_final')
            .eq('estado', 'completado');

        const totalRevenue = completedCitas?.reduce((sum, c) => sum + (c.precio_final || 0), 0) || 0;

        // Citas recientes
        const { data: recentCitas } = await supabase
            .from('citas')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        // Mapear a formato esperado por la vista
        const recentAppointments = recentCitas?.map(c => ({
            id: c.id,
            name: c.cliente_nombre,
            phone: c.cliente_telefono,
            service: 'Servicio', // TODO: lookup real service name
            price: c.precio_final,
            date: c.fecha,
            time: c.hora_inicio,
            status: c.estado,
            created_at: c.created_at
        })) || [];

        // Ingresos por día (últimos 7 días)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentCitas7Days } = await supabase
            .from('citas')
            .select('fecha, precio_final')
            .gte('created_at', sevenDaysAgo.toISOString());

        // Agrupar por día
        const revenueByDay = {};
        recentCitas7Days?.forEach(c => {
            if (!revenueByDay[c.fecha]) {
                revenueByDay[c.fecha] = { day: c.fecha, revenue: 0, count: 0 };
            }
            revenueByDay[c.fecha].revenue += c.precio_final || 0;
            revenueByDay[c.fecha].count += 1;
        });

        res.render('dashboard', {
            stats: {
                totalAppointments: totalAppointments || 0,
                todayAppointments: todayAppointments || 0,
                totalClients: totalClients || 0,
                totalRevenue
            },
            recentAppointments,
            revenueByDay: Object.values(revenueByDay)
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar dashboard: ' + error.message);
    }
});

// API: Obtener todas las citas
app.get('/api/appointments', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Actualizar estado de cita
app.post('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { error } = await supabase
            .from('citas')
            .update({ estado: status })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Clientes
app.get('/api/clients', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('ultima_visita', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Enviar campaña de marketing
app.post('/api/marketing/campaign', async (req, res) => {
    try {
        const { message, targetDays } = req.body;

        if (!global.marketingEngine) {
            return res.status(503).json({ error: 'Marketing engine no disponible. Asegúrate de que el bot esté corriendo.' });
        }

        const result = await global.marketingEngine.sendReactivationCampaign(
            targetDays || 21,
            message
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Enviar recordatorios manualmente
app.post('/api/marketing/reminders', async (req, res) => {
    try {
        if (!global.marketingEngine) {
            return res.status(503).json({ error: 'Marketing engine no disponible' });
        }

        const result = await global.marketingEngine.sendAppointmentReminders();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🎨 Panel de Admin corriendo en http://localhost:${PORT}`);
    console.log(`✅ Conectado a Supabase`);
});
