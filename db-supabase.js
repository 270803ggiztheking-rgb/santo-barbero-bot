const { supabase } = require('./supabaseClient');

// Capa de abstracción de base de datos que usa Supabase
class SupabaseDB {
    // Appointments (Citas)
    async getAllAppointments() {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return this.mapCitasToAppointments(data);
    }

    async getAppointmentsByDate(date) {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .eq('fecha', date);

        if (error) throw error;
        return this.mapCitasToAppointments(data);
    }

    async createAppointment(appointment) {
        const citaData = {
            barberia_id: '00000000-0000-0000-0000-000000000000',
            barbero_id: '00000000-0000-0000-0000-000000000000',
            servicio_id: '00000000-0000-0000-0000-000000000000',
            cliente_nombre: appointment.name,
            cliente_telefono: appointment.phone,
            fecha: appointment.date,
            hora_inicio: appointment.time,
            precio_final: appointment.price,
            estado: appointment.status || 'pendiente',
        };

        const { data, error } = await supabase
            .from('citas')
            .insert([citaData])
            .select();

        if (error) throw error;

        // Actualizar o crear cliente
        await this.upsertClient({
            phone: appointment.phone,
            name: appointment.name
        });

        return this.mapCitasToAppointments(data)[0];
    }

    async updateAppointmentStatus(id, status) {
        const { data, error } = await supabase
            .from('citas')
            .update({ estado: status })
            .eq('id', id)
            .select();

        if (error) throw error;
        return this.mapCitasToAppointments(data)[0];
    }

    // Clients (Clientes)
    async getAllClients() {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('ultima_visita', { ascending: false });

        if (error) {
            // Si la tabla no existe, retornar array vacío
            if (error.code === '42P01') return [];
            throw error;
        }
        return data;
    }

    async getClientByPhone(phone) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('telefono', phone)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async upsertClient(client) {
        const clientData = {
            telefono: client.phone,
            nombre: client.name,
            ultima_visita: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('clientes')
            .upsert([clientData], { onConflict: 'telefono' })
            .select();

        if (error) {
            // Si la tabla no existe, solo logear el error
            if (error.code === '42P01') {
                console.log('Tabla clientes no existe aún. Saltando...');
                return null;
            }
            throw error;
        }
        return data[0];
    }

    async getInactiveClients(daysSince) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSince);

        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .lt('ultima_visita', cutoffDate.toISOString());

        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }
        return data;
    }

    // Stats
    async getStats() {
        const today = new Date().toISOString().split('T')[0];

        const [totalCitas, citasHoy, totalClientes] = await Promise.all([
            supabase.from('citas').select('*', { count: 'exact', head: true }),
            supabase.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', today),
            supabase.from('clientes').select('*', { count: 'exact', head: true })
        ]);

        const { data: ingresos } = await supabase
            .from('citas')
            .select('precio_final')
            .eq('estado', 'completado');

        const totalRevenue = ingresos?.reduce((sum, c) => sum + (c.precio_final || 0), 0) || 0;

        return {
            totalAppointments: totalCitas.count || 0,
            todayAppointments: citasHoy.count || 0,
            totalClients: totalClientes.count || 0,
            totalRevenue
        };
    }

    // Mappers
    mapCitasToAppointments(citas) {
        if (!citas) return [];
        return citas.map(c => ({
            id: c.id,
            name: c.cliente_nombre,
            phone: c.cliente_telefono,
            service: c.servicio_id, // TODO: lookup real service name
            price: c.precio_final,
            date: c.fecha,
            time: c.hora_inicio,
            status: c.estado,
            created_at: c.created_at
        }));
    }

    // Legacy methods for compatibility
    async run(query, params) {
        console.warn('Legacy db.run() called - implement specific Supabase method');
        return null;
    }

    async get(query, params) {
        console.warn('Legacy db.get() called - implement specific Supabase method');
        return null;
    }

    async all(query, params) {
        console.warn('Legacy db.all() called - implement specific Supabase method');
        return [];
    }
}

async function initDb() {
    const db = new SupabaseDB();
    console.log('✅ Supabase DB initialized');
    return db;
}

module.exports = { initDb, SupabaseDB };
