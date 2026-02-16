"""Main FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.rate_limit import limiter
from app.routers import resumes, matches

logging.basicConfig(level=logging.INFO)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logging.info(f"Starting {settings.app_name} in {settings.app_env} mode")
    if settings.debug:
        logging.info(f"Supabase URL: {settings.supabase_url}")
    yield
    logging.info("Shutting down gracefully")


app = FastAPI(
    title=settings.app_name,
    description="Production-grade API for Resume Parsing & Job Matching",
    version="2.0.0",
    lifespan=lifespan,
    debug=settings.debug,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation failed",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "details": str(exc) if settings.debug else "An unexpected error occurred",
        },
    )


@app.get("/health", tags=["Health"])
@limiter.limit("30/minute")
async def health_check(request: Request):
    supabase_status = "unknown"
    supabase_error = None
    try:
        from app.database.database import supabase as sb_client
        sb_client.table("resumes").select("id").limit(1).execute()
        supabase_status = "connected"
    except Exception as e:
        supabase_status = "error"
        supabase_error = str(e) if settings.debug else "Connection failed"

    return {
        "status": "healthy" if supabase_status == "connected" else "degraded",
        "environment": settings.app_env,
        "version": "2.0.0",
        "supabase": supabase_status,
        **({"supabase_error": supabase_error} if supabase_error else {}),
    }


app.include_router(resumes.router, prefix="/resume", tags=["Resumes"])
app.include_router(matches.router, prefix="/resume", tags=["Matches"])
