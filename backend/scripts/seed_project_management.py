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
from sqlalchemy import select
from app.db.base import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.crm import Account, Contact, Opportunity
from app.models.project import (
    Project,
    ProjectMilestone,
    ProjectTask,
    TaskDependency,
    ProjectResource,
    ProjectCost,
    ProjectActivity,
)

ROOT_DB = os.path.abspath(os.path.join(backend_dir, "..", "syvoris_dev.db"))

async def seed():
    print(f"Connecting to database at {ROOT_DB}...")
    engine = create_async_engine(f"sqlite+aiosqlite:///{ROOT_DB.replace(os.sep, '/')}")

    # Ensure all tables exist in SQLite
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        from app.db.session import _sync_sqlite_columns
        await conn.run_sync(_sync_sqlite_columns)

    async_session = async_sessionmaker(engine, class_=AsyncSession)

    async with async_session() as db:
        # 1. Find BluePeak Innovations tenant
        t_res = await db.execute(select(Tenant).where(Tenant.slug == "bluepeak-innovations"))
        tenant = t_res.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name="BluePeak Innovations", slug="bluepeak-innovations", status="Active")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
        tenant_id = tenant.id
        print(f"Seeding Project Management for Tenant: {tenant.name} ({tenant_id})")

        # Find user Arjun Mehta
        user_res = await db.execute(select(User).where(User.first_name == "Arjun", User.last_name == "Mehta"))
        arjun = user_res.scalar_one_or_none()
        arjun_id = arjun.id if arjun else None
        arjun_name = arjun.full_name if arjun else "Arjun Mehta"

        # Find or create NovaTech Solutions Account
        acc_res = await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name == "NovaTech Solutions"))
        acc = acc_res.scalar_one_or_none()
        if not acc:
            acc = Account(
                tenant_id=tenant_id,
                ref="ACC-2026-00001",
                name="NovaTech Solutions",
                industry="Cloud Computing",
                status="Active"
            )
            db.add(acc)
            await db.flush()

        # Find or create Apex Logistics Account
        apex_res = await db.execute(select(Account).where(Account.tenant_id == tenant_id, Account.name == "Apex Global Logistics"))
        apex_acc = apex_res.scalar_one_or_none()
        if not apex_acc:
            apex_acc = Account(
                tenant_id=tenant_id,
                ref="ACC-2026-00002",
                name="Apex Global Logistics",
                industry="Logistics & Supply Chain",
                status="Active"
            )
            db.add(apex_acc)
            await db.flush()

        # Check if projects already seeded
        existing_proj = await db.execute(select(Project).where(Project.tenant_id == tenant_id))
        if existing_proj.scalars().first():
            print("Projects already exist for this tenant, skipping initial seed.")
            return

        today = datetime.now(timezone.utc).date()

        # =============================================================
        # PROJECT 1: NovaTech Global Cloud Infrastructure Migration
        # =============================================================
        p1 = Project(
            tenant_id=tenant_id,
            ref="PRJ-2026-0001",
            name="NovaTech Global Cloud Infrastructure Migration",
            description="Multi-region cloud infrastructure transformation, zero-downtime database replication, and SOC 2 security compliance enablement.",
            objectives="Migrate 45 production microservices to isolated tenant clusters with 99.99% SLA guarantee and automated failover.",
            project_type="Implementation",
            category="Enterprise",
            status="In Progress",
            priority="High",
            health="On Track",
            account_id=acc.id,
            owner_id=arjun_id,
            owner_name=arjun_name,
            manager_id=arjun_id,
            manager_name=arjun_name,
            start_date=today - timedelta(days=45),
            target_date=today + timedelta(days=60),
            budget=Decimal("185000.00"),
            approved_cost_baseline=Decimal("185000.00"),
            currency="USD",
            progress_pct=45,
            custom_fields={"cloud_provider": "AWS", "deployment_region": "us-east-1"},
        )
        db.add(p1)
        await db.flush()

        # Milestones for Project 1
        m1_1 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p1.id,
            ref="MS-2026-0001",
            name="Architecture & Cloud Security Baseline",
            description="Multi-VPC architecture blueprint approved, security groups hardened, and KMS encryption keys provisioned.",
            deliverable="Signed Solution Architecture Document and Terraform Infra Repository",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="Completed",
            priority="High",
            target_date=today - timedelta(days=20),
            completion_date=today - timedelta(days=22),
            completion_criteria="Passed SOC2 Type II automated scanner and CIS Benchmark checks.",
            order_index=1,
            progress_pct=100,
        )
        m1_2 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p1.id,
            ref="MS-2026-0002",
            name="Data Migration & Dual-Run Replication",
            description="PostgreSQL schema synchronization, CDC pipeline via Kafka, and dual-run write verification.",
            deliverable="Continuous zero-loss replication pipeline with <100ms latency",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="In Progress",
            priority="High",
            target_date=today + timedelta(days=15),
            completion_criteria="Zero checksum divergence across 10 million test records.",
            order_index=2,
            progress_pct=60,
        )
        m1_3 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p1.id,
            ref="MS-2026-0003",
            name="UAT & Production Cutover",
            description="End-to-end integration testing, client sign-off, DNS traffic switchover, and live traffic verification.",
            deliverable="Production cutover complete with zero downtime",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="Pending",
            priority="Critical",
            target_date=today + timedelta(days=40),
            order_index=3,
            progress_pct=0,
        )
        m1_4 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p1.id,
            ref="MS-2026-0004",
            name="Post-Go-Live Hypercare & Final Sign-Off",
            description="30 days dedicated 24/7 monitoring, performance tuning, and executive project sign-off.",
            deliverable="Signed handover certificate and SLA baseline report",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="Pending",
            priority="Medium",
            target_date=today + timedelta(days=60),
            order_index=4,
            progress_pct=0,
        )
        db.add_all([m1_1, m1_2, m1_3, m1_4])
        await db.flush()

        # Tasks for Project 1
        t1_1 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p1.id,
            milestone_id=m1_1.id,
            ref="TSK-2026-0001",
            title="Provision Terraform Core VPC and Ingress Subnets",
            description="Configure multi-AZ VPC, transit gateway, NAT gateways, and private subnets.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="High",
            status="Completed",
            start_date=today - timedelta(days=40),
            due_date=today - timedelta(days=30),
            completed_at=datetime.now(timezone.utc) - timedelta(days=31),
            estimated_hours=Decimal("40.00"),
            actual_hours=Decimal("38.50"),
            progress_pct=100,
        )
        t1_2 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p1.id,
            milestone_id=m1_2.id,
            ref="TSK-2026-0002",
            title="Database Schema Migration & Index Tuning",
            description="Run Alembic migrations on target Aurora PostgreSQL cluster and benchmark query plans.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="High",
            status="Completed",
            start_date=today - timedelta(days=25),
            due_date=today - timedelta(days=10),
            completed_at=datetime.now(timezone.utc) - timedelta(days=11),
            estimated_hours=Decimal("32.00"),
            actual_hours=Decimal("35.00"),
            progress_pct=100,
        )
        t1_3 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p1.id,
            milestone_id=m1_2.id,
            ref="TSK-2026-0003",
            title="Kafka CDC Event Streaming Bridge Setup",
            description="Deploy Debezium connector for real-time change data capture and consumer lag alarms.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="High",
            status="In Progress",
            start_date=today - timedelta(days=10),
            due_date=today + timedelta(days=5),
            estimated_hours=Decimal("48.00"),
            actual_hours=Decimal("26.00"),
            progress_pct=55,
        )
        t1_4 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p1.id,
            milestone_id=m1_2.id,
            ref="TSK-2026-0004",
            title="Kubernetes Cluster Ingress & TLS Hardening",
            description="Configure Traefik ingress controller, cert-manager automated Let's Encrypt renewal, and mTLS.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="Medium",
            status="In Progress",
            start_date=today - timedelta(days=5),
            due_date=today + timedelta(days=10),
            estimated_hours=Decimal("24.00"),
            actual_hours=Decimal("12.00"),
            progress_pct=50,
        )
        t1_5 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p1.id,
            milestone_id=m1_3.id,
            ref="TSK-2026-0005",
            title="Automated Chaos Engineering & Disaster Recovery Drill",
            description="Simulate AZ failure, database failover, and measure recovery time objective (RTO < 30s).",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="Critical",
            status="Not Started",
            start_date=today + timedelta(days=15),
            due_date=today + timedelta(days=25),
            estimated_hours=Decimal("30.00"),
            actual_hours=Decimal("0.00"),
            progress_pct=0,
        )
        db.add_all([t1_1, t1_2, t1_3, t1_4, t1_5])
        await db.flush()

        # Add task dependency: t1_3 depends on t1_2
        dep1 = TaskDependency(
            tenant_id=tenant_id,
            task_id=t1_3.id,
            depends_on_task_id=t1_2.id,
            dependency_type="Finish-to-Start",
        )
        # t1_5 depends on t1_3
        dep2 = TaskDependency(
            tenant_id=tenant_id,
            task_id=t1_5.id,
            depends_on_task_id=t1_3.id,
            dependency_type="Finish-to-Start",
        )
        db.add_all([dep1, dep2])

        # Resources for Project 1
        r1_1 = ProjectResource(
            tenant_id=tenant_id,
            project_id=p1.id,
            user_id=arjun.id if arjun else uuid.uuid4(),
            ref="RES-2026-0001",
            role_title="Lead Cloud Solutions Architect",
            allocation_pct=75,
            planned_hours=Decimal("160.00"),
            actual_hours=Decimal("82.00"),
            hourly_rate=Decimal("185.00"),
            start_date=p1.start_date,
            end_date=p1.target_date,
            status="Active",
        )
        r1_2 = ProjectResource(
            tenant_id=tenant_id,
            project_id=p1.id,
            user_id=arjun.id if arjun else uuid.uuid4(),
            ref="RES-2026-0002",
            role_title="Senior DevOps & Infrastructure Engineer",
            allocation_pct=100,
            planned_hours=Decimal("200.00"),
            actual_hours=Decimal("95.00"),
            hourly_rate=Decimal("140.00"),
            start_date=p1.start_date,
            end_date=p1.target_date,
            status="Active",
        )
        db.add_all([r1_1, r1_2])

        # Costs for Project 1
        c1_1 = ProjectCost(
            tenant_id=tenant_id,
            project_id=p1.id,
            task_id=t1_1.id,
            ref="CST-2026-0001",
            title="AWS Multi-Region Dedicated Transit Gateway Setup",
            category="Infrastructure",
            cost_type="Actual",
            amount=Decimal("12500.00"),
            currency="USD",
            date_incurred=today - timedelta(days=30),
            status="Approved",
            approved_by_id=arjun_id,
            approved_by_name=arjun_name,
            vendor_name="Amazon Web Services",
            notes="Provisioned VPC peering and dedicated interconnects.",
        )
        c1_2 = ProjectCost(
            tenant_id=tenant_id,
            project_id=p1.id,
            task_id=t1_2.id,
            ref="CST-2026-0002",
            title="Database Migration Architecture Consulting",
            category="Labor",
            cost_type="Actual",
            amount=Decimal("18500.00"),
            currency="USD",
            date_incurred=today - timedelta(days=15),
            status="Approved",
            approved_by_id=arjun_id,
            approved_by_name=arjun_name,
            vendor_name="Syvoris Professional Services",
            notes="Senior database performance optimization engagement.",
        )
        c1_3 = ProjectCost(
            tenant_id=tenant_id,
            project_id=p1.id,
            task_id=t1_3.id,
            ref="CST-2026-0003",
            title="Enterprise Kafka Confluent Cloud Subscription",
            category="Software",
            cost_type="Actual",
            amount=Decimal("8400.00"),
            currency="USD",
            date_incurred=today - timedelta(days=5),
            status="Approved",
            approved_by_id=arjun_id,
            approved_by_name=arjun_name,
            vendor_name="Confluent Inc.",
            notes="Annual streaming license for tenant event bus.",
        )
        db.add_all([c1_1, c1_2, c1_3])

        # Activities for Project 1
        a1_1 = ProjectActivity(
            tenant_id=tenant_id,
            project_id=p1.id,
            activity_type="Milestone",
            action="Milestone signed off: Architecture & Cloud Security Baseline",
            actor_id=arjun_id,
            actor_name=arjun_name,
            details="Milestone approved following clean SOC 2 verification scan.",
            occurred_at=datetime.now(timezone.utc) - timedelta(days=22),
        )
        a1_2 = ProjectActivity(
            tenant_id=tenant_id,
            project_id=p1.id,
            activity_type="Financial",
            action="Budget expense approved: Confluent Cloud ($8,400.00)",
            actor_id=arjun_id,
            actor_name=arjun_name,
            details="Approved under project implementation cost allocation.",
            occurred_at=datetime.now(timezone.utc) - timedelta(days=5),
        )
        db.add_all([a1_1, a1_2])

        # =============================================================
        # PROJECT 2: Apex Global Logistics Fleet Telematics Integration
        # =============================================================
        p2 = Project(
            tenant_id=tenant_id,
            ref="PRJ-2026-0002",
            name="Apex Fleet Telematics & ERP Integration",
            description="Real-time IoT telematics ingestion, automated route optimization, and SAP ERP billing synchronization for 1,200 commercial transport units.",
            objectives="Reduce route transit delays by 18% and automate freight invoice generation upon delivery confirmation.",
            project_type="Integration",
            category="Enterprise",
            status="In Progress",
            priority="Medium",
            health="On Track",
            account_id=apex_acc.id,
            owner_id=arjun_id,
            owner_name=arjun_name,
            manager_id=arjun_id,
            manager_name=arjun_name,
            start_date=today - timedelta(days=20),
            target_date=today + timedelta(days=75),
            budget=Decimal("95000.00"),
            approved_cost_baseline=Decimal("95000.00"),
            currency="USD",
            progress_pct=28,
            custom_fields={"fleet_size": 1200, "iot_protocol": "MQTT"},
        )
        db.add(p2)
        await db.flush()

        m2_1 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p2.id,
            ref="MS-2026-0005",
            name="Telematics Gateway Specification & API Design",
            description="MQTT broker ingestion endpoints, authentication certs, and payload schemas validated.",
            deliverable="Swagger 3.0 API Specification & Certified MQTT Broker Setup",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="Completed",
            priority="Medium",
            target_date=today - timedelta(days=5),
            completion_date=today - timedelta(days=6),
            completion_criteria="Passed simulated payload load test with 5,000 req/sec.",
            order_index=1,
            progress_pct=100,
        )
        m2_2 = ProjectMilestone(
            tenant_id=tenant_id,
            project_id=p2.id,
            ref="MS-2026-0006",
            name="SAP ERP Connector & Invoicing Dispatch",
            description="BAPI interface integration for automated invoice generation triggered by GPS geofence arrival.",
            deliverable="Functional SAP ERP connector passing staging test runs",
            owner_id=arjun_id,
            owner_name=arjun_name,
            status="In Progress",
            priority="High",
            target_date=today + timedelta(days=30),
            order_index=2,
            progress_pct=35,
        )
        db.add_all([m2_1, m2_2])
        await db.flush()

        t2_1 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p2.id,
            milestone_id=m2_1.id,
            ref="TSK-2026-0006",
            title="Deploy High-Throughput EMQX MQTT Broker Cluster",
            description="Cluster setup with Redis session clustering and client SSL certificate authentication.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="High",
            status="Completed",
            start_date=today - timedelta(days=18),
            due_date=today - timedelta(days=8),
            completed_at=datetime.now(timezone.utc) - timedelta(days=9),
            estimated_hours=Decimal("28.00"),
            actual_hours=Decimal("25.00"),
            progress_pct=100,
        )
        t2_2 = ProjectTask(
            tenant_id=tenant_id,
            project_id=p2.id,
            milestone_id=m2_2.id,
            ref="TSK-2026-0007",
            title="Geofencing Alert Webhooks & SAP Order Update",
            description="Calculate waypoint arrival events and post JSON payloads to SAP RFC gateway.",
            assigned_user_id=arjun_id,
            assigned_user_name=arjun_name,
            priority="High",
            status="In Progress",
            start_date=today - timedelta(days=5),
            due_date=today + timedelta(days=15),
            estimated_hours=Decimal("40.00"),
            actual_hours=Decimal("15.00"),
            progress_pct=35,
        )
        db.add_all([t2_1, t2_2])

        r2_1 = ProjectResource(
            tenant_id=tenant_id,
            project_id=p2.id,
            user_id=arjun.id if arjun else uuid.uuid4(),
            ref="RES-2026-0003",
            role_title="IoT & Integration Specialist",
            allocation_pct=80,
            planned_hours=Decimal("140.00"),
            actual_hours=Decimal("40.00"),
            hourly_rate=Decimal("165.00"),
            start_date=p2.start_date,
            end_date=p2.target_date,
            status="Active",
        )
        db.add(r2_1)

        c2_1 = ProjectCost(
            tenant_id=tenant_id,
            project_id=p2.id,
            task_id=t2_1.id,
            ref="CST-2026-0004",
            title="EMQX Enterprise MQTT Broker Annual License",
            category="Software",
            cost_type="Actual",
            amount=Decimal("14200.00"),
            currency="USD",
            date_incurred=today - timedelta(days=12),
            status="Approved",
            approved_by_id=arjun_id,
            approved_by_name=arjun_name,
            vendor_name="EMQ Technologies",
            notes="Clustered IoT messaging infrastructure for telematics fleet.",
        )
        db.add(c2_1)

        await db.commit()
        print("Project Management seed completed successfully!")

    # Synchronize to backend/syvoris_dev.db as well
    BACKEND_DB = os.path.abspath(os.path.join(backend_dir, "syvoris_dev.db"))
    if os.path.exists(ROOT_DB):
        print(f"Syncing {ROOT_DB} -> {BACKEND_DB}...")
        shutil.copy2(ROOT_DB, BACKEND_DB)
        print("Database sync complete.")

if __name__ == "__main__":
    asyncio.run(seed())
