-- Migration: Add Departments, Sections, and Batches tables for user profile
-- Date: 2024-12-24
-- Description: Creates departments, sections, and batches tables and updates admin_users

-- =====================================================
-- BATCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "public"."batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_number" integer NOT NULL,
    "batch_name" character varying(100) NOT NULL,
    "start_year" integer,
    "end_year" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "batches_batch_number_unique" UNIQUE ("batch_number")
);

ALTER TABLE "public"."batches" OWNER TO "postgres";

-- Insert some default batches
INSERT INTO "public"."batches" ("batch_number", "batch_name", "start_year", "end_year") VALUES
(60, 'Batch 60', 2021, 2025),
(61, 'Batch 61', 2021, 2025),
(62, 'Batch 62', 2022, 2026),
(63, 'Batch 63', 2022, 2026),
(64, 'Batch 64', 2023, 2027),
(65, 'Batch 65', 2023, 2027)
ON CONFLICT ("batch_number") DO NOTHING;

-- =====================================================
-- DEPARTMENTS TABLE
-- =====================================================
-- Create departments table
CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "short_name" character varying(50) NOT NULL,
    "description" "text",
    "faculty" character varying(255),
    "is_active" boolean DEFAULT true,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "departments_short_name_unique" UNIQUE ("short_name")
);

ALTER TABLE "public"."departments" OWNER TO "postgres";

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_departments_short_name" ON "public"."departments" ("short_name");
CREATE INDEX IF NOT EXISTS "idx_departments_is_active" ON "public"."departments" ("is_active");

-- =====================================================
-- SECTIONS TABLE
-- =====================================================
-- Create sections table
CREATE TABLE IF NOT EXISTS "public"."sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "department_id" "uuid",
    "batch_id" "uuid",
    "is_active" boolean DEFAULT true,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sections_department_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL,
    CONSTRAINT "sections_batch_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE SET NULL
);

ALTER TABLE "public"."sections" OWNER TO "postgres";

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_sections_department_id" ON "public"."sections" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_sections_batch_id" ON "public"."sections" ("batch_id");
CREATE INDEX IF NOT EXISTS "idx_sections_is_active" ON "public"."sections" ("is_active");

-- =====================================================
-- UPDATE ADMIN_USERS TABLE
-- =====================================================
-- Add missing columns to admin_users
ALTER TABLE "public"."admin_users" 
ADD COLUMN IF NOT EXISTS "bio" "text",
ADD COLUMN IF NOT EXISTS "avatar_url" "text",
ADD COLUMN IF NOT EXISTS "social_links" "jsonb" DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "student_id" character varying(50),
ADD COLUMN IF NOT EXISTS "batch_id" "uuid",
ADD COLUMN IF NOT EXISTS "is_approved" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "department_id" "uuid",
ADD COLUMN IF NOT EXISTS "section_id" "uuid";

-- Add foreign key constraints
ALTER TABLE "public"."admin_users"
ADD CONSTRAINT "admin_users_batch_fkey" 
FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE SET NULL;

ALTER TABLE "public"."admin_users"
ADD CONSTRAINT "admin_users_department_fkey" 
FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;

ALTER TABLE "public"."admin_users"
ADD CONSTRAINT "admin_users_section_fkey" 
FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_admin_users_batch_id" ON "public"."admin_users" ("batch_id");
CREATE INDEX IF NOT EXISTS "idx_admin_users_department_id" ON "public"."admin_users" ("department_id");
CREATE INDEX IF NOT EXISTS "idx_admin_users_section_id" ON "public"."admin_users" ("section_id");

-- =====================================================
-- INSERT DEFAULT DEPARTMENTS (DIU Departments)
-- =====================================================
INSERT INTO "public"."departments" ("name", "short_name", "description", "faculty", "order_index") VALUES
('Computer Science and Engineering', 'CSE', 'Department of Computer Science and Engineering', 'Faculty of Science & Information Technology', 1),
('Software Engineering', 'SWE', 'Department of Software Engineering', 'Faculty of Science & Information Technology', 2),
('Information Technology', 'IT', 'Department of Information Technology', 'Faculty of Science & Information Technology', 3),
('Electrical and Electronic Engineering', 'EEE', 'Department of Electrical and Electronic Engineering', 'Faculty of Engineering', 4),
('Civil Engineering', 'CE', 'Department of Civil Engineering', 'Faculty of Engineering', 5),
('Architecture', 'ARCH', 'Department of Architecture', 'Faculty of Engineering', 6),
('Business Administration', 'BBA', 'Department of Business Administration', 'Faculty of Business & Entrepreneurship', 7),
('Accounting & Information Systems', 'AIS', 'Department of Accounting & Information Systems', 'Faculty of Business & Entrepreneurship', 8),
('Tourism and Hospitality Management', 'THM', 'Department of Tourism and Hospitality Management', 'Faculty of Business & Entrepreneurship', 9),
('Real Estate', 'RE', 'Department of Real Estate', 'Faculty of Business & Entrepreneurship', 10),
('English', 'ENG', 'Department of English', 'Faculty of Humanities & Social Sciences', 11),
('Law', 'LAW', 'Department of Law', 'Faculty of Humanities & Social Sciences', 12),
('Journalism, Media and Communication', 'JMC', 'Department of Journalism, Media and Communication', 'Faculty of Humanities & Social Sciences', 13),
('Environmental Science and Disaster Management', 'ESDM', 'Department of Environmental Science and Disaster Management', 'Faculty of Allied Health Sciences', 14),
('Pharmacy', 'PHAR', 'Department of Pharmacy', 'Faculty of Allied Health Sciences', 15),
('Public Health', 'PH', 'Department of Public Health', 'Faculty of Allied Health Sciences', 16),
('Nutrition and Food Engineering', 'NFE', 'Department of Nutrition and Food Engineering', 'Faculty of Allied Health Sciences', 17),
('Textile Engineering', 'TE', 'Department of Textile Engineering', 'Faculty of Engineering', 18),
('Multimedia and Creative Technology', 'MCT', 'Department of Multimedia and Creative Technology', 'Faculty of Science & Information Technology', 19),
('Computing and Information System', 'CIS', 'Department of Computing and Information System', 'Faculty of Science & Information Technology', 20)
ON CONFLICT ("short_name") DO NOTHING;

-- =====================================================
-- INSERT DEFAULT SECTIONS (Common Sections)
-- =====================================================
-- Get CSE department ID for default sections
DO $$
DECLARE
    cse_dept_id uuid;
BEGIN
    SELECT id INTO cse_dept_id FROM "public"."departments" WHERE "short_name" = 'CSE' LIMIT 1;
    
    -- Insert common sections
    IF cse_dept_id IS NOT NULL THEN
        INSERT INTO "public"."sections" ("name", "description", "department_id", "order_index") VALUES
        ('A', 'Section A', cse_dept_id, 1),
        ('B', 'Section B', cse_dept_id, 2),
        ('C', 'Section C', cse_dept_id, 3),
        ('D', 'Section D', cse_dept_id, 4),
        ('E', 'Section E', cse_dept_id, 5),
        ('F', 'Section F', cse_dept_id, 6),
        ('G', 'Section G', cse_dept_id, 7),
        ('H', 'Section H', cse_dept_id, 8),
        ('I', 'Section I', cse_dept_id, 9),
        ('J', 'Section J', cse_dept_id, 10),
        ('K', 'Section K', cse_dept_id, 11),
        ('L', 'Section L', cse_dept_id, 12),
        ('PC-A', 'Permanent Campus Section A', cse_dept_id, 13),
        ('PC-B', 'Permanent Campus Section B', cse_dept_id, 14),
        ('PC-C', 'Permanent Campus Section C', cse_dept_id, 15)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================
-- Trigger for batches
DROP TRIGGER IF EXISTS "update_batches_updated_at" ON "public"."batches";
CREATE TRIGGER "update_batches_updated_at"
    BEFORE UPDATE ON "public"."batches"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Trigger for departments
DROP TRIGGER IF EXISTS "update_departments_updated_at" ON "public"."departments";
CREATE TRIGGER "update_departments_updated_at"
    BEFORE UPDATE ON "public"."departments"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Trigger for sections
DROP TRIGGER IF EXISTS "update_sections_updated_at" ON "public"."sections";
CREATE TRIGGER "update_sections_updated_at"
    BEFORE UPDATE ON "public"."sections"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE "public"."batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;

-- Batches: Allow anyone to read, only admins to modify
CREATE POLICY "batches_read_policy" ON "public"."batches"
    FOR SELECT USING (true);

CREATE POLICY "batches_write_policy" ON "public"."batches"
    FOR ALL USING (auth.role() = 'authenticated');

-- Departments: Allow anyone to read, only admins to modify
CREATE POLICY "departments_read_policy" ON "public"."departments"
    FOR SELECT USING (true);

CREATE POLICY "departments_write_policy" ON "public"."departments"
    FOR ALL USING (auth.role() = 'authenticated');

-- Sections: Allow anyone to read, only admins to modify
CREATE POLICY "sections_read_policy" ON "public"."sections"
    FOR SELECT USING (true);

CREATE POLICY "sections_write_policy" ON "public"."sections"
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE "public"."batches" IS 'Student batches list';
COMMENT ON TABLE "public"."departments" IS 'University departments list';
COMMENT ON TABLE "public"."sections" IS 'Class sections within departments';
COMMENT ON COLUMN "public"."admin_users"."department_id" IS 'Reference to user department';
COMMENT ON COLUMN "public"."admin_users"."section_id" IS 'Reference to user section';
COMMENT ON COLUMN "public"."admin_users"."batch_id" IS 'Reference to user batch';

