const { initDb } = require('./db');

async function list() {
    const db = await initDb();
    const rows = await db.all('SELECT * FROM appointments ORDER BY created_at DESC');

    console.log('\n--- 📅 CITAS EN EL SANTUARIO ---');
    if (rows.length === 0) {
        console.log('No hay pactos sellados aún.');
    } else {
        rows.forEach(r => {
            console.log(`[${r.created_at}] ${r.name} - ${r.service} - ${r.date} @ ${r.time} (${r.phone})`);
        });
    }
    console.log('--------------------------------\n');
}

list();
