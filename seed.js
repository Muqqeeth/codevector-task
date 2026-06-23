require('dotenv').config();
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Food', 'Toys'];
const BATCH_SIZE = 5000;
const TOTAL = 200000;

async function seed() {
  console.log('Creating table...');

  await pool.query(`
    DROP TABLE IF EXISTS products;

    CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_products_cursor 
      ON products (created_at DESC, id DESC);

    CREATE INDEX idx_products_category_cursor 
      ON products (category, created_at DESC, id DESC);
  `);

  console.log('Table created. Starting seed...');

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const names = [];
    const categories = [];
    const prices = [];
    const dates = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      names.push(faker.commerce.productName());
      categories.push(CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]);
      prices.push(faker.commerce.price({ min: 1, max: 9999 }));
      dates.push(faker.date.past({ years: 2 }).toISOString());
    }

    await pool.query(`
      INSERT INTO products (name, category, price, created_at, updated_at)
      SELECT * FROM unnest(
        $1::text[], 
        $2::text[], 
        $3::numeric[], 
        $4::timestamptz[], 
        $4::timestamptz[]
      )
    `, [names, categories, prices, dates]);

    console.log(`Inserted ${Math.min(i + BATCH_SIZE, TOTAL)} / ${TOTAL}`);
  }

  console.log('Done!');
  await pool.end();
}

seed().catch(console.error);
