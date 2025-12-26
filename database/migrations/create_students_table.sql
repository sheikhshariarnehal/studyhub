-- Create students table for student authentication
-- Students can log in with just email, department, and batch (no password required)
CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "student_id" character varying(100),
    "phone" character varying(20),
    "department_id" "uuid",
    "batch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "students_email_key" UNIQUE ("email"),
    CONSTRAINT "valid_email" CHECK ((("email")::"text" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))
);

ALTER TABLE "public"."students" OWNER TO "postgres";

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "students_email_idx" ON "public"."students" ("email");
CREATE INDEX IF NOT EXISTS "students_department_batch_idx" ON "public"."students" ("department_id", "batch_id");

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION "public"."update_students_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "update_students_updated_at" ON "public"."students";
CREATE TRIGGER "update_students_updated_at"
    BEFORE UPDATE ON "public"."students"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_students_updated_at"();

-- Create student_sessions table for session management
CREATE TABLE IF NOT EXISTS "public"."student_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "session_token" character varying NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "student_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE,
    CONSTRAINT "student_sessions_expires_check" CHECK (("expires_at" > "created_at"))
);

ALTER TABLE "public"."student_sessions" OWNER TO "postgres";

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS "student_sessions_token_idx" ON "public"."student_sessions" ("session_token");
CREATE INDEX IF NOT EXISTS "student_sessions_student_id_idx" ON "public"."student_sessions" ("student_id");

-- Create RLS policies for students table (optional - can be enabled later)
-- ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Students can view their own profile" ON "public"."students"
--     FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Students can update their own profile" ON "public"."students"
--     FOR UPDATE USING (auth.uid() = id);

COMMENT ON TABLE "public"."students" IS 'Students table for student authentication without passwords';
COMMENT ON COLUMN "public"."students"."email" IS 'Student email address (unique identifier)';
COMMENT ON COLUMN "public"."students"."department_id" IS 'Current department selection (can be changed)';
COMMENT ON COLUMN "public"."students"."batch_id" IS 'Current batch selection (can be changed)';
