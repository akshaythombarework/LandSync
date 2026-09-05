import asyncio
import logging
import uuid
from datetime import datetime, timezone
from app.auth.models import RoleCode
from app.auth.permissions import ROLE_PERMISSIONS
from app.core.supabase import get_supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("novaax.seed")


# 1. Standard Application Roles
SEED_ROLES = [
    {
        "id": "10000000-0000-0000-0000-000000000001",
        "code": RoleCode.ADMIN.value,
        "name": "System Administrator",
        "description": "Full administrative control, user management, and system configuration.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.ADMIN]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000002",
        "code": RoleCode.STATE_OFFICER.value,
        "name": "State Level Officer",
        "description": "Statewide dashboard, monitoring district progress, and statewide analytics.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.STATE_OFFICER]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000003",
        "code": RoleCode.DISTRICT_OFFICER.value,
        "name": "District Level Officer",
        "description": "District-level oversight, verification monitoring, approvals, and analytics.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.DISTRICT_OFFICER]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000004",
        "code": RoleCode.TEHSIL_OFFICER.value,
        "name": "Tehsil Level Officer",
        "description": "Tehsil-level document ingestion, review, and localized record administration.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.TEHSIL_OFFICER]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000005",
        "code": RoleCode.VERIFICATION_OFFICER.value,
        "name": "Verification & Review Officer",
        "description": "Human-in-the-loop verification queue, field corrections, and validation resolution.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.VERIFICATION_OFFICER]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000006",
        "code": RoleCode.SURVEY_OFFICER.value,
        "name": "Cadastral Survey Officer",
        "description": "GIS parcel boundary review, coordinate inspection, and spatial data validation.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.SURVEY_OFFICER]],
    },
    {
        "id": "10000000-0000-0000-0000-000000000007",
        "code": RoleCode.CITIZEN.value,
        "name": "Citizen / Landholder",
        "description": "Citizen self-service portal, record status tracking, and document submissions.",
        "permissions": [p.value for p in ROLE_PERMISSIONS[RoleCode.CITIZEN]],
    },
]


# 2. Standard Validation Rules
SEED_VALIDATION_RULES = [
    {
        "id": "20000000-0000-0000-0000-000000000001",
        "rule_code": "REQUIRED_SURVEY_NUMBER",
        "name": "Mandatory Survey Number",
        "description": "Verifies that the survey/gat number is present and not null.",
        "field_name": "survey_number",
        "severity": "ERROR",
        "active": True,
        "rule_configuration": {"required": True},
    },
    {
        "id": "20000000-0000-0000-0000-000000000002",
        "rule_code": "REQUIRED_LANDOWNER_NAME",
        "name": "Mandatory Landowner Name",
        "description": "Ensures primary owner name is identified in extracted record.",
        "field_name": "landowner_name",
        "severity": "ERROR",
        "active": True,
        "rule_configuration": {"required": True, "min_length": 2},
    },
    {
        "id": "20000000-0000-0000-0000-000000000003",
        "rule_code": "POSITIVE_PLOT_AREA",
        "name": "Positive Plot Area",
        "description": "Ensures plot area is greater than zero hectares.",
        "field_name": "plot_area",
        "severity": "ERROR",
        "active": True,
        "rule_configuration": {"min_value": 0.0001},
    },
    {
        "id": "20000000-0000-0000-0000-000000000004",
        "rule_code": "CONFIDENCE_THRESHOLD",
        "name": "Extraction Confidence Threshold",
        "description": "Flags extracted fields with confidence score under 0.70 for human inspection.",
        "field_name": None,
        "severity": "WARNING",
        "active": True,
        "rule_configuration": {"threshold": 0.70},
    },
    {
        "id": "20000000-0000-0000-0000-000000000005",
        "rule_code": "MASTER_DATASET_MATCH",
        "name": "Master Dataset Cross-Reference",
        "description": "Compares extracted owner and area against reference master land records.",
        "field_name": "survey_number",
        "severity": "WARNING",
        "active": True,
        "rule_configuration": {"cross_reference": True},
    },
]


# 3. Prototype / Fictional Master Land Records (Across multiple districts, tehsils, villages)
SEED_MASTER_RECORDS = [
    # Pune District - Haveli Tehsil
    {
        "id": "30000000-0000-0000-0000-000000000001",
        "reference_id": "MLR-000001",
        "owner_name": "Rajesh Tukaram Patil",
        "survey_number": "142/2A",
        "khasra_number": "312",
        "khata_number": "87",
        "plot_area": 2.4500,
        "plot_area_unit": "hectares",
        "village": "Wagholi",
        "tehsil": "Haveli",
        "district": "Pune",
        "land_classification": "Agricultural (Jirayat)",
        "ownership_type": "Class 1 (Occupant Class I)",
        "latitude": 18.5793,
        "longitude": 73.9822,
    },
    {
        "id": "30000000-0000-0000-0000-000000000002",
        "reference_id": "MLR-000002",
        "owner_name": "Sunita Suresh More",
        "survey_number": "89/1B",
        "khasra_number": "145",
        "khata_number": "42",
        "plot_area": 1.1200,
        "plot_area_unit": "hectares",
        "village": "Shivajinagar",
        "tehsil": "Haveli",
        "district": "Pune",
        "land_classification": "Non-Agricultural (Residential)",
        "ownership_type": "Freehold",
        "latitude": 18.5314,
        "longitude": 73.8446,
    },
    # Nashik District - Niphad Tehsil
    {
        "id": "30000000-0000-0000-0000-000000000003",
        "reference_id": "MLR-000003",
        "owner_name": "Balu Ganpat Shinde",
        "survey_number": "205/3",
        "khasra_number": "512",
        "khata_number": "104",
        "plot_area": 3.7500,
        "plot_area_unit": "hectares",
        "village": "Pimpalgaon",
        "tehsil": "Niphad",
        "district": "Nashik",
        "land_classification": "Agricultural (Bagayat - Irrigated)",
        "ownership_type": "Class 1 (Occupant Class I)",
        "latitude": 20.1712,
        "longitude": 73.9867,
    },
    # Nagpur District - Hingna Tehsil
    {
        "id": "30000000-0000-0000-0000-000000000004",
        "reference_id": "MLR-000004",
        "owner_name": "Vikas Mahadev Raut",
        "survey_number": "78/4",
        "khasra_number": "220",
        "khata_number": "63",
        "plot_area": 0.8500,
        "plot_area_unit": "hectares",
        "village": "Wadi",
        "tehsil": "Hingna",
        "district": "Nagpur",
        "land_classification": "Industrial Zone",
        "ownership_type": "Leasehold (99 Years)",
        "latitude": 21.1458,
        "longitude": 79.0021,
    },
    # Possible Duplicate reference scenario
    {
        "id": "30000000-0000-0000-0000-000000000005",
        "reference_id": "MLR-000005",
        "owner_name": "Kavita Ramesh Joshi",
        "survey_number": "142/2A",  # Same survey number, different village/district
        "khasra_number": "314",
        "khata_number": "91",
        "plot_area": 1.5000,
        "plot_area_unit": "hectares",
        "village": "Wadi",
        "tehsil": "Hingna",
        "district": "Nagpur",
        "land_classification": "Agricultural",
        "ownership_type": "Class 1",
        "latitude": 21.1390,
        "longitude": 79.0110,
    },
]


# 4. Demo Application Users
SEED_USERS = [
    {
        "id": "40000000-0000-0000-0000-000000000001",
        "email": "admin@novaax.gov.in",
        "name": "System Administrator",
        "role_id": "10000000-0000-0000-0000-000000000001",
        "administrative_scope": {"state": "Maharashtra"},
        "status": "ACTIVE",
    },
    {
        "id": "40000000-0000-0000-0000-000000000002",
        "email": "verification.officer@novaax.gov.in",
        "name": "Priya Sharma (Verification Officer)",
        "role_id": "10000000-0000-0000-0000-000000000005",
        "administrative_scope": {"state": "Maharashtra", "district": "Pune", "tehsil": "Haveli"},
        "status": "ACTIVE",
    },
    {
        "id": "40000000-0000-0000-0000-000000000003",
        "email": "district.officer@novaax.gov.in",
        "name": "Rajesh Deshmukh (District Officer)",
        "role_id": "10000000-0000-0000-0000-000000000003",
        "administrative_scope": {"state": "Maharashtra", "district": "Pune"},
        "status": "ACTIVE",
    },
    {
        "id": "40000000-0000-0000-0000-000000000004",
        "email": "citizen@example.com",
        "name": "Anand Kulkarni (Citizen)",
        "role_id": "10000000-0000-0000-0000-000000000007",
        "administrative_scope": {},
        "status": "ACTIVE",
    },
]


# 5. Demo Documents and Records representing all 4 states: APPROVED, REVIEW_REQUIRED, PROCESSING, REJECTED
SEED_DOCUMENTS = [
    # Document 1: Approved 7/12 Extract (Exact Match)
    {
        "id": "50000000-0000-0000-0000-000000000001",
        "file_name": "7-12_extract_wagholi_pune.pdf",
        "file_type": "application/pdf",
        "file_size": 1048576,
        "storage_path": "demo/2026/09/7-12_extract_wagholi_pune.pdf",
        "uploaded_by": "40000000-0000-0000-0000-000000000002",
        "language": "mr",
        "document_category": "7/12 Extract",
        "page_count": 1,
        "status": "APPROVED",
    },
    # Document 2: Review Required (Area confidence 0.65 & minor spelling variation)
    {
        "id": "50000000-0000-0000-0000-000000000002",
        "file_name": "mutation_entry_shivajinagar.pdf",
        "file_type": "application/pdf",
        "file_size": 2097152,
        "storage_path": "demo/2026/09/mutation_entry_shivajinagar.pdf",
        "uploaded_by": "40000000-0000-0000-0000-000000000002",
        "language": "mr",
        "document_category": "Mutation Entry",
        "page_count": 2,
        "status": "REVIEW_REQUIRED",
    },
    # Document 3: Active Processing Job
    {
        "id": "50000000-0000-0000-0000-000000000003",
        "file_name": "cadastral_survey_pimpalgaon.jpg",
        "file_type": "image/jpeg",
        "file_size": 3145728,
        "storage_path": "demo/2026/09/cadastral_survey_pimpalgaon.jpg",
        "uploaded_by": "40000000-0000-0000-0000-000000000002",
        "language": "mr",
        "document_category": "Cadastral Map",
        "page_count": 1,
        "status": "PROCESSING",
    },
    # Document 4: Rejected Document (Invalid/Unverified survey number)
    {
        "id": "50000000-0000-0000-0000-000000000004",
        "file_name": "property_card_unverified.png",
        "file_type": "image/png",
        "file_size": 1572864,
        "storage_path": "demo/2026/09/property_card_unverified.png",
        "uploaded_by": "40000000-0000-0000-0000-000000000004",
        "language": "en",
        "document_category": "Property Card",
        "page_count": 1,
        "status": "REJECTED",
    },
]


SEED_PROCESSING_JOBS = [
    {
        "id": "60000000-0000-0000-0000-000000000001",
        "document_id": "50000000-0000-0000-0000-000000000001",
        "status": "COMPLETED",
        "current_stage": "COMPLETED",
        "attempt_number": 1,
        "started_at": "2026-09-04T10:00:00Z",
        "completed_at": "2026-09-04T10:01:15Z",
    },
    {
        "id": "60000000-0000-0000-0000-000000000002",
        "document_id": "50000000-0000-0000-0000-000000000002",
        "status": "REVIEW_REQUIRED",
        "current_stage": "VALIDATION",
        "attempt_number": 1,
        "started_at": "2026-09-05T08:30:00Z",
        "completed_at": "2026-09-05T08:31:20Z",
    },
    {
        "id": "60000000-0000-0000-0000-000000000003",
        "document_id": "50000000-0000-0000-0000-000000000003",
        "status": "OCR_PROCESSING",
        "current_stage": "OCR",
        "attempt_number": 1,
        "started_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "60000000-0000-0000-0000-000000000004",
        "document_id": "50000000-0000-0000-0000-000000000004",
        "status": "FAILED",
        "current_stage": "VALIDATION",
        "attempt_number": 1,
        "started_at": "2026-09-03T14:00:00Z",
        "completed_at": "2026-09-03T14:01:05Z",
        "error_code": "SURVEY_NUMBER_MISMATCH",
        "error_message": "Survey number could not be reconciled against revenue records.",
    },
]


SEED_LAND_RECORDS = [
    # Record 1: Approved
    {
        "id": "70000000-0000-0000-0000-000000000001",
        "document_id": "50000000-0000-0000-0000-000000000001",
        "landowner_name": "Rajesh Tukaram Patil",
        "survey_number": "142/2A",
        "khasra_number": "312",
        "khata_number": "87",
        "plot_area": 2.4500,
        "plot_area_unit": "hectares",
        "village": "Wagholi",
        "tehsil": "Haveli",
        "district": "Pune",
        "land_classification": "Agricultural (Jirayat)",
        "ownership_type": "Class 1 (Occupant Class I)",
        "ownership_details": "Sole Proprietor - 100% Share",
        "mutation_information": "Mutation No. 4521 dated 12/03/2021",
        "registration_information": "Reg. Deed 2021/7890 Haveli Sub-Registrar",
        "status": "APPROVED",
        "approved_by": "40000000-0000-0000-0000-000000000003",
        "approved_at": "2026-09-04T15:30:00Z",
    },
    # Record 2: Review Required
    {
        "id": "70000000-0000-0000-0000-000000000002",
        "document_id": "50000000-0000-0000-0000-000000000002",
        "landowner_name": "Sunita S. More",
        "survey_number": "89/1B",
        "khasra_number": "145",
        "khata_number": "42",
        "plot_area": 1.1200,
        "plot_area_unit": "hectares",
        "village": "Shivajinagar",
        "tehsil": "Haveli",
        "district": "Pune",
        "land_classification": "Non-Agricultural (Residential)",
        "ownership_type": "Freehold",
        "ownership_details": "Joint Co-owner",
        "mutation_information": "Mutation No. 8921 pending verification",
        "status": "REVIEW_REQUIRED",
    },
    # Record 3: Rejected
    {
        "id": "70000000-0000-0000-0000-000000000004",
        "document_id": "50000000-0000-0000-0000-000000000004",
        "landowner_name": "Unknown Entity / Unverified",
        "survey_number": "999/X",
        "khasra_number": "000",
        "khata_number": "000",
        "plot_area": 0.0000,
        "plot_area_unit": "hectares",
        "village": "Wadi",
        "tehsil": "Hingna",
        "district": "Nagpur",
        "land_classification": "Unclassified",
        "ownership_type": "Disputed",
        "status": "REJECTED",
    },
]


SEED_GIS_LOCATIONS = [
    {
        "id": "80000000-0000-0000-0000-000000000001",
        "record_id": "70000000-0000-0000-0000-000000000001",
        "latitude": 18.5793,
        "longitude": 73.9822,
        "source": "DOCUMENT_METADATA",
    },
    {
        "id": "80000000-0000-0000-0000-000000000002",
        "record_id": "70000000-0000-0000-0000-000000000002",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "source": "DOCUMENT_METADATA",
    },
]


async def seed_database():
    """
    Safely seeds roles, validation rules, master dataset, and demo records
    into the existing LandSync Supabase tables without dropping or resetting anything.
    """
    client = get_supabase_client()
    if not client:
        logger.error("Supabase client not configured; cannot seed database.")
        return False

    logger.info("Starting safe database seeding on LandSync...")

    # 1. Seed Roles
    for role in SEED_ROLES:
        try:
            client.table("roles").upsert(role, on_conflict="code").execute()
            logger.info(f"Seeded role: {role['code']}")
        except Exception as e:
            logger.error(f"Failed seeding role {role['code']}: {e}")

    # 2. Seed Validation Rules
    for rule in SEED_VALIDATION_RULES:
        try:
            client.table("validation_rules").upsert(rule, on_conflict="rule_code").execute()
            logger.info(f"Seeded validation rule: {rule['rule_code']}")
        except Exception as e:
            logger.error(f"Failed seeding rule {rule['rule_code']}: {e}")

    # 3. Seed Master Land Records
    for master in SEED_MASTER_RECORDS:
        try:
            client.table("master_land_records").upsert(master, on_conflict="reference_id").execute()
            logger.info(f"Seeded master record: {master['reference_id']} ({master['village']})")
        except Exception as e:
            logger.error(f"Failed seeding master record {master['reference_id']}: {e}")

    # 4. Seed Demo Users
    for user in SEED_USERS:
        try:
            client.table("users").upsert(user, on_conflict="email").execute()
            logger.info(f"Seeded demo user: {user['email']}")
        except Exception as e:
            logger.error(f"Failed seeding user {user['email']}: {e}")

    # 5. Seed Demo Documents
    for doc in SEED_DOCUMENTS:
        try:
            client.table("documents").upsert(doc, on_conflict="id").execute()
            logger.info(f"Seeded document: {doc['file_name']}")
        except Exception as e:
            logger.error(f"Failed seeding document {doc['file_name']}: {e}")

    # 6. Seed Demo Processing Jobs
    for job in SEED_PROCESSING_JOBS:
        try:
            client.table("processing_jobs").upsert(job, on_conflict="id").execute()
            logger.info(f"Seeded processing job: {job['id']} ({job['status']})")
        except Exception as e:
            logger.error(f"Failed seeding job {job['id']}: {e}")

    # 7. Seed Demo Land Records
    for rec in SEED_LAND_RECORDS:
        try:
            client.table("land_records").upsert(rec, on_conflict="id").execute()
            logger.info(f"Seeded land record: {rec['id']} ({rec['status']})")
        except Exception as e:
            logger.error(f"Failed seeding land record {rec['id']}: {e}")

    # 8. Seed GIS Locations
    for gis in SEED_GIS_LOCATIONS:
        try:
            client.table("gis_locations").upsert(gis, on_conflict="id").execute()
            logger.info(f"Seeded GIS location for record {gis['record_id']}")
        except Exception as e:
            logger.error(f"Failed seeding GIS location: {e}")

    logger.info("Seed operation completed successfully!")
    return True


if __name__ == "__main__":
    asyncio.run(seed_database())
