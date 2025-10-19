import { pool } from './db.js';
import { ALL_ITEMS } from './items.js';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function run() {
    const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
    await pool.query(schema);

    // הכנסה בטוחה עם ON CONFLICT
    for (const item of ALL_ITEMS) {
        await pool.query(
            `INSERT INTO groceries (name_he, category, default_price_ils)
       VALUES ($1, $2, $3)
       ON CONFLICT (name_he) DO UPDATE SET category=EXCLUDED.category, default_price_ils=EXCLUDED.default_price_ils;`,
            [item.name_he, item.category, item.default_price_ils]
        );
    }
    console.log(`Seeded ${ALL_ITEMS.length} groceries.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
