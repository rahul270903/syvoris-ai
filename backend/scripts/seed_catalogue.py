import sys
import os
import uuid
import shutil
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, func, delete
from app.db.base import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.crm import Account
from app.models.sales import Product
from app.models.catalog import (
    CatalogCategory,
    ServiceItem,
    ProductBundle,
    BundleComponent,
    ProductAvailability,
    TaxRule,
    CommercialTerms,
    WarehouseLocation,
    InventoryItem,
    StockMovement,
    VendorProfile,
    VendorProduct,
)

ROOT_DB = os.path.abspath(os.path.join(backend_dir, "..", "syvoris_dev.db"))

async def seed():
    print(f"Connecting to database at {ROOT_DB}...")
    engine = create_async_engine(f"sqlite+aiosqlite:///{ROOT_DB.replace(os.sep, '/')}")
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # 1. Tenant BluePeak Innovations
        t_res = await db.execute(select(Tenant).where(Tenant.slug == "bluepeak-innovations"))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name="BluePeak Innovations", slug="bluepeak-innovations", status="Active")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
        tenant_id = tenant.id
        print(f"Seeding Product & Service Catalogue for: {tenant.name} ({tenant_id})")

        # Arjun Mehta
        user_res = await db.execute(select(User).where(User.first_name == "Arjun", User.last_name == "Mehta"))
        arjun = user_res.scalar_one_or_none()
        arjun_id = arjun.id if arjun else None
        arjun_name = arjun.full_name if arjun else "Arjun Mehta"

        # -------------------------------------------------------------------
        # A. Clean existing catalogue records for idempotent seeding
        # -------------------------------------------------------------------
        print("Clearing existing catalogue entities for clean idempotency...")
        await db.execute(delete(VendorProduct).where(VendorProduct.tenant_id == tenant_id))
        await db.execute(delete(VendorProfile).where(VendorProfile.tenant_id == tenant_id))
        await db.execute(delete(StockMovement).where(StockMovement.tenant_id == tenant_id))
        await db.execute(delete(InventoryItem).where(InventoryItem.tenant_id == tenant_id))
        await db.execute(delete(WarehouseLocation).where(WarehouseLocation.tenant_id == tenant_id))
        await db.execute(delete(CommercialTerms).where(CommercialTerms.tenant_id == tenant_id))
        await db.execute(delete(TaxRule).where(TaxRule.tenant_id == tenant_id))
        await db.execute(delete(ProductAvailability).where(ProductAvailability.tenant_id == tenant_id))
        await db.execute(delete(BundleComponent).where(BundleComponent.tenant_id == tenant_id))
        await db.execute(delete(ProductBundle).where(ProductBundle.tenant_id == tenant_id))
        await db.execute(delete(ServiceItem).where(ServiceItem.tenant_id == tenant_id))
        await db.execute(delete(CatalogCategory).where(CatalogCategory.tenant_id == tenant_id))
        await db.commit()

        # -------------------------------------------------------------------
        # B. Seed Categories (Hierarchical Tree)
        # -------------------------------------------------------------------
        print("Seeding Categories...")
        cat_infra = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0001",
            name="Fiber & Optical Infrastructure",
            slug="fiber-infrastructure",
            category_type="Product",
            description="Core optical fiber cables, ducting, splice enclosures, and passive optical components.",
            sort_order=1,
            is_active=True,
            custom_fields={"division": "Telecom Core"},
        )
        cat_net = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0002",
            name="Network & Routing Hardware",
            slug="network-hardware",
            category_type="Product",
            description="Enterprise carrier routers, L3 switches, edge aggregation gateways.",
            sort_order=2,
            is_active=True,
            custom_fields={"division": "Active Electronics"},
        )
        cat_services = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0003",
            name="Professional Engineering Services",
            slug="engineering-services",
            category_type="Service",
            description="Civil engineering, route survey, fusion splicing, OTDR characterization, 24/7 NOC.",
            sort_order=3,
            is_active=True,
            custom_fields={"division": "Field Operations"},
        )
        cat_solutions = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0004",
            name="Turnkey Commercial Bundles",
            slug="turnkey-bundles",
            category_type="Hybrid",
            description="End-to-end bundled fiber connectivity, enterprise branch deployments, managed SD-WAN.",
            sort_order=4,
            is_active=True,
            custom_fields={"division": "Commercial"},
        )
        db.add_all([cat_infra, cat_net, cat_services, cat_solutions])
        await db.flush()

        # Child categories
        cat_cabling = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0005",
            name="Armored Trunk Cabling",
            slug="armored-trunk-cabling",
            category_type="Product",
            parent_id=cat_infra.id,
            description="Heavy-duty direct burial and aerial self-supporting armored fiber cables.",
            sort_order=1,
            is_active=True,
            custom_fields={"parent_slug": "fiber-infrastructure"},
        )
        cat_switches = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0006",
            name="Enterprise Core Switches",
            slug="enterprise-core-switches",
            category_type="Product",
            parent_id=cat_net.id,
            description="Multi-gigabit 48-port PoE+ core switches and aggregation chassis.",
            sort_order=1,
            is_active=True,
            custom_fields={"parent_slug": "network-hardware"},
        )
        cat_field_svc = CatalogCategory(
            tenant_id=tenant_id,
            ref="CAT-0007",
            name="Field Installation & Splicing",
            slug="field-installation-splicing",
            category_type="Service",
            parent_id=cat_services.id,
            description="On-site fusion splicing, joint enclosure sealing, and OTDR testing.",
            sort_order=1,
            is_active=True,
            custom_fields={"parent_slug": "engineering-services"},
        )
        db.add_all([cat_cabling, cat_switches, cat_field_svc])
        await db.flush()

        # -------------------------------------------------------------------
        # C. Seed Products (Fiber & Hardware)
        # -------------------------------------------------------------------
        print("Ensuring Products exist...")
        prod_res = await db.execute(select(Product).where(Product.tenant_id == tenant_id))
        existing_prods = list(prod_res.scalars().all())

        prod_cable = None
        prod_switch = None
        prod_router = None

        for p in existing_prods:
            if "Fiber" in p.name or "CABLE" in p.sku:
                prod_cable = p
            elif "Switch" in p.name or "SW-" in p.sku:
                prod_switch = p
            elif "Router" in p.name or "RT-" in p.sku:
                prod_router = p

        if not prod_cable:
            prod_cable = Product(
                tenant_id=tenant_id,
                sku="FBR-SM-96C-ARM",
                name="Single-Mode 96-Core Armored Fiber Cable (1000m Reel)",
                category="Fiber & Optical Infrastructure",
                description="Heavy-duty double-jacket armored single-mode optical fiber cable engineered for direct burial.",
                unit_of_measure="Reel",
                standard_price=Decimal("2450.00"),
                cost_price=Decimal("1650.00"),
                tax_category="Standard",
                tax_rate=Decimal("15.00"),
                is_active=True,
                custom_fields={"manufacturer": "Corning Optical", "gauge": "G.652.D"},
            )
            db.add(prod_cable)

        if not prod_switch:
            prod_switch = Product(
                tenant_id=tenant_id,
                sku="NET-C9300-48P",
                name="Cisco Catalyst 9300 48-Port PoE+ Managed Switch",
                category="Network & Routing Hardware",
                description="Enterprise Layer 3 switch with 48x Gigabit PoE+ ports and modular 10G/25G uplink slots.",
                unit_of_measure="Unit",
                standard_price=Decimal("4890.00"),
                cost_price=Decimal("3450.00"),
                tax_category="Standard",
                tax_rate=Decimal("15.00"),
                is_active=True,
                custom_fields={"manufacturer": "Cisco Systems", "power": "PoE+ 740W"},
            )
            db.add(prod_switch)

        if not prod_router:
            prod_router = Product(
                tenant_id=tenant_id,
                sku="NET-NOKIA-7750",
                name="Nokia 7750 Service Router Edge Gateway",
                category="Network & Routing Hardware",
                description="High-performance edge router with FP4 silicon, advanced BGP, MPLS, and carrier telemetry.",
                unit_of_measure="Unit",
                standard_price=Decimal("12500.00"),
                cost_price=Decimal("9200.00"),
                tax_category="Standard",
                tax_rate=Decimal("15.00"),
                is_active=True,
                custom_fields={"manufacturer": "Nokia Networks", "chassis": "Edge SR-1"},
            )
            db.add(prod_router)

        await db.flush()

        # -------------------------------------------------------------------
        # D. Seed Services
        # -------------------------------------------------------------------
        print("Seeding Services...")
        svc_splicing = ServiceItem(
            tenant_id=tenant_id,
            ref="SVC-0001",
            name="Precision Optical Fusion Splicing & Termination",
            code="SVC-FUSION-SPLICE",
            category_id=cat_field_svc.id,
            category_name="Field Installation & Splicing",
            service_type="Field Operations",
            description="Certified fiber optic fusion splicing, loss measurement (<0.02 dB), and dome enclosure sealing.",
            billing_method="Hourly",
            billing_frequency="One-Time",
            duration_unit="Hour",
            standard_rate=Decimal("125.00"),
            cost_rate=Decimal("65.00"),
            currency="USD",
            tax_category="Standard",
            tax_rate=Decimal("15.00"),
            terms_reference="TRM-0002",
            status="Active",
            is_active=True,
            custom_fields={"sla_commitment": "4hr Emergency Dispatch"},
        )
        svc_otdr = ServiceItem(
            tenant_id=tenant_id,
            ref="SVC-0002",
            name="OTDR Fiber Characterization & Tier-2 Certification",
            code="SVC-OTDR-CERT",
            category_id=cat_field_svc.id,
            category_name="Field Installation & Splicing",
            service_type="Field Operations",
            description="Bidirectional optical time-domain reflectometer testing, chromatic dispersion analysis, and PDF certification reports.",
            billing_method="Daily",
            billing_frequency="One-Time",
            duration_unit="Day",
            standard_rate=Decimal("950.00"),
            cost_rate=Decimal("450.00"),
            currency="USD",
            tax_category="Standard",
            tax_rate=Decimal("15.00"),
            terms_reference="TRM-0002",
            status="Active",
            is_active=True,
            custom_fields={"standards": "TIA-568.3-D / ISO/IEC 11801"},
        )
        svc_noc = ServiceItem(
            tenant_id=tenant_id,
            ref="SVC-0003",
            name="24/7 Managed NOC Proactive Monitoring & Incident Response",
            code="SVC-NOC-MANAGED",
            category_id=cat_services.id,
            category_name="Professional Engineering Services",
            service_type="Managed Services",
            description="Continuous round-the-clock SNMP/telemetry surveillance, proactive link health alerts, and MTTR < 60 min incident resolution.",
            billing_method="Subscription",
            billing_frequency="Monthly",
            duration_unit="Month",
            standard_rate=Decimal("1850.00"),
            cost_rate=Decimal("800.00"),
            currency="USD",
            tax_category="Standard",
            tax_rate=Decimal("15.00"),
            terms_reference="TRM-0001",
            status="Active",
            is_active=True,
            custom_fields={"uptime_guarantee": "99.99%"},
        )
        svc_trenching = ServiceItem(
            tenant_id=tenant_id,
            ref="SVC-0004",
            name="Underground Micro-Trenching & Duct Sub-surface Placement",
            code="SVC-CIVIL-TRENCH",
            category_id=cat_services.id,
            category_name="Professional Engineering Services",
            service_type="Civil Works",
            description="Low-impact diamond blade micro-trenching, dual 32mm HDPE duct laying, and asphalt reinstatement.",
            billing_method="Project",
            billing_frequency="Milestone",
            duration_unit="Project",
            standard_rate=Decimal("4500.00"),
            cost_rate=Decimal("2600.00"),
            currency="USD",
            tax_category="Standard",
            tax_rate=Decimal("15.00"),
            terms_reference="TRM-0003",
            status="Active",
            is_active=True,
            custom_fields={"permit_handling": "Municipal council approvals included"},
        )
        db.add_all([svc_splicing, svc_otdr, svc_noc, svc_trenching])
        await db.flush()

        # -------------------------------------------------------------------
        # E. Seed Product & Service Bundles
        # -------------------------------------------------------------------
        print("Seeding Bundles...")
        bundle_turnkey = ProductBundle(
            tenant_id=tenant_id,
            ref="BND-0001",
            name="Enterprise Metro Fiber Turnkey Connectivity Package",
            bundle_code="BND-METRO-FIBER",
            description="All-in-one commercial package featuring 1km trunk cable, Cisco core switch, precision splicing, and OTDR certification.",
            pricing_model="Fixed",
            bundle_price=Decimal("8500.00"),
            discount_pct=Decimal("12.50"),
            currency="USD",
            valid_from=date.today() - timedelta(days=30),
            valid_until=date.today() + timedelta(days=335),
            status="Active",
            is_active=True,
            custom_fields={"tier": "Commercial Enterprise", "guarantee": "Turnkey SLA"},
        )
        db.add(bundle_turnkey)
        await db.flush()

        comp1 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_turnkey.id,
            component_type="Product",
            product_id=prod_cable.id,
            item_name=prod_cable.name,
            sku_or_code=prod_cable.sku,
            quantity=Decimal("1.00"),
            unit_price=prod_cable.standard_price,
            discount_pct=Decimal("10.00"),
            is_optional=False,
            sort_order=1,
        )
        comp2 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_turnkey.id,
            component_type="Product",
            product_id=prod_switch.id,
            item_name=prod_switch.name,
            sku_or_code=prod_switch.sku,
            quantity=Decimal("1.00"),
            unit_price=prod_switch.standard_price,
            discount_pct=Decimal("15.00"),
            is_optional=False,
            sort_order=2,
        )
        comp3 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_turnkey.id,
            component_type="Service",
            service_id=svc_splicing.id,
            item_name=svc_splicing.name,
            sku_or_code=svc_splicing.code,
            quantity=Decimal("8.00"),
            unit_price=svc_splicing.standard_rate,
            discount_pct=Decimal("0.00"),
            is_optional=False,
            sort_order=3,
        )
        comp4 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_turnkey.id,
            component_type="Service",
            service_id=svc_otdr.id,
            item_name=svc_otdr.name,
            sku_or_code=svc_otdr.code,
            quantity=Decimal("1.00"),
            unit_price=svc_otdr.standard_rate,
            discount_pct=Decimal("10.00"),
            is_optional=True,
            sort_order=4,
        )
        db.add_all([comp1, comp2, comp3, comp4])

        # Second Bundle: Component-Based Pricing
        bundle_branch = ProductBundle(
            tenant_id=tenant_id,
            ref="BND-0002",
            name="Branch Office Carrier SD-WAN Gateway Bundle",
            bundle_code="BND-BRANCH-SDWAN",
            description="Carrier-grade branch setup combining Nokia edge router with 6 months of 24/7 Managed NOC supervision.",
            pricing_model="Component-based",
            bundle_price=Decimal("0.00"),
            discount_pct=Decimal("15.00"),
            currency="USD",
            valid_from=date.today() - timedelta(days=15),
            valid_until=date.today() + timedelta(days=350),
            status="Active",
            is_active=True,
            custom_fields={"tier": "Carrier Grade"},
        )
        db.add(bundle_branch)
        await db.flush()

        comp_b1 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_branch.id,
            component_type="Product",
            product_id=prod_router.id,
            item_name=prod_router.name,
            sku_or_code=prod_router.sku,
            quantity=Decimal("1.00"),
            unit_price=prod_router.standard_price,
            discount_pct=Decimal("10.00"),
            is_optional=False,
            sort_order=1,
        )
        comp_b2 = BundleComponent(
            tenant_id=tenant_id,
            bundle_id=bundle_branch.id,
            component_type="Service",
            service_id=svc_noc.id,
            item_name=svc_noc.name,
            sku_or_code=svc_noc.code,
            quantity=Decimal("6.00"),
            unit_price=svc_noc.standard_rate,
            discount_pct=Decimal("20.00"),
            is_optional=False,
            sort_order=2,
        )
        db.add_all([comp_b1, comp_b2])
        await db.flush()

        # -------------------------------------------------------------------
        # F. Seed Product Availability
        # -------------------------------------------------------------------
        print("Seeding Product Availability...")
        avail1 = ProductAvailability(
            tenant_id=tenant_id,
            product_id=prod_cable.id,
            item_name=prod_cable.name,
            status="Available",
            effective_start_date=date.today() - timedelta(days=60),
            effective_end_date=date.today() + timedelta(days=300),
            channel="All Channels",
            region="Jamaica & Caribbean",
            lead_time_days=3,
            notes="Stored in Kingston Central Logistics Hub. Immediate dispatch available.",
            is_active=True,
            custom_fields={"stock_ready": True},
        )
        avail2 = ProductAvailability(
            tenant_id=tenant_id,
            product_id=prod_switch.id,
            item_name=prod_switch.name,
            status="Available",
            effective_start_date=date.today() - timedelta(days=45),
            effective_end_date=date.today() + timedelta(days=300),
            channel="Enterprise Direct & Partner Portal",
            region="Caribbean Region",
            lead_time_days=5,
            notes="Supplied via Cisco authorized distribution channel.",
            is_active=True,
            custom_fields={"warranty": "Cisco SmartNet 3-year"},
        )
        avail3 = ProductAvailability(
            tenant_id=tenant_id,
            product_id=prod_router.id,
            item_name=prod_router.name,
            status="Limited",
            effective_start_date=date.today() - timedelta(days=10),
            effective_end_date=date.today() + timedelta(days=180),
            channel="Carrier Accounts Only",
            region="Global",
            lead_time_days=21,
            notes="Imported directly from Nokia European staging hub upon order confirmation.",
            is_active=True,
            custom_fields={"customs_clearance": "Norman Manley Int'l Airport Staging"},
        )
        avail4 = ProductAvailability(
            tenant_id=tenant_id,
            service_id=svc_splicing.id,
            item_name=svc_splicing.name,
            status="Available",
            effective_start_date=date.today() - timedelta(days=90),
            effective_end_date=date.today() + timedelta(days=365),
            channel="All Channels",
            region="Kingston, St. Andrew & St. Catherine",
            lead_time_days=1,
            notes="3 certified technician crews on active rotation with fusion vans.",
            is_active=True,
            custom_fields={"crews_available": 3},
        )
        db.add_all([avail1, avail2, avail3, avail4])
        await db.flush()

        # -------------------------------------------------------------------
        # G. Seed Tax Rules
        # -------------------------------------------------------------------
        print("Seeding Tax Rules...")
        tax1 = TaxRule(
            tenant_id=tenant_id,
            ref="TAX-0001",
            name="General Consumption Tax (GCT) - Standard",
            code="GCT-STD-15",
            rate=Decimal("15.00"),
            region="Jamaica - National",
            tax_type="Standard",
            is_inclusive=False,
            effective_start_date=date(2020, 4, 1),
            effective_end_date=None,
            status="Active",
            description="Standard statutory consumption tax applicable to commercial telecom equipment and technical services.",
            custom_fields={"tax_authority": "Tax Administration Jamaica (TAJ)"},
        )
        tax2 = TaxRule(
            tenant_id=tenant_id,
            ref="TAX-0002",
            name="Telecommunications Special Consumption Levy",
            code="GCT-TEL-25",
            rate=Decimal("25.00"),
            region="Jamaica - Telecom Jurisdiction",
            tax_type="Special",
            is_inclusive=False,
            effective_start_date=date(2020, 1, 1),
            effective_end_date=None,
            status="Active",
            description="Statutory telecom special consumption tax applicable to voice and broadband carriage services.",
            custom_fields={"tax_authority": "TAJ Telecoms Unit"},
        )
        tax3 = TaxRule(
            tenant_id=tenant_id,
            ref="TAX-0003",
            name="Zero-Rated International Cross-Border Supply",
            code="TAX-EXPORT-0",
            rate=Decimal("0.00"),
            region="CARICOM / International Export",
            tax_type="Zero-rated",
            is_inclusive=False,
            effective_start_date=date(2021, 1, 1),
            effective_end_date=None,
            status="Active",
            description="Exempt / Zero-rated international engineering consultation and cross-border bandwidth transit.",
            custom_fields={"export_treaty": "CARICOM Single Market"},
        )
        db.add_all([tax1, tax2, tax3])
        await db.flush()

        # -------------------------------------------------------------------
        # H. Seed Commercial Terms & Conditions
        # -------------------------------------------------------------------
        print("Seeding Commercial Terms...")
        term1 = CommercialTerms(
            tenant_id=tenant_id,
            ref="TRM-0001",
            title="Master Telecommunications & Fiber Infrastructure Agreement",
            version="2.1",
            category="Commercial",
            content="""# MASTER TELECOMMUNICATIONS AGREEMENT (MSA)

1. **PURPOSE & SCOPE**: BluePeak Innovations provides enterprise connectivity, optical transmission infrastructure, and maintenance subject to these commercial provisions.
2. **PAYMENT & BILLING**: All invoices are due Net 30 days from invoice date. Late payments incur interest at 1.5% per calendar month.
3. **EQUIPMENT TITLE**: Title to passive and active networking equipment transfers upon verified receipt of payment in full.
4. **GOVERNING LAW**: This agreement is governed by the laws of Jamaica. Disputes shall be resolved by arbitration in Kingston.""",
            effective_date=date(2024, 1, 1),
            expiration_date=date(2028, 12, 31),
            status="Published",
            is_default=True,
            published_by=arjun_name,
            published_at=datetime.now(timezone.utc),
            custom_fields={"legal_approver": "Legal & Commercial Council"},
        )
        term2 = CommercialTerms(
            tenant_id=tenant_id,
            ref="TRM-0002",
            title="Fiber Network Performance & Field Maintenance SLA",
            version="1.4",
            category="Service Level",
            content="""# SERVICE LEVEL AGREEMENT (SLA)

1. **NETWORK AVAILABILITY**: BluePeak guarantees 99.95% annual availability for all unshared dark fiber pairs.
2. **MTTR COMMITTED WINDOW**: Emergency physical fiber breaks shall have emergency crews dispatched within 120 minutes, with target MTTR < 4 hours.
3. **SERVICE CREDITS**: Breaches of SLA entitle the customer to a 10% monthly service credit per hour of unscheduled outage exceeding target.""",
            effective_date=date(2024, 1, 1),
            expiration_date=date(2028, 12, 31),
            status="Published",
            is_default=True,
            published_by=arjun_name,
            published_at=datetime.now(timezone.utc),
            custom_fields={"sla_tier": "Enterprise Gold"},
        )
        term3 = CommercialTerms(
            tenant_id=tenant_id,
            ref="TRM-0003",
            title="Government & Public Procurement Master Terms",
            version="1.0",
            category="Government",
            content="""# PUBLIC SECTOR PROCUREMENT TERMS

1. **COMPLIANCE**: Compliant with the Public Procurement Act of Jamaica and National Contracts Commission guidelines.
2. **TAX WITHHOLDING**: Accommodates Government Tax Withholding Certificates (GCT Exemption Vouchers) upon submission.
3. **INTEGRITY PACT**: Vendor certifies zero conflict of interest and adherence to public accountability standards.""",
            effective_date=date(2024, 6, 1),
            expiration_date=date(2029, 5, 31),
            status="Published",
            is_default=True,
            published_by=arjun_name,
            published_at=datetime.now(timezone.utc),
            custom_fields={"compliance_code": "GOJ-PPA-2024"},
        )
        db.add_all([term1, term2, term3])
        await db.flush()

        # -------------------------------------------------------------------
        # I. Seed Warehouse Locations & Stock Management
        # -------------------------------------------------------------------
        print("Seeding Warehouse Locations & Stock Items...")
        loc_kingston = WarehouseLocation(
            tenant_id=tenant_id,
            ref="LOC-0001",
            name="Kingston Central Logistics & Staging Hub",
            code="WH-KIN-01",
            address="12 Newport Boulevard, Port Bustamante",
            city="Kingston",
            country="Jamaica",
            is_active=True,
            is_default=True,
            manager_name="Marcus Vance",
            custom_fields={"capacity_sqft": 25000, "temperature_controlled": True},
        )
        loc_mobay = WarehouseLocation(
            tenant_id=tenant_id,
            ref="LOC-0002",
            name="Montego Bay Western Regional Depo",
            code="WH-MBJ-02",
            address="Unit 4 Freeport Industrial Park",
            city="Montego Bay",
            country="Jamaica",
            is_active=True,
            is_default=False,
            manager_name="Devon Campbell",
            custom_fields={"capacity_sqft": 10000, "temperature_controlled": False},
        )
        loc_spanish_town = WarehouseLocation(
            tenant_id=tenant_id,
            ref="LOC-0003",
            name="Spanish Town Engineering Yard & Cable Staging",
            code="WH-SPT-03",
            address="Burke Road Industrial Strip",
            city="Spanish Town",
            country="Jamaica",
            is_active=True,
            is_default=False,
            manager_name="Leroy Brown",
            custom_fields={"capacity_sqft": 40000, "open_air_yard": True},
        )
        db.add_all([loc_kingston, loc_mobay, loc_spanish_town])
        await db.flush()

        # Inventory balances
        inv_cable_kin = InventoryItem(
            tenant_id=tenant_id,
            ref="INV-0001",
            product_id=prod_cable.id,
            location_id=loc_kingston.id,
            quantity_on_hand=Decimal("45.00"),
            quantity_reserved=Decimal("5.00"),
            reorder_threshold=Decimal("10.00"),
            reorder_quantity=Decimal("30.00"),
            unit_of_measure="Reel",
            last_counted_at=datetime.now(timezone.utc) - timedelta(days=2),
            status="In Stock",
            custom_fields={"aisle": "A-04", "bay": "12"},
        )
        inv_switch_kin = InventoryItem(
            tenant_id=tenant_id,
            ref="INV-0002",
            product_id=prod_switch.id,
            location_id=loc_kingston.id,
            quantity_on_hand=Decimal("18.00"),
            quantity_reserved=Decimal("2.00"),
            reorder_threshold=Decimal("5.00"),
            reorder_quantity=Decimal("15.00"),
            unit_of_measure="Unit",
            last_counted_at=datetime.now(timezone.utc) - timedelta(days=1),
            status="In Stock",
            custom_fields={"aisle": "C-01", "bay": "03"},
        )
        inv_router_kin = InventoryItem(
            tenant_id=tenant_id,
            ref="INV-0003",
            product_id=prod_router.id,
            location_id=loc_kingston.id,
            quantity_on_hand=Decimal("4.00"),
            quantity_reserved=Decimal("1.00"),
            reorder_threshold=Decimal("3.00"),
            reorder_quantity=Decimal("5.00"),
            unit_of_measure="Unit",
            last_counted_at=datetime.now(timezone.utc) - timedelta(days=3),
            status="Low Stock",
            custom_fields={"aisle": "Vault-01", "high_value": True},
        )
        inv_cable_spt = InventoryItem(
            tenant_id=tenant_id,
            ref="INV-0004",
            product_id=prod_cable.id,
            location_id=loc_spanish_town.id,
            quantity_on_hand=Decimal("80.00"),
            quantity_reserved=Decimal("15.00"),
            reorder_threshold=Decimal("20.00"),
            reorder_quantity=Decimal("50.00"),
            unit_of_measure="Reel",
            last_counted_at=datetime.now(timezone.utc) - timedelta(days=5),
            status="In Stock",
            custom_fields={"yard_zone": "Bulk Cable Spool Yard"},
        )
        db.add_all([inv_cable_kin, inv_switch_kin, inv_router_kin, inv_cable_spt])
        await db.flush()

        # Seed Stock Movements
        mov1 = StockMovement(
            tenant_id=tenant_id,
            ref="MOV-0001",
            inventory_item_id=inv_cable_kin.id,
            movement_type="Receipt",
            quantity=Decimal("50.00"),
            balance_before=Decimal("0.00"),
            balance_after=Decimal("50.00"),
            to_location_id=loc_kingston.id,
            reference_doc_type="PurchaseOrder",
            reference_doc_id="PO-2024-0089",
            reason="Initial container shipment received from Corning Optical UK.",
            performed_by_id=arjun_id,
            performed_by_name=arjun_name,
        )
        mov2 = StockMovement(
            tenant_id=tenant_id,
            ref="MOV-0002",
            inventory_item_id=inv_cable_kin.id,
            movement_type="Issue",
            quantity=Decimal("5.00"),
            balance_before=Decimal("50.00"),
            balance_after=Decimal("45.00"),
            from_location_id=loc_kingston.id,
            reference_doc_type="SalesOrder",
            reference_doc_id="SO-2024-0102",
            reason="Dispatched to Kingston Port Metro Backbone construction crew.",
            performed_by_id=arjun_id,
            performed_by_name=arjun_name,
        )
        mov3 = StockMovement(
            tenant_id=tenant_id,
            ref="MOV-0003",
            inventory_item_id=inv_switch_kin.id,
            movement_type="Receipt",
            quantity=Decimal("20.00"),
            balance_before=Decimal("0.00"),
            balance_after=Decimal("20.00"),
            to_location_id=loc_kingston.id,
            reference_doc_type="PurchaseOrder",
            reference_doc_id="PO-2024-0094",
            reason="Air freight batch arrived via Cisco Miami hub.",
            performed_by_id=arjun_id,
            performed_by_name=arjun_name,
        )
        mov4 = StockMovement(
            tenant_id=tenant_id,
            ref="MOV-0004",
            inventory_item_id=inv_switch_kin.id,
            movement_type="Issue",
            quantity=Decimal("2.00"),
            balance_before=Decimal("20.00"),
            balance_after=Decimal("18.00"),
            from_location_id=loc_kingston.id,
            reference_doc_type="SalesOrder",
            reference_doc_id="SO-2024-0105",
            reason="Installed at Scotiabank Jamaica regional data center.",
            performed_by_id=arjun_id,
            performed_by_name=arjun_name,
        )
        db.add_all([mov1, mov2, mov3, mov4])
        await db.flush()

        # -------------------------------------------------------------------
        # J. Seed Vendors (Reusing CRM Accounts)
        # -------------------------------------------------------------------
        print("Seeding Vendors & Supply Products...")
        # Check or create CRM Accounts
        acc_corning = (await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name.ilike("%Corning%")))).scalar_one_or_none()
        if not acc_corning:
            acc_corning = Account(
                tenant_id=tenant_id,
                ref="ACC-VND-0001",
                name="Corning Optical Communications Ltd",
                account_type="Vendor",
                industry="Telecommunications Equipment",
                website="https://www.corning.com",
                phone="+1 (800) 743-2675",
                email="procurement@corning.com",
                address="1 Riverfront Plaza, Corning, NY",
                billing_address={"street": "1 Riverfront Plaza", "city": "Corning", "state": "NY", "country": "United States"},
                shipping_address={"street": "1 Riverfront Plaza", "city": "Corning", "state": "NY", "country": "United States"},
            )
            db.add(acc_corning)
        else:
            acc_corning.account_type = "Vendor"

        acc_cisco = (await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name.ilike("%Cisco%")))).scalar_one_or_none()
        if not acc_cisco:
            acc_cisco = Account(
                tenant_id=tenant_id,
                ref="ACC-VND-0002",
                name="Cisco Systems Caribbean & Latin America",
                account_type="Vendor",
                industry="Network Hardware",
                website="https://www.cisco.com",
                phone="+1 (408) 526-4000",
                email="caribbean-orders@cisco.com",
                address="170 West Tasman Dr, San Jose, CA",
                billing_address={"street": "170 West Tasman Dr", "city": "San Jose", "state": "CA", "country": "United States"},
                shipping_address={"street": "170 West Tasman Dr", "city": "San Jose", "state": "CA", "country": "United States"},
            )
            db.add(acc_cisco)
        else:
            acc_cisco.account_type = "Vendor"

        acc_fujikura = (await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name.ilike("%Fujikura%")))).scalar_one_or_none()
        if not acc_fujikura:
            acc_fujikura = Account(
                tenant_id=tenant_id,
                ref="ACC-VND-0003",
                name="Fujikura Optical Technologies Inc",
                account_type="Vendor",
                industry="Optical Test Equipment",
                website="https://www.fujikura.com",
                phone="+81 3 5606 1112",
                email="international-sales@fujikura.co.jp",
                address="1-5-1 Kiba, Koto-ku, Tokyo",
                billing_address={"street": "1-5-1 Kiba, Koto-ku", "city": "Tokyo", "state": "Tokyo", "country": "Japan"},
                shipping_address={"street": "1-5-1 Kiba, Koto-ku", "city": "Tokyo", "state": "Tokyo", "country": "Japan"},
            )
            db.add(acc_fujikura)
        else:
            acc_fujikura.account_type = "Vendor"

        await db.flush()

        # Create Vendor Profiles
        vp_corning = VendorProfile(
            tenant_id=tenant_id,
            ref="VND-0001",
            account_id=acc_corning.id,
            vendor_code="VND-CORNING",
            vendor_category="Fiber & Passive Infrastructure",
            payment_terms="Net 45",
            tax_id="US-16-0393420",
            rating=Decimal("4.9"),
            status="Active",
            compliance_notes="ISO 9001 and ISO 14001 certified. Verified Caribbean direct shipping partner.",
            custom_fields={"contact_rep": "David Miller", "discount_agreement": "Tier-1 Partner (22% off list)"},
        )
        vp_cisco = VendorProfile(
            tenant_id=tenant_id,
            ref="VND-0002",
            account_id=acc_cisco.id,
            vendor_code="VND-CISCO",
            vendor_category="Active Network Hardware",
            payment_terms="Net 30",
            tax_id="US-94-2974530",
            rating=Decimal("4.8"),
            status="Active",
            compliance_notes="Cisco Premier Certified Partner agreement active through 2027.",
            custom_fields={"contact_rep": "Elena Gutierrez", "rma_sla": "Next Business Day Delivery"},
        )
        vp_fujikura = VendorProfile(
            tenant_id=tenant_id,
            ref="VND-0003",
            account_id=acc_fujikura.id,
            vendor_code="VND-FUJIKURA",
            vendor_category="Splicing & Calibration Tools",
            payment_terms="Net 30",
            tax_id="JP-9010001034567",
            rating=Decimal("4.7"),
            status="Active",
            compliance_notes="Annual factory recalibration certificate provided for all fusion arc units.",
            custom_fields={"contact_rep": "Kenji Sato", "warranty_years": 3},
        )
        db.add_all([vp_corning, vp_cisco, vp_fujikura])
        await db.flush()

        # Link Vendor Products
        v_prod1 = VendorProduct(
            tenant_id=tenant_id,
            vendor_id=vp_corning.id,
            product_id=prod_cable.id,
            vendor_sku="CRN-SM-ALT-96",
            unit_cost=Decimal("1650.00"),
            currency="USD",
            lead_time_days=14,
            min_order_quantity=Decimal("5.00"),
            is_preferred_vendor=True,
            custom_fields={"bulk_pallet_size": 10},
        )
        v_prod2 = VendorProduct(
            tenant_id=tenant_id,
            vendor_id=vp_cisco.id,
            product_id=prod_switch.id,
            vendor_sku="C9300-48P-E-DIST",
            unit_cost=Decimal("3450.00"),
            currency="USD",
            lead_time_days=7,
            min_order_quantity=Decimal("1.00"),
            is_preferred_vendor=True,
            custom_fields={"includes_smartnet": True},
        )
        v_prod3 = VendorProduct(
            tenant_id=tenant_id,
            vendor_id=vp_fujikura.id,
            service_id=svc_splicing.id,
            vendor_sku="FJK-CALIB-SPLICE",
            unit_cost=Decimal("45.00"),
            currency="USD",
            lead_time_days=3,
            min_order_quantity=Decimal("1.00"),
            is_preferred_vendor=True,
            custom_fields={"electrode_replacement": "Included every 5000 splices"},
        )
        db.add_all([v_prod1, v_prod2, v_prod3])
        await db.commit()

        print("Successfully seeded all 9 Product & Service Catalogue modules!")

    await engine.dispose()

    # Synchronize database file to backend/syvoris_dev.db as well
    backend_db = os.path.join(backend_dir, "syvoris_dev.db")
    print(f"Synchronizing database to {backend_db}...")
    shutil.copyfile(ROOT_DB, backend_db)
    print("Database sync completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
