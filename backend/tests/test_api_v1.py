import asyncio
from fastapi.testclient import TestClient
from main import app
from app.auth.models import RoleCode
from app.validation.service import ValidationService

client = TestClient(app)


def test_root_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "NovaaX" in data["service"]


def test_v1_health_with_components():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database" in data
    assert "storage" in data


def test_unauthenticated_access_denied():
    # Calling protected endpoint without token should return 401
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_authenticated_user_context():
    # Calling with test verification officer header
    response = client.get(
        "/api/v1/users/me",
        headers={"X-Test-Role": "verification_officer"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == RoleCode.VERIFICATION_OFFICER.value
    assert data["email"] == "verification.officer@novaax.gov.in"
    assert data["scope"]["district"] == "Pune"


def test_role_based_forbidden_access():
    # Citizen should NOT have access to verification queue
    response = client.get(
        "/api/v1/verification",
        headers={"X-Test-Role": "citizen"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_verification_officer_access_queue():
    # Verification officer CAN access verification queue
    response = client.get(
        "/api/v1/verification",
        headers={"X-Test-Role": "verification_officer"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_records_list():
    response = client.get(
        "/api/v1/records",
        headers={"X-Test-Role": "admin"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "page" in data
    assert "total" in data


def test_gis_records():
    response = client.get(
        "/api/v1/gis/records",
        headers={"X-Test-Role": "admin"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)


def test_analytics_summary():
    response = client.get(
        "/api/v1/analytics/summary",
        headers={"X-Test-Role": "admin"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "approved" in data
    assert "average_confidence" in data


def test_document_upload_invalid_type():
    # Trying to upload an executable or forbidden mime type
    response = client.post(
        "/api/v1/documents",
        files={"file": ("malicious.exe", b"binarycontent", "application/x-msdownload")},
        headers={"X-Test-Role": "admin"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_validation_rules_engine():
    # Record with valid plot area and mandatory fields
    valid_record = {
        "landowner_name": "Test Owner",
        "survey_number": "100/1",
        "village": "Test Village",
        "tehsil": "Test Tehsil",
        "district": "Test District",
        "plot_area": 1.5,
    }
    res = asyncio.run(ValidationService.validate_record("test-rec-1", valid_record))
    assert res["passed"] is True
    assert res["overall_status"] == "APPROVED"

    # Record missing mandatory survey number
    invalid_record = {
        "landowner_name": "Test Owner",
        "survey_number": "",
        "village": "Test Village",
        "tehsil": "Test Tehsil",
        "district": "Test District",
        "plot_area": -1.0,
    }
    res_fail = asyncio.run(ValidationService.validate_record("test-rec-2", invalid_record))
    assert res_fail["passed"] is False
    assert res_fail["overall_status"] == "REVIEW_REQUIRED"
