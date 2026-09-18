"""BRICS AgriN Federation store -- the 'digital public good' layer.

Implements the cooperation piece of the problem statement: an open,
lightweight registry + exchange for regional agri-advisory nodes (one per
BRICS country/region) to publish anonymized, AGGREGATED soil-health and
regenerative-practice signals so that participating regions can learn from
each other's climate-resilient farming patterns without exposing individual
farmer data.

Backed by SQLite (file-based, gitignored) so the network survives backend
restarts -- the previous in-memory version reset on every reload. A single
file is the right amount of durability for a hackathon deployment; swapping
to Postgres with per-node row-level tenancy is the documented production
path (see docs/architecture.md).
"""
from __future__ import annotations

import pathlib
import sqlite3
import threading
from datetime import datetime, timezone

from app.models.schemas import FederationNode, RegionalInsight

DB_PATH: str | pathlib.Path = (
    pathlib.Path(__file__).resolve().parent.parent / "data" / "federation" / "federation.db"
)

_lock = threading.Lock()
_connection: sqlite3.Connection | None = None


def _get_connection() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        if DB_PATH != ":memory:":
            pathlib.Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
        _connection = sqlite3.connect(DB_PATH, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _init_schema(_connection)
    return _connection


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS nodes (
            node_id TEXT PRIMARY KEY,
            country TEXT NOT NULL,
            region TEXT NOT NULL,
            contact TEXT
        );

        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT NOT NULL,
            country TEXT NOT NULL,
            region TEXT NOT NULL,
            crop TEXT NOT NULL,
            avg_soil_health_score REAL NOT NULL,
            dominant_regenerative_practice TEXT NOT NULL,
            sample_size INTEGER NOT NULL,
            submitted_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def reset_for_tests(db_path: str = ":memory:") -> None:
    """Point the store at a fresh (by default in-memory) database.

    Only intended for test isolation -- production code never calls this.
    """
    global _connection, DB_PATH
    if _connection is not None:
        _connection.close()
        _connection = None
    DB_PATH = db_path
    _get_connection()


def register_node(node: FederationNode) -> FederationNode:
    conn = _get_connection()
    with _lock:
        conn.execute(
            """
            INSERT INTO nodes (node_id, country, region, contact)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(node_id) DO UPDATE SET
                country = excluded.country,
                region = excluded.region,
                contact = excluded.contact
            """,
            (node.node_id, node.country, node.region, node.contact),
        )
        conn.commit()
    return node


def list_nodes() -> list[FederationNode]:
    conn = _get_connection()
    rows = conn.execute("SELECT node_id, country, region, contact FROM nodes ORDER BY node_id").fetchall()
    return [FederationNode(**dict(row)) for row in rows]


def submit_insight(
    node_id: str,
    country: str,
    region: str,
    crop: str,
    avg_soil_health_score: float,
    dominant_regenerative_practice: str,
    sample_size: int,
) -> RegionalInsight:
    insight = RegionalInsight(
        node_id=node_id,
        country=country,
        region=region,
        crop=crop,
        avg_soil_health_score=avg_soil_health_score,
        dominant_regenerative_practice=dominant_regenerative_practice,
        sample_size=sample_size,
        submitted_at=datetime.now(timezone.utc).isoformat(),
    )
    conn = _get_connection()
    with _lock:
        conn.execute(
            """
            INSERT INTO insights
                (node_id, country, region, crop, avg_soil_health_score,
                 dominant_regenerative_practice, sample_size, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                insight.node_id,
                insight.country,
                insight.region,
                insight.crop,
                insight.avg_soil_health_score,
                insight.dominant_regenerative_practice,
                insight.sample_size,
                insight.submitted_at,
            ),
        )
        conn.commit()
    return insight


def list_insights(crop: str | None = None, country: str | None = None) -> list[RegionalInsight]:
    conn = _get_connection()
    query = (
        "SELECT node_id, country, region, crop, avg_soil_health_score, "
        "dominant_regenerative_practice, sample_size, submitted_at FROM insights"
    )
    clauses = []
    params: list[str] = []
    if crop:
        clauses.append("LOWER(crop) = LOWER(?)")
        params.append(crop)
    if country:
        clauses.append("LOWER(country) = LOWER(?)")
        params.append(country)
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY id"

    rows = conn.execute(query, params).fetchall()
    return [RegionalInsight(**dict(row)) for row in rows]


def network_stats() -> dict:
    conn = _get_connection()
    node_count = conn.execute("SELECT COUNT(*) FROM nodes").fetchone()[0]
    insight_count = conn.execute("SELECT COUNT(*) FROM insights").fetchone()[0]
    countries = [
        row[0] for row in conn.execute("SELECT DISTINCT country FROM nodes ORDER BY country").fetchall()
    ]
    return {
        "registered_nodes": node_count,
        "participating_countries": countries,
        "total_insights_shared": insight_count,
    }
