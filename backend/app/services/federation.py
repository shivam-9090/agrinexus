"""BRICS AgriN Federation store -- the 'digital public good' layer.

Implements the cooperation piece of the problem statement: an open,
lightweight registry + exchange for regional agri-advisory nodes (one per
BRICS country/region) to publish anonymized, AGGREGATED soil-health and
regenerative-practice signals so that participating regions can learn from
each other's climate-resilient farming patterns without exposing individual
farmer data.

This in-memory implementation is intentionally simple for the hackathon
demo; production would back it with a shared append-only store (e.g.
Postgres + row-level tenancy per node, or a federated-learning aggregator)
behind the same schema defined in docs/federation_schema.json.
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone

from app.models.schemas import FederationNode, RegionalInsight

_lock = threading.Lock()
_nodes: dict[str, FederationNode] = {}
_insights: list[RegionalInsight] = []


def register_node(node: FederationNode) -> FederationNode:
    with _lock:
        _nodes[node.node_id] = node
    return node


def list_nodes() -> list[FederationNode]:
    with _lock:
        return list(_nodes.values())


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
    with _lock:
        _insights.append(insight)
    return insight


def list_insights(crop: str | None = None, country: str | None = None) -> list[RegionalInsight]:
    with _lock:
        results = list(_insights)
    if crop:
        results = [i for i in results if i.crop.lower() == crop.lower()]
    if country:
        results = [i for i in results if i.country.lower() == country.lower()]
    return results


def network_stats() -> dict:
    with _lock:
        nodes = list(_nodes.values())
        insights = list(_insights)
    countries = {n.country for n in nodes}
    return {
        "registered_nodes": len(nodes),
        "participating_countries": sorted(countries),
        "total_insights_shared": len(insights),
    }
