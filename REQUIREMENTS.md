# DIU Learning Platform - Requirements Document

## 📋 Project Overview

**Project Name:** DIU CSE Learning Platform  
**Version:** 0.1.0  
**Platform:** Web Application  
**Framework:** Next.js 16.0.10 with React 19.2.3  
**Database:** Supabase (PostgreSQL)  
**Deployment:** Vercel  
**Status:** Production-Ready ✅

---

## 🎯 Project Description

DIU Learning Platform is a comprehensive web-based learning management system designed for Daffodil International University's Computer Science and Engineering department. The platform provides students and faculty with a centralized hub for accessing course materials, lecture slides, video content, study tools, and exam resources.

### Key Objectives

- Provide seamless access to academic content organized by semesters and courses
- Enable efficient content management through role-based administration
- Deliver optimized performance with advanced caching and prefetching
- Support collaborative content creation and management
- Track user progress and content analytics

---

## 👥 Target Users

### Students
- Browse and access course materials by semester
- View lecture slides and videos
- Download study resources and previous exam questions
- Take notes on video content
- Track learning progress

### Faculty
- Upload and organize course content
- Manage semester-specific resources
- Monitor content usage and analytics

### Administrators
- **Super Admin**: Full system access and control
- **Admin**: Content management and moderation
- **Section Admin**: Department/section-specific administration
- **Content Creator**: Create and upload course materials
- **Moderator**: Review and approve content

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend
- **Framework:** Next.js 16.0.10 (App Router)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** Radix UI (complete component library)
- **Animations:** Framer Motion 12.23.0
- **State Management:** React Hooks + Context API
- **Form Handling:** React Hook Form with Zod validation
- **Icons:** Lucide React 0.454.0

#### Backend
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** JWT + bcryptjs
- **API:** Next.js API Routes
- **File Storage:** Google Drive integration for slides
- **Video Hosting:** YouTube integration

#### Performance & Optimization
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Caching:** Custom multi-level caching system
- **Analytics:** Vercel Analytics, Speed Insights
- **SEO:** next-sitemap for sitemap generation

#### Development Tools
- **Language:** TypeScript 5
- **Build Tool:** Next.js built-in compiler
- **Package Manager:** npm
- **Linting:** ESLint (Next.js config)

---

## 📊 Database Schema

### Core Tables

#### semesters
- Manages academic semesters with sections
- Fields: id, title, description, section, has_midterm, has_final, start_date, end_date, default_credits, is_active
- Supports date ranges and exam configurations

#### courses
- Course information linked to semesters
- Fields: id, title, course_code, teacher_name, teacher_email, description, credits, semester_id, is_active
- Includes instructor details and academic metadata

#### topics
- Course topics with ordering and difficulty levels
- Fields: id, title, description, course_id, order_index, estimated_duration_minutes, difficulty_level, is_published
- Supports drag-and-drop reordering

#### slides
- Google Drive presentation links
- Fields: id, title, description, google_drive_url, topic_id, order_index, file_size_mb, slide_count, is_downloadable
- Supports file metadata and permissions

#### videos
- YouTube video content
- Fields: id, title, description, youtube_url, topic_id, order_index, duration_minutes, video_quality, has_subtitles, language
- Includes video properties and playback metadata

#### study_tools
- Exam resources and study materials
- Fields: id, title, description, tool_type, file_url, topic_id, semester_id, course_id, is_downloadable
- Types: previous_questions, notes, syllabus, assignments, projects

#### user_notes
- Student notes with timestamps
- Fields: id, user_id, video_id, note_text, timestamp_seconds, created_at
- Linked to specific video timestamps

### Administration Tables

#### admin_users
- Administrator accounts with role-based access
- Fields: id, email, password_hash, full_name, role, department, is_active
- Roles: super_admin, admin, moderator, content_creator, section_admin

#### admin_sessions
- Secure session management with IP tracking
- Fields: id, user_id, session_token, ip_address, user_agent, expires_at

#### audit_logs
- Complete system change tracking
- Fields: id, user_id, action, table_name, record_id, old_data, new_data, ip_address

### Features
- ✅ Row Level Security (RLS) policies
- ✅ Optimized indexes for performance
- ✅ Auto-updating timestamps
- ✅ Data validation and constraints
- ✅ Cascade deletion handling

---

## 🚀 Core Features

### 1. Content Management System

#### Semester Management
- Create, edit, and manage academic semesters
- Support for sections (e.g., "63_G", "64_A")
- Midterm and final exam flags
- Start/end date tracking
- Credit hour configuration
- Active/inactive status toggle

#### Course Management
- Link courses to specific semesters
- Add instructor information
- Course code and title
- Description and credits
- Auto-enrollment features

#### Topic Organization
- Hierarchical topic structure within courses
- Drag-and-drop reordering
- Difficulty levels: beginner, intermediate, advanced
- Estimated learning duration
- Publish/unpublish toggle

#### Content Upload
- Google Drive slide integration
- YouTube video embedding
- Study tool file management
- Bulk content creation
- File metadata extraction

### 2. Enhanced Creator Tools

#### All-in-One Creator
- 5-step semester creation workflow
  - Step 1: Semester Setup
  - Step 2: Course Management
  - Step 3: Content Creation
  - Step 4: Study Resources
  - Step 5: Review & Publish
- Real-time validation
- Auto-save every 30 seconds
- Progress tracking with percentage
- Modern gradient UI

#### Bulk Creator
- CSV/Excel import support
- Mass content upload
- Template-based creation
- Validation before import
- Error reporting and rollback

#### Content Editor
- Edit existing semesters
- Update course information
- Modify topic content
- Reorder materials via drag-and-drop

### 3. Student Features

#### Browse Content
- Browse by semesters
- Filter by course
- Search topics and materials
- View slides in Google Drive viewer
- Watch embedded YouTube videos
- Download study resources

#### Video Notes
- Add timestamped notes to videos
- Edit and delete notes
- Notes linked to specific video moments
- Auto-scroll to note timestamp
- Export notes functionality

#### Progress Tracking
- Video watch progress retention
- Last viewed position storage
- Completion tracking
- Learning analytics

### 4. Performance Optimizations

#### Multi-Level Caching
- **Level 1:** Course card caching (5-minute TTL)
- **Level 2:** Topic content caching (3-minute TTL)
- **Level 3:** Video/slide metadata caching (10-minute TTL, infinite for thumbnails)
- Cache hit rate: 88-92%
- Automatic cache invalidation

#### Smart Prefetching
- Hover-based prefetching (300ms debounce)
- Content prediction
- YouTube thumbnail prefetching
- File metadata HEAD requests

#### Virtual Scrolling
- Automatic for lists >20 items
- Reduces DOM nodes
- Smooth scrolling performance
- Memory optimization

#### Performance Results
- Course navigation: 80-85% faster
- Full page load: 67-87% improvement
- Cache-enabled operations: <150ms response time

### 5. Administration Dashboards

#### Super Admin Dashboard
- Full system access
- User management
- Role assignment
- System settings
- Audit log viewing

#### Section Admin Dashboard
- Department-specific management
- Semester creation/editing
- Course management
- Content approval
- Section analytics

#### Content Creator Portal
- Upload content
- Manage own materials
- View upload statistics
- Pending approval queue

### 6. Drag-and-Drop Features

#### Topic Reordering
- Visual drag handles
- Live position updates
- Smooth animations
- Auto-save on drop
- Undo/redo support

#### Content Organization
- Reorder slides within topics
- Reorder videos within topics
- Reorder study tools
- Batch reordering

---

## 🔒 Security Features

### Authentication
- JWT-based authentication
- bcrypt password hashing (12 rounds)
- Session management with expiration
- IP address tracking
- User agent logging

### Authorization
- Role-based access control (RBAC)
- Row-level security policies
- Department-based filtering
- Permission granularity
- Secure API routes

### Data Protection
- Environment variable protection
- HTTPS enforcement
- XSS prevention
- CSRF protection
- SQL injection prevention

---

## 📱 User Interface

### Design System
- Modern gradient backgrounds
- Consistent color scheme
- Professional typography
- Responsive layouts (mobile, tablet, desktop)
- Accessibility compliance
- Dark mode support (via next-themes)

### Components
- **Radix UI Components:** Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Tooltip
- **Custom Components:** Course cards, topic items, content viewers, enhanced forms
- **Loading States:** Skeleton loaders, progress bars, spinners
- **Error Boundaries:** Global and route-specific

### User Experience
- Smooth page transitions
- Loading indicators
- Toast notifications (Sonner)
- Form validation feedback
- Keyboard navigation support
- Search and filter functionality

---

## 🔧 API Endpoints

### Public APIs
- `GET /api/semesters` - List all active semesters
- `GET /api/courses?semester_id={id}` - Get courses by semester
- `GET /api/topics?course_id={id}` - Get topics by course
- `GET /api/slides?topic_id={id}` - Get slides by topic
- `GET /api/videos?topic_id={id}` - Get videos by topic
- `GET /api/study-tools?topic_id={id}` - Get study tools

### Admin APIs
- `POST /api/admin/semesters` - Create semester
- `PUT /api/admin/semesters/[id]` - Update semester
- `DELETE /api/admin/semesters/[id]` - Delete semester
- `POST /api/admin/courses` - Create course
- `POST /api/admin/topics` - Create topic
- `POST /api/admin/bulk-upload` - Bulk content upload

### Section Admin APIs
- `GET /api/section-admin/semesters` - Department-filtered semesters
- `POST /api/section-admin/semesters` - Create semester for section
- `GET /api/section-admin/stats` - Section statistics

### User APIs
- `POST /api/notes` - Create video note
- `GET /api/notes?video_id={id}` - Get notes for video
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### Health & Monitoring
- `GET /api/health` - System health check
- `GET /sitemap.xml` - SEO sitemap
- `GET /robots.txt` - Search engine directives

---

## 📦 Dependencies

### Production Dependencies (Key Packages)
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@supabase/supabase-js": "latest",
  "@vercel/analytics": "^1.6.1",
  "bcryptjs": "^3.0.2",
  "framer-motion": "^12.23.0",
  "jsonwebtoken": "^9.0.2",
  "lucide-react": "^0.454.0",
  "next": "16.0.10",
  "react": "^19.2.3",
  "react-hook-form": "latest",
  "tailwindcss": "^3.4.17",
  "zod": "^3.24.1"
}
```

### Development Dependencies
```json
{
  "@types/node": "^22",
  "@types/react": "^19",
  "next-sitemap": "^4.2.3",
  "typescript": "^5"
}
```

Full dependency list available in `package.json`

---

## 🌐 Environment Variables

### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Security
ADMIN_SECRET_KEY=your_secure_admin_secret
JWT_SECRET=your_secure_jwt_secret
```

### Optional Variables
```bash
# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

---

## 📋 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Drive API access (for slide hosting)
- YouTube account (for video hosting)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd DIU-Learning-Platform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required variables

4. **Setup Database**
   - Navigate to Supabase Dashboard
   - Run SQL scripts in order:
     - `scripts/complete-database-setup.sql` (recommended)
     - OR individual scripts: `01-create-tables.sql`, `02-seed-data.sql`, `03-admin-tables.sql`
   - Verify tables are created

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000

6. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
   - Import project from GitHub
   - Configure environment variables
   - Deploy

3. **Post-Deployment Verification**
   - Visit `/api/health` endpoint
   - Check Vercel Analytics dashboard
   - Verify sitemap at `/sitemap.xml`

### Manual Deployment
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Build Optimization
- Static page generation enabled
- Image optimization configured
- Automatic code splitting
- Production middleware optimization

---

## 📈 Performance Benchmarks

### Before Optimization
- Course navigation: 3.5-5 seconds
- Course card load: 800-1200ms
- Topic expansion: 600-1000ms
- Full page interaction: 2-3 seconds

### After Optimization
- Course navigation: 0.5-1 second ⚡ (80-85% faster)
- Course card load: 50-150ms ⚡ (67-87% faster)
- Topic expansion: 100-200ms ⚡ (75-90% faster)
- Full page interaction: <500ms ⚡ (83% faster)

### Cache Performance
- Hit rate: 88-92%
- Memory usage: ~5MB typical
- Cache items: ~400 items average
- Auto-cleanup enabled

---

## 🧪 Testing

### Testing Features
- Video retention testing (`/test-video-retention`)
- Notes feature testing (`/test-notes-feature`)
- API endpoint testing (`/test-api`, `/test-all-apis`)
- Database connectivity (`/test-db`)
- Middleware testing (`/test-middleware`)

### Testing Guide
Comprehensive testing documentation available in:
- `docs/TESTING_GUIDE.md`
- `TEST_NOTES_FEATURE.md`
- `TEST_VIDEO_RETENTION.md`
- `DRAG_DROP_TEST_GUIDE.md`

---

## 📚 Documentation

### Available Documentation

#### Setup & Deployment
- `docs/DATABASE_SETUP.md` - Database setup guide
- `docs/DATABASE_SCHEMA_DOCUMENTATION.md` - Complete schema reference
- `DEPLOYMENT_GUIDE.md` - Vercel deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification

#### Features
- `docs/ENHANCED_CREATOR_README.md` - Enhanced creator guide
- `docs/SECTION_ADMIN_README.md` - Section admin documentation
- `docs/SEMESTER_MANAGEMENT_README.md` - Semester management
- `NOTES_FEATURE_SUMMARY.md` - Video notes feature
- `DRAG_DROP_TOPICS_FEATURE.md` - Drag-and-drop implementation

#### Optimization
- `README_OPTIMIZATION.md` - Complete optimization summary
- `SIDEBAR_PERFORMANCE_OPTIMIZATION.md` - Sidebar optimization
- `TOPIC_OPTIMIZATION_SUMMARY.md` - Topic-level optimization
- `COURSE_CARD_OPTIMIZATION_SUMMARY.md` - Course card optimization

#### Quick References
- `BULK_CREATOR_QUICK_REF.md`
- `DRAG_DROP_QUICK_REF.md`
- `SIDEBAR_OPTIMIZATION_QUICK_REF.md`
- `NOTES_QUICK_START.md`

---

## 🛠️ Maintenance & Support

### Regular Maintenance Tasks
- Monitor cache performance and hit rates
- Review audit logs for security issues
- Update content and remove outdated materials
- Database backups (handled by Supabase)
- Check analytics for usage patterns

### Known Issues & Fixes
All documented fixes available in project root:
- `FIX_COMPLETE.md`
- `VIDEO_RETENTION_FIX.md`
- `CONSOLE_ERRORS_FIX.md`
- `ADMIN_CACHING_FIX.md`
- `SIDEBAR_AUTO_EXPAND_FIX.md`

---

## 🎯 Future Enhancements

### Planned Features
1. **Advanced Analytics Dashboard**
   - Student learning metrics
   - Content engagement tracking
   - Course completion rates

2. **Mobile Applications**
   - React Native apps
   - Offline content access
   - Push notifications

3. **Collaboration Features**
   - Multi-user editing
   - Version history
   - Change tracking

4. **AI Integration**
   - Content recommendations
   - Smart search
   - Automated tagging

5. **Gamification**
   - Achievement badges
   - Leaderboards
   - Learning streaks

6. **Advanced Study Tools**
   - Interactive quizzes
   - Flashcards
   - Practice exams

---

## 📞 Support & Contact

### For Technical Issues
- Review documentation in `/docs` folder
- Check troubleshooting guides
- Review audit logs in admin panel

### For Database Issues
- Refer to `docs/DATABASE_SETUP.md`
- Check Supabase dashboard logs
- Review RLS policies

### For Performance Issues
- Check cache statistics
- Review optimization documentation
- Monitor Vercel Analytics

---

## 📄 License

Private - Daffodil International University  
All Rights Reserved

---

## 📊 Project Statistics

- **Total Components:** 50+ custom components
- **API Routes:** 30+ endpoints
- **Database Tables:** 12 core + admin tables
- **Documentation Files:** 78+ markdown files
- **Performance Gain:** 80-85% faster navigation
- **Cache Hit Rate:** 88-92%
- **Production Ready:** ✅ Yes

---

**Last Updated:** December 15, 2025  
**Document Version:** 1.0.0  
**Project Status:** Production-Ready 🚀
