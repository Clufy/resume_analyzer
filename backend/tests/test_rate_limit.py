"""Test rate limiting configuration."""

from fastapi.testclient import TestClient


def test_health_is_accessible(auth_client):
    """Health endpoint should return 200 when Supabase is connected."""
    res = auth_client.get("/health")
    assert res.status_code == 200


def test_limit_route(auth_client):
    """Test that upload endpoint is rate-limited to 5/minute.

    Send 7 requests with an invalid (text/plain) file. The first few
    will get 400 (bad file type) but once the rate limit is exceeded
    the server must respond with 429.
    """
    response_codes = []
    for _ in range(7):
        res = auth_client.post(
            "/resume/upload",
            files={"file": ("bad.txt", b"hello world", "text/plain")},
        )
        response_codes.append(res.status_code)
        if res.status_code == 429:
            break  # hit the limit — no need to continue

    assert 429 in response_codes, (
        f"Expected a 429 after exceeding the 5/minute rate limit, "
        f"but got statuses: {response_codes}"
    )


def test_custom_rate_limit(auth_client):
    """Stats endpoint should be reachable (rate limit is 50/minute)."""
    res = auth_client.get("/resume/stats")
    # Should never be rate-limited with one call
    assert res.status_code != 429
    # With live Supabase it will be 200, without it will be 500 — both acceptable here
    assert res.status_code in (200, 500, 503)
