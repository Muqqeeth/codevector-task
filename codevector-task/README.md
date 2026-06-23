# CodeVector Backend Task

Backend service for browsing ~200,000 products with category filtering and cursor-based pagination.

## Tech Stack

* Node.js
* Express.js
* PostgreSQL (Neon)

## Features

* Cursor-based pagination
* Category filtering
* 200,000 seeded products
* Indexed queries for efficient pagination

## Setup

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL=your_neon_connection_string
PORT=3000
```

Run the server:

```bash
node index.js
```

Seed the database:

```bash
node seed.js
```

## API

Get products:

```http
GET /api/products
```

Filter by category:

```http
GET /api/products?category=Electronics
```

Get next page:

```http
GET /api/products?cursor=<cursor>
```

## Notes

* Uses cursor pagination with `(created_at, id)` ordering.
* Composite indexes are used for efficient pagination and filtering.
* Seed data is generated in batches using PostgreSQL `UNNEST`.

