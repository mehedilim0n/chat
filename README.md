# Asian Deli Admin Panel

Asian Deli Admin Panel is a lightweight full-stack example built with Flask,
SQLite, and a tablet-ready front-end. It demonstrates how to connect a Python API
to a restaurant operations UI.

## Features

- Flask API with order CRUD endpoints
- SQLite persistence
- Responsive, single-page UI

## Getting started

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install flask
   ```

2. Run the application:

   ```bash
   python app.py
   ```

3. Visit http://localhost:8000 in your browser.

## API endpoints

- `GET /api/orders` — list orders
- `POST /api/orders` — create an order with `{ "table_number": 3, "items": "...", "placed_at": "12:30 PM" }`
- `PATCH /api/orders/<id>` — update status with `{ "status": "new|in-progress|ready|completed" }`
