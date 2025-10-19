import React, { useEffect, useMemo, useState } from 'react';
import { fetchItems, fetchList, addToList, updatePrice, removeFromList } from './api.js';

function randomPastel(seed) {
    // צבע רנדומלי (פסטלי) יציב לפי id (שומר אחידות בין רנדרים)
    const x = Math.sin(seed) * 10000;
    const hue = Math.floor((x - Math.floor(x)) * 360);
    return `hsl(${hue} 70% 80%)`;
}

export default function App() {
    const [items, setItems] = useState([]); // כל המוצרים + in_list
    const [list, setList] = useState([]);   // הפריטים שנבחרו בפועל
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const [all, current] = await Promise.all([fetchItems(), fetchList()]);
        setItems(all);
        setList(current);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    const itemsByCat = useMemo(() => {
        const map = new Map();
        for (const it of items) {
            if (!map.has(it.category)) map.set(it.category, []);
            map.get(it.category).push(it);
        }
        return Array.from(map.entries());
    }, [items]);

    const listIds = useMemo(() => new Set(list.map(x => x.grocery_id)), [list]);
    const total = useMemo(() => list.reduce((s, x) => s + Number(x.price_ils || 0), 0), [list]);

    async function onAdd(it) {
        if (listIds.has(it.id)) return;
        await addToList(it.id, it.default_price_ils);
        await load();
    }

    async function onRemove(row) {
        await removeFromList(row.id);
        await load();
    }

    async function onEditPrice(row, newVal) {
        const val = Number(newVal);
        if (Number.isNaN(val) || val < 0) return;
        await updatePrice(row.id, val);
        setList(prev => prev.map(r => r.id === row.id ? { ...r, price_ils: val } : r));
    }

    if (loading) return <div className="container"><p>טוען…</p></div>;

    return (
        <div className="container">
            <div className="header">
                <h1>רשימת קניות 🛒</h1>
                <div className="hint">לחץ/י על מוצר כדי להוסיף לרשימה. ניתן לערוך מחיר ולמחוק פריטים.</div>
            </div>

            <div className="content">
                {/* מטריצה */}
                <div className="panel">
                    <div className="matrix" role="list">
                        {itemsByCat.map(([cat, arr]) => (
                            <React.Fragment key={cat}>
                                <div className="category">{cat}</div>
                                {arr.map((it) => {
                                    const disabled = listIds.has(it.id) || it.in_list;
                                    return (
                                        <button
                                            key={it.id}
                                            className={`item-btn ${disabled ? 'disabled' : ''}`}
                                            style={{ background: randomPastel(it.id) }}
                                            onClick={() => !disabled && onAdd(it)}
                                            aria-disabled={disabled}
                                            title={disabled ? 'כבר ברשימה' : 'הוסף לרשימה'}
                                        >
                                            {it.name_he}
                                        </button>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* רשימה */}
                <div className="panel list">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>קטגוריה</th>
                                <th>שם</th>
                                <th>מחיר (₪)</th>
                                <th>מחיקה</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(row => (
                                <tr key={row.id}>
                                    <td>{row.category}</td>
                                    <td>{row.name_he}</td>
                                    <td>
                                        <input
                                            type="number"
                                            className="price-input"
                                            value={row.price_ils}
                                            onChange={e => onEditPrice(row, e.target.value)}
                                            min="0" step="0.5"
                                        />
                                    </td>
                                    <td>
                                        <button className="del-btn" onClick={() => onRemove(row)}>מחק</button>
                                    </td>
                                </tr>
                            ))}
                            {list.length === 0 && (
                                <tr><td colSpan="4" style={{ color: "#6b7280" }}>הרשימה ריקה</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="total">
                        <div>סה״כ משוער</div>
                        <div>{total.toFixed(2)} ₪</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
