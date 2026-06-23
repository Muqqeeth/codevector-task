require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
app.use(express.static('public'));
app.get('/api/products', async (req, res) => {
  try {
    const category = req.query.category;
    const cursor = req.query.cursor;
    const limit = 20;


    let decoded = null;
    if (cursor) {
      decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    }

   
    let whereClause = '';
    const params = [];

    if (category && decoded) {
      whereClause = 'WHERE category = $1 AND (created_at, id) < ($2::timestamptz, $3::int)';
      params.push(category);
      params.push(decoded.created_at);
      params.push(decoded.id);
    } else if (category) {
      whereClause = 'WHERE category = $1';
      params.push(category);
    } else if (decoded) {
      whereClause = 'WHERE (created_at, id) < ($1::timestamptz, $2::int)';
      params.push(decoded.created_at);
      params.push(decoded.id);
    }

    
    params.push(limit + 1);
    const limitParam = '$' + params.length;

    const result = await pool.query(
      'SELECT id, name, category, price, created_at, updated_at FROM products ' +
      whereClause +
      ' ORDER BY created_at DESC, id DESC LIMIT ' + limitParam,
      params
    );

    const rows = result.rows;

   
    const hasMore = rows.length > limit;

   
    if (hasMore) {
      rows.pop();
    }

  
    let nextCursor = null;
    if (rows.length > 0) {
      const lastProduct = rows[rows.length - 1];
      const bookmarkObject = { created_at: lastProduct.created_at, id: lastProduct.id };
      nextCursor = Buffer.from(JSON.stringify(bookmarkObject)).toString('base64');
    }

    res.json({
      data: rows,
      nextCursor: nextCursor,
      hasMore: hasMore
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});