from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from app.config import Settings, get_settings
from app.models.schemas import FederationNode, RegionalInsight
from app.services import federation

router = APIRouter(prefix="/federation", tags=["federation"])


def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings),
) -> None:
    """Gate on POST endpoints only -- GET endpoints stay public.

    When FEDERATION_API_KEY isn't set (the default), this is a no-op: local
    dev and the demo work with zero setup. A real deployment sets the env
    var, at which point every write needs a matching X-API-Key header. This
    is a shared secret, not per-node credentials -- see docs/architecture.md
    for why that's an intentional, documented limitation rather than an
    oversight.
    """
    if not settings.federation_api_key:
        return
    if x_api_key != settings.federation_api_key:
        raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key")


@router.post("/nodes", response_model=FederationNode, dependencies=[Depends(require_api_key)])
async def register_node(node: FederationNode) -> FederationNode:
    return federation.register_node(node)


@router.get("/nodes", response_model=list[FederationNode])
async def list_nodes() -> list[FederationNode]:
    return federation.list_nodes()


@router.post("/insights", response_model=RegionalInsight, dependencies=[Depends(require_api_key)])
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
