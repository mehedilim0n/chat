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
class Order:
    id: int
    table_number: int
    items: str
    status: str
    placed_at: str


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_number INTEGER NOT NULL,
                items TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                placed_at TEXT NOT NULL
            )
            """
        )


def row_to_order(row: sqlite3.Row) -> Order:
    return Order(
        id=row["id"],
        table_number=row["table_number"],
        items=row["items"],
        status=row["status"],
        placed_at=row["placed_at"],
    )


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.get("/api/orders")
def list_orders() -> Any:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, table_number, items, status, placed_at
            FROM orders
            ORDER BY id DESC
            """
        ).fetchall()
    orders = [asdict(row_to_order(row)) for row in rows]
    return jsonify({"orders": orders})


@app.post("/api/orders")
def create_order() -> Any:
    payload = request.get_json(silent=True) or {}
    table_number = payload.get("table_number")
    items = str(payload.get("items", "")).strip()
    placed_at = str(payload.get("placed_at", "")).strip()
    if not table_number or not items or not placed_at:
        return jsonify({"error": "Table number, items, and time are required."}), 400

    try:
        table_number_int = int(table_number)
    except (TypeError, ValueError):
        return jsonify({"error": "Table number must be a number."}), 400

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO orders (table_number, items, status, placed_at)
            VALUES (?, ?, ?, ?)
            """,
            (table_number_int, items, "new", placed_at),
        )
        order_id = cursor.lastrowid

        row = connection.execute(
            """
            SELECT id, table_number, items, status, placed_at
            FROM orders
            WHERE id = ?
            """,
            (order_id,),
        ).fetchone()

    order = asdict(row_to_order(row))
    return jsonify(order), 201


@app.patch("/api/orders/<int:order_id>")
def update_order(order_id: int) -> Any:
    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip().lower()
    if status not in {"new", "in-progress", "ready", "completed"}:
        return (
            jsonify(
                {"error": "Status must be new, in-progress, ready, or completed."}
            ),
            400,
        )

    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            (status, order_id),
        )
        if cursor.rowcount == 0:
            return jsonify({"error": "Order not found."}), 404

        row = connection.execute(
            """
            SELECT id, table_number, items, status, placed_at
            FROM orders
            WHERE id = ?
            """,
            (order_id,),
        ).fetchone()

    order = asdict(row_to_order(row))
    return jsonify(order)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000, debug=True)
