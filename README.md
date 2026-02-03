# TaskFlow: Python Full-Stack Starter

TaskFlow is a lightweight full-stack example built with Flask, SQLite, and a
polished front-end. It demonstrates how to connect a Python API to a modern UI.

## Features

- Flask API with task CRUD endpoints
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

- `GET /api/tasks` — list tasks
- `POST /api/tasks` — create a task with `{ "title": "..." }`
- `PATCH /api/tasks/<id>` — update status with `{ "status": "open|done" }`
