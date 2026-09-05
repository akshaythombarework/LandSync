-- ==============================================================================
-- LandSync Storage & RLS Configuration Migration
-- Migration: 20260905000002_storage_and_rls.sql
-- Description: Sets up private storage bucket 'land-records' and enables
--              Row-Level Security (RLS) across all 17 tables as defense-in-depth.
-- Target: suqpurzuidopcfjplvzo (LandSync)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Private Storage Bucket 'land-records'
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'land-records',
    'land-records',
    false,
    26214400, -- 25 MB max file size
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- 2. Enable Row Level Security (RLS) on All 17 Application Tables
-- ------------------------------------------------------------------------------

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_land_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. Baseline Security Policies (Defense-in-Depth)
-- Note: FastAPI backend connects via SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- and serves as the authoritative enforcement point for RBAC and geographic scope.
-- Direct client access is restricted to authenticated sessions.
-- ------------------------------------------------------------------------------

-- Lookup tables: Read-only for authenticated users
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_roles') THEN
        CREATE POLICY authenticated_read_roles ON roles FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_validation_rules') THEN
        CREATE POLICY authenticated_read_validation_rules ON validation_rules FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- Users: Authenticated users can view user profiles; individual users can update their own profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_users') THEN
        CREATE POLICY authenticated_read_users ON users FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'self_update_users') THEN
        CREATE POLICY self_update_users ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id);
    END IF;
END $$;

-- Notifications: Users only see and update their own notifications
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_read_notifications') THEN
        CREATE POLICY user_read_notifications ON notifications FOR SELECT TO authenticated
        USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_update_notifications') THEN
        CREATE POLICY user_update_notifications ON notifications FOR UPDATE TO authenticated
        USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
    END IF;
END $$;

-- Core Application Entities: Defense-in-depth authenticated read policies (no anonymous/public access)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_documents') THEN
        CREATE POLICY authenticated_read_documents ON documents FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_document_pages') THEN
        CREATE POLICY authenticated_read_document_pages ON document_pages FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_processing_jobs') THEN
        CREATE POLICY authenticated_read_processing_jobs ON processing_jobs FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_ocr_results') THEN
        CREATE POLICY authenticated_read_ocr_results ON ocr_results FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_land_records') THEN
        CREATE POLICY authenticated_read_land_records ON land_records FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_record_fields') THEN
        CREATE POLICY authenticated_read_record_fields ON record_fields FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_validation_results') THEN
        CREATE POLICY authenticated_read_validation_results ON validation_results FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_reviews') THEN
        CREATE POLICY authenticated_read_reviews ON reviews FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_review_changes') THEN
        CREATE POLICY authenticated_read_review_changes ON review_changes FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_approvals') THEN
        CREATE POLICY authenticated_read_approvals ON approvals FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_master_land_records') THEN
        CREATE POLICY authenticated_read_master_land_records ON master_land_records FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_gis_locations') THEN
        CREATE POLICY authenticated_read_gis_locations ON gis_locations FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_audit_logs') THEN
        CREATE POLICY authenticated_read_audit_logs ON audit_logs FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Storage Bucket Policies for 'land-records'
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_read_land_records_storage' AND tablename = 'objects') THEN
        CREATE POLICY authenticated_read_land_records_storage ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'land-records');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_insert_land_records_storage' AND tablename = 'objects') THEN
        CREATE POLICY authenticated_insert_land_records_storage ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'land-records');
    END IF;
END $$;
