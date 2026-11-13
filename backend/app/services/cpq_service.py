from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple
from app.schemas.sales import (
    CPQLineInput,
    CPQLineOutput,
    CPQCalculationRequest,
    CPQCalculationResponse
)

TWO_PLACES = Decimal("0.01")
FOUR_PLACES = Decimal("0.0001")
HUNDRED = Decimal("100.00")
APPROVAL_THRESHOLD_PCT = Decimal("15.00")

def quantize_money(val: Decimal) -> Decimal:
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

def quantize_qty(val: Decimal) -> Decimal:
    return val.quantize(FOUR_PLACES, rounding=ROUND_HALF_UP)

class CPQService:
    @staticmethod
    def calculate(request: CPQCalculationRequest) -> CPQCalculationResponse:
        """
        Server-authoritative CPQ calculation engine.
        Enforces zero floating-point math using Python Decimal and standard commercial rounding conventions.
        """
        output_lines: List[CPQLineOutput] = []
        requires_approval = False
        approval_reasons: List[str] = []

        subtotal = Decimal("0.00")
        total_line_discounts = Decimal("0.00")
        total_taxes = Decimal("0.00")
        total_cost = Decimal("0.00")

        header_discount_pct = Decimal(str(request.header_discount_pct or 0.00))
        if header_discount_pct > APPROVAL_THRESHOLD_PCT:
            requires_approval = True
            approval_reasons.append(
                f"Header discount of {header_discount_pct}% exceeds commercial policy threshold of {APPROVAL_THRESHOLD_PCT}%."
            )

        for idx, line in enumerate(request.lines):
            qty = quantize_qty(Decimal(str(line.quantity or 1.0000)))
            unit_price = quantize_money(Decimal(str(line.unit_price or 0.00)))
            cost_price = quantize_money(Decimal(str(line.cost_price or 0.00)))
            discount_pct = Decimal(str(line.discount_pct or 0.00))
            tax_rate = Decimal(str(line.tax_rate or 0.00))

            if discount_pct > APPROVAL_THRESHOLD_PCT:
                requires_approval = True
                approval_reasons.append(
                    f"Line '{line.item_name}' discount of {discount_pct}% exceeds threshold of {APPROVAL_THRESHOLD_PCT}%."
                )

            # Gross line amount
            gross = quantize_money(qty * unit_price)
            # Line discount
            discount_amount = quantize_money(gross * (discount_pct / HUNDRED))
            # Net line amount
            net_amount = gross - discount_amount
            # Tax amount
            tax_amount = quantize_money(net_amount * (tax_rate / HUNDRED))
            # Total line amount
            line_total = net_amount + tax_amount

            # Cost total
            line_cost = quantize_money(qty * cost_price)

            subtotal += gross
            total_line_discounts += discount_amount
            total_taxes += tax_amount
            total_cost += line_cost

            output_lines.append(CPQLineOutput(
                product_id=line.product_id,
                item_name=line.item_name,
                sku=line.sku,
                quantity=qty,
                unit_price=unit_price,
                cost_price=cost_price,
                discount_pct=discount_pct,
                tax_rate=tax_rate,
                discount_amount=discount_amount,
                net_amount=net_amount,
                tax_amount=tax_amount,
                line_total=line_total,
                sort_order=line.sort_order or idx
            ))

        # Header discount applied to subtotal post-line-discounts
        net_before_header = subtotal - total_line_discounts
        header_discount_amount = quantize_money(net_before_header * (header_discount_pct / HUNDRED))
        total_discount = total_line_discounts + header_discount_amount
        
        taxable_and_taxed = (net_before_header - header_discount_amount) + total_taxes
        grand_total = max(Decimal("0.00"), quantize_money(taxable_and_taxed))

        margin_amount = quantize_money(grand_total - total_cost)
        if grand_total > Decimal("0.00"):
            margin_pct = quantize_money((margin_amount / grand_total) * HUNDRED)
        else:
            margin_pct = Decimal("0.00")

        return CPQCalculationResponse(
            currency=request.currency or "USD",
            header_discount_pct=header_discount_pct,
            subtotal=quantize_money(subtotal),
            total_discount=quantize_money(total_discount),
            total_tax=quantize_money(total_taxes),
            grand_total=grand_total,
            total_cost=quantize_money(total_cost),
            margin_amount=margin_amount,
            margin_pct=margin_pct,
            requires_approval=requires_approval,
            approval_reasons=approval_reasons,
            lines=output_lines
        )

cpq_service = CPQService()
