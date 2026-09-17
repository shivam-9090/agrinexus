from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import FederationNode, RegionalInsight
from app.services import federation

router = APIRouter(prefix="/federation", tags=["federation"])


@router.post("/nodes", response_model=FederationNode)
async def register_node(node: FederationNode) -> FederationNode:
    return federation.register_node(node)


@router.get("/nodes", response_model=list[FederationNode])
async def list_nodes() -> list[FederationNode]:
    return federation.list_nodes()


@router.post("/insights", response_model=RegionalInsight)
async def submit_insight(insight_in: RegionalInsight) -> RegionalInsight:
    return federation.submit_insight(
        node_id=insight_in.node_id,
        country=insight_in.country,
        region=insight_in.region,
        crop=insight_in.crop,
        avg_soil_health_score=insight_in.avg_soil_health_score,
        dominant_regenerative_practice=insight_in.dominant_regenerative_practice,
        sample_size=insight_in.sample_size,
    )


@router.get("/insights", response_model=list[RegionalInsight])
async def list_insights(crop: str | None = None, country: str | None = None) -> list[RegionalInsight]:
    return federation.list_insights(crop=crop, country=country)


@router.get("/stats")
async def stats() -> dict:
    return federation.network_stats()
