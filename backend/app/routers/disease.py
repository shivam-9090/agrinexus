from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import DiseaseDiagnosis
from app.services import disease_detector

router = APIRouter(prefix="/disease", tags=["disease"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/diagnose", response_model=DiseaseDiagnosis)
async def diagnose_leaf(image: UploadFile) -> DiseaseDiagnosis:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG or WEBP leaf photo")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file upload")

    try:
        return disease_detector.diagnose(contents)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not process image: {exc}") from exc
