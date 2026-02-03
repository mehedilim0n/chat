from __future__ import annotations

import sqlite3
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data.db"

app = Flask(__name__)


@dataclass
class Task:
    id: int
    title: str
    status: str


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'open'
            )
            """
        )


def row_to_task(row: sqlite3.Row) -> Task:
    return Task(id=row["id"], title=row["title"], status=row["status"])


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.get("/api/tasks")
def list_tasks() -> Any:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, title, status FROM tasks ORDER BY id DESC"
        ).fetchall()
    tasks = [asdict(row_to_task(row)) for row in rows]
    return jsonify({"tasks": tasks})


@app.post("/api/tasks")
def create_task() -> Any:
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Title is required."}), 400

    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO tasks (title, status) VALUES (?, ?)",
            (title, "open"),
        )
        task_id = cursor.lastrowid

        row = connection.execute(
            "SELECT id, title, status FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

    task = asdict(row_to_task(row))
    return jsonify(task), 201


@app.patch("/api/tasks/<int:task_id>")
def update_task(task_id: int) -> Any:
    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip().lower()
    if status not in {"open", "done"}:
        return jsonify({"error": "Status must be 'open' or 'done'."}), 400

    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET status = ? WHERE id = ?",
            (status, task_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Task not found."}), 404

        row = connection.execute(
            "SELECT id, title, status FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

    task = asdict(row_to_task(row))
    return jsonify(task)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000, debug=True)
