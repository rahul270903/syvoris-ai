import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.errors import AppException, app_exception_handler
from app.core.tenancy import set_current_tenant_id, set_current_user_id
from app.db.session import init_db, async_session_factory
from app.services.rbac_service import rbac_service
from app.api.v1.router import api_router

class SecurityAndCorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate or capture correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Reset tenant execution context for the new request
        set_current_tenant_id(None)
        set_current_user_id(None)

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize schema and seed default system permissions & platform roles
    await init_db()
    async with async_session_factory() as session:
        await rbac_service.seed_permissions_and_platform_roles(session)
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID"]
)
app.add_middleware(SecurityAndCorrelationMiddleware)

# Mount API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
