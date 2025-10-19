-- יצירת טבלאות
CREATE TABLE IF NOT EXISTS groceries (
  id SERIAL PRIMARY KEY,
  name_he TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_price_ils NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS list_items (
  id SERIAL PRIMARY KEY,
  grocery_id INT NOT NULL REFERENCES groceries(id) ON DELETE CASCADE,
  price_ils NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (grocery_id)
);
