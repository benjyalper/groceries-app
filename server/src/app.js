import express from 'express';
import cors from 'cors';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import { pool } from './db.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/** -------- API -------- **/

// כל המוצרים (עם מצב "נמצא ברשימה" כדי לאפר פריטים שנבחרו)
app.get('/api/items', async (req, res) => {
    const { rows: items } = await pool.query(
        `SELECT g.id, g.name_he, g.category, g.default_price_ils,
            CASE WHEN li.grocery_id IS NULL THEN false ELSE true END AS in_list
     FROM groceries g
     LEFT JOIN list_items li ON li.grocery_id = g.id
     ORDER BY g.category, g.name_he;`
    );
    res.json(items);
});

// קבלת הרשימה הנוכחית
app.get('/api/list', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT li.id, li.grocery_id, g.name_he, g.category, li.price_ils
     FROM list_items li
     JOIN groceries g ON g.id = li.grocery_id
     ORDER BY g.category, g.name_he;`
    );
    res.json(rows);
});

// הוספת פריט לרשימה
app.post('/api/list', async (req, res) => {
    const { grocery_id, price_ils } = req.body;
    if (!grocery_id) return res.status(400).json({ error: 'grocery_id חסר' });

    // אם לא נשלח מחיר – נמשוך את ברירת המחדל
    let price = price_ils;
    if (price === undefined || price === null) {
        const { rows } = await pool.query(
            `SELECT default_price_ils FROM groceries WHERE id=$1`, [grocery_id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'לא נמצא מוצר' });
        price = rows[0].default_price_ils;
    }

    // הוספה (מוגן UNIQUE)
    const { rows } = await pool.query(
        `INSERT INTO list_items (grocery_id, price_ils)
     VALUES ($1, $2)
     ON CONFLICT (grocery_id) DO NOTHING
     RETURNING *;`,
        [grocery_id, price]
    );
    if (!rows[0]) return res.status(200).json({ message: 'כבר קיים ברשימה' });
    res.status(201).json(rows[0]);
});

// עדכון מחיר של פריט ברשימה
app.patch('/api/list/:id', async (req, res) => {
    const { id } = req.params;
    const { price_ils } = req.body;
    if (price_ils === undefined) return res.status(400).json({ error: 'price_ils חסר' });

    const { rows } = await pool.query(
        `UPDATE list_items SET price_ils=$1 WHERE id=$2 RETURNING *;`,
        [price_ils, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'פריט לא נמצא' });
    res.json(rows[0]);
});

// מחיקת פריט מהרשימה
app.delete('/api/list/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query(`DELETE FROM list_items WHERE id=$1;`, [id]);
    res.json({ ok: true });
});

/** -------- סטטי: נגיש את ה-React build דרך השרת -------- **/
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../client-dist');

app.use(express.static(clientDist));
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on :${PORT}`);
});
