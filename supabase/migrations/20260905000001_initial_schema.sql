-- ==============================================================================
-- LandSync Database Foundation Migration
-- Migration: 20260905000001_initial_schema.sql
-- Description: Core schema with PostGIS, 17 tables, foreign keys, constraints,
--              sequences, triggers, and performance indexes.
-- Target: suqpurzuidopcfjplvzo (LandSync)
-- ==============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Sequences for Human-Readable Atomic Display IDs
CREATE SEQUENCE IF NOT EXISTS documents_seq START 1;
CREATE SEQUENCE IF NOT EXISTS land_records_seq START 1;
CREATE SEQUENCE IF NOT EXISTS users_seq START 1;
CREATE SEQUENCE IF NOT EXISTS master_records_seq START 1;

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. Application Tables
-- ------------------------------------------------------------------------------

-- Table 1: roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    display_id VARCHAR(50) NOT NULL UNIQUE DEFAULT ('USR-' || LPAD(nextval('users_seq'::regclass)::text, 6, '0')),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    administrative_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id VARCHAR(50) NOT NULL UNIQUE DEFAULT ('DOC-' || LPAD(nextval('documents_seq'::regclass)::text, 6, '0')),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/jpg')),
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    language VARCHAR(50) DEFAULT 'en',
    document_category VARCHAR(100) DEFAULT 'LAND_RECORD',
    page_count INT NOT NULL DEFAULT 1 CHECK (page_count >= 1),
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: document_pages
CREATE TABLE IF NOT EXISTS document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL CHECK (page_number >= 1),
    image_path VARCHAR(500),
    width INT,
    height INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_document_page UNIQUE (document_id, page_number)
);

-- Table 5: processing_jobs
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'OCR_PROCESSING', 'EXTRACTION_PROCESSING', 'VALIDATION_PROCESSING', 'COMPLETED', 'REVIEW_REQUIRED', 'FAILED', 'CANCELLED')),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'PREPROCESSING' CHECK (current_stage IN ('PREPROCESSING', 'CLASSIFICATION', 'LAYOUT', 'OCR', 'EXTRACTION', 'CONFIDENCE', 'VALIDATION', 'COMPLETED', 'FAILED')),
    attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: ocr_results
CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_id UUID REFERENCES document_pages(id) ON DELETE SET NULL,
    raw_text TEXT NOT NULL,
    ocr_engine VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL,
    confidence NUMERIC(5, 4) CHECK (confidence >= 0 AND confidence <= 1.0),
    blocks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: land_records
CREATE TABLE IF NOT EXISTS land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id VARCHAR(50) NOT NULL UNIQUE DEFAULT ('LR-' || LPAD(nextval('land_records_seq'::regclass)::text, 6, '0')),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    landowner_name VARCHAR(255),
    survey_number VARCHAR(100),
    khasra_number VARCHAR(100),
    khata_number VARCHAR(100),
    plot_area NUMERIC(12, 4) CHECK (plot_area >= 0),
    plot_area_unit VARCHAR(50) DEFAULT 'hectares',
    village VARCHAR(100),
    tehsil VARCHAR(100),
    district VARCHAR(100),
    land_classification VARCHAR(100),
    ownership_type VARCHAR(100),
    ownership_details TEXT,
    mutation_information TEXT,
    registration_information TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'EXTRACTED', 'VALIDATION_PENDING', 'REVIEW_REQUIRED', 'CORRECTED', 'APPROVED', 'REJECTED')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: record_fields
CREATE TABLE IF NOT EXISTS record_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    original_value TEXT,
    normalized_value TEXT,
    language VARCHAR(50),
    confidence NUMERIC(5, 4) CHECK (confidence >= 0 AND confidence <= 1.0),
    source_page INT,
    source_bbox JSONB,
    source_type VARCHAR(50) DEFAULT 'AI_EXTRACTION' CHECK (source_type IN ('AI_EXTRACTION', 'HUMAN_CORRECTION', 'MASTER_LOOKUP', 'SYSTEM_DEFAULT')),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_record_field UNIQUE (record_id, field_name)
);

-- Table 9: validation_rules
CREATE TABLE IF NOT EXISTS validation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    field_name VARCHAR(100),
    severity VARCHAR(50) NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    active BOOLEAN NOT NULL DEFAULT true,
    rule_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: validation_results
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES validation_rules(id) ON DELETE SET NULL,
    field_name VARCHAR(100),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('PASSED', 'FAILED', 'WARNING', 'NOT_CHECKED')),
    message TEXT NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: review_changes
CREATE TABLE IF NOT EXISTS review_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 13: approvals
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    approved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('APPROVED', 'REJECTED')),
    approval_notes TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 14: master_land_records
CREATE TABLE IF NOT EXISTS master_land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(100) NOT NULL UNIQUE DEFAULT ('MLR-' || LPAD(nextval('master_records_seq'::regclass)::text, 6, '0')),
    owner_name VARCHAR(255) NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    khasra_number VARCHAR(100),
    khata_number VARCHAR(100),
    plot_area NUMERIC(12, 4) NOT NULL CHECK (plot_area > 0),
    plot_area_unit VARCHAR(50) NOT NULL DEFAULT 'hectares',
    village VARCHAR(100) NOT NULL,
    tehsil VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    land_classification VARCHAR(100),
    ownership_type VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 15: gis_locations
CREATE TABLE IF NOT EXISTS gis_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    geometry geometry(Geometry, 4326),
    source VARCHAR(100) DEFAULT 'DOCUMENT_METADATA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 17: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Updated_at Triggers
-- ------------------------------------------------------------------------------

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_processing_jobs_updated_at BEFORE UPDATE ON processing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_land_records_updated_at BEFORE UPDATE ON land_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_record_fields_updated_at BEFORE UPDATE ON record_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_validation_rules_updated_at BEFORE UPDATE ON validation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_master_land_records_updated_at BEFORE UPDATE ON master_land_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_gis_locations_updated_at BEFORE UPDATE ON gis_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. Indexes for Performance & Queries
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_document ON processing_jobs(document_id, status);
CREATE INDEX IF NOT EXISTS idx_ocr_results_document ON ocr_results(document_id);

CREATE INDEX IF NOT EXISTS idx_land_records_document ON land_records(document_id);
CREATE INDEX IF NOT EXISTS idx_land_records_status ON land_records(status);
CREATE INDEX IF NOT EXISTS idx_land_records_geo_lookup ON land_records(district, tehsil, village, survey_number);

CREATE INDEX IF NOT EXISTS idx_record_fields_record ON record_fields(record_id, field_name);
CREATE INDEX IF NOT EXISTS idx_validation_results_record ON validation_results(record_id);

CREATE INDEX IF NOT EXISTS idx_reviews_record ON reviews(record_id, status);
CREATE INDEX IF NOT EXISTS idx_review_changes_review ON review_changes(review_id);

CREATE INDEX IF NOT EXISTS idx_master_land_records_lookup ON master_land_records(district, tehsil, village, survey_number);
CREATE INDEX IF NOT EXISTS idx_gis_locations_geom ON gis_locations USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
