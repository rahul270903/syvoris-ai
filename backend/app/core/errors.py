from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        title: str,
        detail: str,
        code: str,
        errors: Optional[List[Dict[str, Any]]] = None
    ):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.code = code
        self.errors = errors or []
        super().__init__(detail)

class AuthenticationException(AppException):
    def __init__(self, detail: str = "Invalid credentials or session expired.", code: str = "ERR_AUTH_FAILED"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, "Authentication Failed", detail, code)

class AuthorizationException(AppException):
    def __init__(self, detail: str = "Insufficient permissions for this operation.", code: str = "ERR_FORBIDDEN"):
        super().__init__(status.HTTP_403_FORBIDDEN, "Forbidden", detail, code)

class TenantIsolationException(AppException):
    def __init__(self, detail: str = "Access to the requested tenant record is denied.", code: str = "ERR_TENANT_ISOLATION"):
        super().__init__(status.HTTP_404_NOT_FOUND, "Not Found", detail, code)

class NotFoundException(AppException):
    def __init__(self, detail: str = "The requested resource was not found.", code: str = "ERR_NOT_FOUND"):
        super().__init__(status.HTTP_404_NOT_FOUND, "Resource Not Found", detail, code)

class ConflictException(AppException):
    def __init__(self, detail: str = "Resource conflict occurred.", code: str = "ERR_CONFLICT"):
        super().__init__(status.HTTP_409_CONFLICT, "Resource Conflict", detail, code)

class ValidationException(AppException):
    def __init__(self, detail: str, errors: Optional[List[Dict[str, Any]]] = None, code: str = "ERR_VALIDATION"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, "Validation Error", detail, code, errors)

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Serialize exceptions to RFC 7807 Problem Details."""
    correlation_id = getattr(request.state, "correlation_id", "unknown")
    content = {
        "type": f"https://errors.syvoris.com/v1/{exc.code.lower()}",
        "title": exc.title,
        "status": exc.status_code,
        "detail": exc.detail,
        "instance": str(request.url.path),
        "code": exc.code,
        "correlation_id": correlation_id
    }
    if exc.errors:
        content["errors"] = exc.errors
    return JSONResponse(status_code=exc.status_code, content=content)
