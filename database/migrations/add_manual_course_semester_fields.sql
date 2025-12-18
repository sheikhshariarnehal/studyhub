-- Add course_name, semester_id, and semester_name columns to study_tools table
-- These fields allow resources to have either a linked course/semester OR a manually entered name

-- Add course_name column for manual course entry
ALTER TABLE study_tools 
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);

-- Add semester_id column to link to existing semesters
ALTER TABLE study_tools 
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;

-- Add semester_name column for manual semester entry
ALTER TABLE study_tools 
ADD COLUMN IF NOT EXISTS semester_name VARCHAR(255);

-- Add index for semester_id for better query performance
CREATE INDEX IF NOT EXISTS idx_study_tools_semester_id ON study_tools(semester_id);

-- Add index for course_name for search
CREATE INDEX IF NOT EXISTS idx_study_tools_course_name ON study_tools(course_name);

-- Add index for semester_name for search
CREATE INDEX IF NOT EXISTS idx_study_tools_semester_name ON study_tools(semester_name);

-- Comment on the columns
COMMENT ON COLUMN study_tools.course_name IS 'Manually entered course name when course_id is not provided';
COMMENT ON COLUMN study_tools.semester_id IS 'Reference to semesters table (optional)';
COMMENT ON COLUMN study_tools.semester_name IS 'Manually entered semester name when semester_id is not provided';
