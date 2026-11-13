from fastapi import APIRouter, Depends
from app.api.deps import require_permission
from app.schemas.sales import CPQCalculationRequest, CPQCalculationResponse
from app.services.cpq_service import cpq_service

router = APIRouter()

@router.post("/calculate", response_model=CPQCalculationResponse)
async def calculate_cpq(
    req: CPQCalculationRequest,
    _: None = Depends(require_permission("quotes:read"))
):
    """
    Server-authoritative CPQ calculations.
    Returns computed gross, discounts, taxes, line totals, grand total, cost margins, and approval requirements.
    """
    return cpq_service.calculate(req)
