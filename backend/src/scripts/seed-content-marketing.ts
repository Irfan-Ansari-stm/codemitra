import { pool } from '../db';

export async function seedContentMarketing() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('[Seeder] Starting Content & Marketing seeding...');

    // Fetch Super Admin user ID
    const superAdminRes = await client.query(
      `SELECT id FROM users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1`
    );
    const superAdminId = superAdminRes.rows[0]?.id || '00000000-0000-0000-0000-000000000001';

    // Fetch Student users for community threads & replies
    const studentRes = await client.query(
      `SELECT id FROM users WHERE role IN ('general_student', 'institution_student') LIMIT 5`
    );
    const studentIds = studentRes.rows.map(r => r.id);
    if (studentIds.length === 0) studentIds.push(superAdminId);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CONTENT PAGES (8 pages: 5 published, 2 draft, 1 archived)
    // ─────────────────────────────────────────────────────────────────────────
    const pages = [
      {
        slug: 'about-codeverse',
        title: 'About CodeVerse',
        page_type: 'page',
        category: 'Company',
        excerpt: 'CodeVerse is India’s premier multi-tenant experiential coding platform.',
        content: `<h1>About CodeVerse</h1>
<p>CodeVerse is India's leading coding education and assessment platform, designed specifically for universities, colleges, and independent learners. Built with world-class execution sandboxes, automated grading, and comprehensive analytics, CodeVerse bridges the gap between academic education and industry engineering standards.</p>
<h2>Our Mission</h2>
<p>To democratize hands-on software engineering education by providing seamless access to modern compilers, structured roadmaps, and real-time mentorship.</p>
<h2>Key Capabilities</h2>
<ul>
<li>Browser-based WebAssembly and remote container execution engines.</li>
<li>Institutional multi-tenancy with custom academic batch grading.</li>
<li>Industry-standard continuous assessment and plagiarism detection.</li>
</ul>`,
        status: 'published',
        is_featured: true,
        seo_title: 'About CodeVerse — Modern Coding Education Platform',
        seo_description: 'Discover the story, mission, and technology behind CodeVerse coding platform.',
        keywords: ['about codeverse', 'coding platform', 'edtech', 'dsa'],
        view_count: 1420,
      },
      {
        slug: 'terms-and-conditions',
        title: 'Terms and Conditions',
        page_type: 'legal',
        category: 'Legal',
        excerpt: 'Read the official terms and conditions governing the use of the CodeVerse platform.',
        content: `<h1>Terms and Conditions</h1>
<p>Welcome to CodeVerse. By using our website, APIs, online IDE, and learning portal, you agree to comply with and be bound by the following terms and conditions of use.</p>
<h2>1. Account Usage</h2>
<p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</p>
<h2>2. Code of Conduct</h2>
<p>Users must not submit malicious software, attempt to breach the remote sandboxes, or engage in automated scraping without authorization.</p>
<h2>3. Intellectual Property</h2>
<p>Original source code created by students in personal workspaces remains their property. Official platform problems, editorial solutions, and course curriculum are proprietary to CodeVerse.</p>`,
        status: 'published',
        is_featured: false,
        seo_title: 'Terms and Conditions — CodeVerse Platform',
        seo_description: 'Platform usage guidelines and legal terms for CodeVerse students and institutes.',
        keywords: ['terms of service', 'legal', 'codeverse rules'],
        view_count: 512,
      },
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        page_type: 'legal',
        category: 'Legal',
        excerpt: 'Learn how CodeVerse collects, processes, and protects your personal and educational data.',
        content: `<h1>Privacy Policy</h1>
<p>At CodeVerse, we prioritize the protection and confidentiality of student and institution data. This policy explains our data collection and retention practices.</p>
<h2>Information We Collect</h2>
<p>We collect account information (name, email, institutional affiliation), code submissions, compilation execution logs, and assessment scores.</p>
<h2>Data Security</h2>
<p>All sensitive information is encrypted at rest using AES-256 and transmitted securely using TLS 1.3.</p>`,
        status: 'published',
        is_featured: false,
        seo_title: 'Privacy Policy — CodeVerse',
        seo_description: 'CodeVerse data protection and privacy policy.',
        keywords: ['privacy policy', 'data security', 'gdpr compliance'],
        view_count: 480,
      },
      {
        slug: 'contact-us',
        title: 'Contact Us',
        page_type: 'page',
        category: 'Support',
        excerpt: 'Get in touch with CodeVerse team for partnerships, college admissions, and technical support.',
        content: `<h1>Contact Us</h1>
<p>Have questions about CodeVerse or want to bring CodeVerse to your college campus? Our team is available 24/7 to assist you.</p>
<h3>Headquarters</h3>
<p>CodeVerse Technologies Pvt. Ltd.<br />Cyber Gateway, HITEC City, Hyderabad, TS 500081, India</p>
<h3>Email</h3>
<p>Support: support@codeverse.in<br />Campus Partnerships: partnerships@codeverse.in</p>`,
        status: 'published',
        is_featured: false,
        seo_title: 'Contact Us — CodeVerse Campus & Support Team',
        seo_description: 'Contact CodeVerse for campus onboarding, enterprise licenses, and technical help.',
        keywords: ['contact codeverse', 'customer support', 'partnerships'],
        view_count: 890,
      },
      {
        slug: 'student-learning-guide',
        title: 'Student Learning Guide',
        page_type: 'guide',
        category: 'Education',
        excerpt: 'A comprehensive onboarding manual for students to maximize their learning on CodeVerse.',
        content: `<h1>Student Learning Guide</h1>
<p>Welcome to CodeVerse! This handbook walks you through mastering your coding curriculum, using the Online IDE, submitting assignments, and taking campus placement assessments.</p>
<h2>Step 1: Your Dashboard</h2>
<p>Access your enrolled courses, pending quizzes, and live coding contests from the central student dashboard.</p>
<h2>Step 2: Using the Online Judge</h2>
<p>Our IDE provides real-time linting, multi-file projects, and instant sandboxed test case execution across Python, C++, Java, and JavaScript.</p>`,
        status: 'published',
        is_featured: true,
        seo_title: 'Student Learning Guide — Master Coding on CodeVerse',
        seo_description: 'Getting started guide for students practicing DSA and web development on CodeVerse.',
        keywords: ['student guide', 'how to code', 'online judge tutorial'],
        view_count: 2310,
      },
      {
        slug: 'instructor-guidelines',
        title: 'Instructor Guidelines',
        page_type: 'guide',
        category: 'Faculty',
        excerpt: 'Best practices for university faculty creating coding assignments and evaluating submissions.',
        content: `<h1>Instructor Guidelines</h1>
<p>This draft guide covers creating custom test cases, configuring memory/CPU limits for student code, and interpreting automated plagiarism heatmaps.</p>`,
        status: 'draft',
        is_featured: false,
        seo_title: 'Instructor Guidelines — CodeVerse Teaching Portal',
        seo_description: 'Faculty portal instructions for managing assignments and tests.',
        keywords: ['instructor guidelines', 'grading rubrics'],
        view_count: 45,
      },
      {
        slug: 'frequently-asked-questions',
        title: 'Frequently Asked Questions',
        page_type: 'faq',
        category: 'Support',
        excerpt: 'Comprehensive FAQ page addressing admissions, certificates, and coding compiler issues.',
        content: `<h1>Frequently Asked Questions</h1>
<p>Find quick answers to common questions regarding account settings, coding submissions, and verification badges.</p>`,
        status: 'draft',
        is_featured: false,
        seo_title: 'Frequently Asked Questions — CodeVerse Knowledge Hub',
        seo_description: 'Common questions and troubleshooting answers for CodeVerse platform.',
        keywords: ['faq', 'common questions'],
        view_count: 88,
      },
      {
        slug: 'codeverse-features-2025',
        title: 'CodeVerse Features (2025 Release)',
        page_type: 'archive',
        category: 'Product',
        excerpt: 'Archived feature overview of the legacy CodeVerse 1.0 platform.',
        content: `<h1>CodeVerse 2025 Feature Overview</h1>
<p>This document is preserved for historical reference regarding the v1 cloud execution architecture.</p>`,
        status: 'archived',
        is_featured: false,
        seo_title: 'Legacy CodeVerse Features — Archived Documentation',
        seo_description: 'Historical archive of CodeVerse v1 features.',
        keywords: ['archive', 'features 2025'],
        view_count: 320,
      },
    ];

    for (const p of pages) {
      await client.query(
        `INSERT INTO content_pages
           (slug, title, page_type, category, excerpt, content, status, is_featured,
            seo_title, seo_description, keywords, view_count, author_id, created_by,
            published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13,
                 $14, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           excerpt = EXCLUDED.excerpt,
           status = EXCLUDED.status,
           is_featured = EXCLUDED.is_featured,
           seo_title = EXCLUDED.seo_title,
           seo_description = EXCLUDED.seo_description,
           keywords = EXCLUDED.keywords,
           updated_at = NOW()`,
        [
          p.slug, p.title, p.page_type, p.category, p.excerpt, p.content,
          p.status, p.is_featured, p.seo_title, p.seo_description,
          p.keywords, p.view_count, superAdminId,
          p.status === 'published' ? new Date() : null,
        ]
      );
    }
    console.log('[Seeder] 8 Content Pages seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PROMOTIONAL BANNERS (5 banners)
    // ─────────────────────────────────────────────────────────────────────────
    const banners = [
      {
        title: 'Learn Coding from Industry Experts',
        subtitle: 'Live Masterclasses Every Weekend',
        description: 'Interactive live cohorts conducted by senior engineers from Google, Amazon, and Microsoft.',
        cta_text: 'Explore Masterclasses',
        cta_url: '/courses/masterclasses',
        priority: 10,
        position: 'top',
        target_audience: 'all',
        is_active: true,
      },
      {
        title: 'New Programming Courses Available',
        subtitle: 'Master Rust, Go & Distributed Systems',
        description: 'Dive deep into modern systems engineering with curated curriculums and instant cloud test runners.',
        cta_text: 'Browse Catalog',
        cta_url: '/courses',
        priority: 8,
        position: 'top',
        target_audience: 'all',
        is_active: true,
      },
      {
        title: 'Join the CodeVerse Community',
        subtitle: '100,000+ Students Helping Each Other',
        description: 'Discuss algorithmic trade-offs, get code reviews, and build open-source student projects together.',
        cta_text: 'Enter Community Forums',
        cta_url: '/super-admin/community',
        priority: 6,
        position: 'sidebar',
        target_audience: 'all',
        is_active: true,
      },
      {
        title: 'Master Data Structures and Algorithms',
        subtitle: 'Ace Your Placement Coding Rounds',
        description: '300+ hand-picked LeetCode and Codeforces style problems with detailed graphical walkthroughs.',
        cta_text: 'Start Practicing',
        cta_url: '/problems',
        priority: 5,
        position: 'hero',
        target_audience: 'all',
        is_active: true,
      },
      {
        title: 'Explore Career Opportunities',
        subtitle: 'Direct Hiring via CodeVerse Placement Drives',
        description: '50+ tech partners hiring directly from top performers in our weekly campus contests.',
        cta_text: 'View Placements',
        cta_url: '/placements',
        priority: 3,
        position: 'modal',
        target_audience: 'all',
        is_active: false,
      },
    ];

    // Clear old banners to prevent duplicates on rerun
    await client.query(`DELETE FROM content_banners WHERE title IN (${banners.map((_, i) => `$${i + 1}`).join(', ')})`, banners.map(b => b.title));
    for (const b of banners) {
      await client.query(
        `INSERT INTO content_banners
           (title, subtitle, description, cta_text, cta_url, priority, position,
            target_audience, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          b.title, b.subtitle, b.description, b.cta_text, b.cta_url,
          b.priority, b.position, b.target_audience, b.is_active, superAdminId,
        ]
      );
    }
    console.log('[Seeder] 5 Promotional Banners seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. FAQS (12 FAQs)
    // ─────────────────────────────────────────────────────────────────────────
    const faqs = [
      {
        question: 'How do I create and verify my CodeVerse account?',
        answer: 'You can sign up using your email or Google OAuth. An activation link will be sent to verify your inbox before you can enroll in courses.',
        category: 'Account & Registration',
        display_order: 1,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'What should I do if I forget my account password?',
        answer: 'Click "Forgot Password" on the sign-in modal, enter your registered email, and follow the secure 6-digit OTP instructions to reset your password.',
        category: 'Account & Registration',
        display_order: 2,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How does course enrollment work for college students?',
        answer: 'Students belonging to affiliated institutions are automatically enrolled into their semester academic batches by their college administrator.',
        category: 'Courses & Enrollment',
        display_order: 3,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'What payment methods and refund policies are supported?',
        answer: 'We accept UPI, Net Banking, credit/debit cards, and corporate purchase orders. Self-paced courses include a 7-day unconditional refund policy.',
        category: 'Payments & Billing',
        display_order: 4,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How are CodeVerse course completion certificates verified?',
        answer: 'Every certificate generates an immutable cryptographic verification hash accessible publicly at /verify-certificate/:code.',
        category: 'Certificates & Credentials',
        display_order: 5,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'Which programming languages are supported in the Online IDE?',
        answer: 'CodeVerse supports Python 3.12, JavaScript (Node.js & WASM), TypeScript, C++ 20, C# 12, Java 21, Go 1.22, Rust 1.78, and Kotlin.',
        category: 'Online IDE & Assessments',
        display_order: 6,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How can students and faculty track real-time coding progress?',
        answer: 'The Analytics tab provides problem acceptance rate, time complexity breakdown, topic coverage radar, and streak tracking.',
        category: 'Student Progress',
        display_order: 7,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How do college professors apply for instructor privileges?',
        answer: 'University administrators can invite faculty members via the Institution Management dashboard and assign Instructor or TA roles.',
        category: 'Instructor Accounts',
        display_order: 8,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'What are the minimum browser and system requirements?',
        answer: 'CodeVerse is optimized for all modern evergreen browsers including Chrome 110+, Firefox 115+, Edge 110+, and Safari 16+ on desktop and tablet.',
        category: 'Technical Issues',
        display_order: 9,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'What community conduct rules are enforced in public forums?',
        answer: 'CodeVerse enforces a strict zero-tolerance policy against hate speech, harassment, academic plagiarism, and toxic behavior.',
        category: 'Community Guidelines',
        display_order: 10,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How long do I retain access to purchased courses and IDE projects?',
        answer: 'Enrolled students enjoy lifetime access to course lecture notes, problem sets, and cloud workspace project repositories.',
        category: 'Course Access',
        display_order: 11,
        visibility: 'public',
        status: 'published',
      },
      {
        question: 'How do I raise a support ticket if my code sandbox stalls?',
        answer: 'Navigate to Support Tickets in the sidebar, click "New Ticket", choose "Technical Issue" and attach your problem link or session ID.',
        category: 'Support & Help Desk',
        display_order: 12,
        visibility: 'public',
        status: 'published',
      },
    ];

    // Clear old seeded FAQs by question
    await client.query(`DELETE FROM content_faqs WHERE question IN (${faqs.map((_, i) => `$${i + 1}`).join(', ')})`, faqs.map(f => f.question));
    for (const f of faqs) {
      await client.query(
        `INSERT INTO content_faqs
           (question, answer, category, display_order, sort_order, visibility, status, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4, $5, $6, true, $7, NOW(), NOW())`,
        [f.question, f.answer, f.category, f.display_order, f.visibility, f.status, superAdminId]
      );
    }
    console.log('[Seeder] 12 Content FAQs seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SEO & CONFIGURATION SEED DATA
    // ─────────────────────────────────────────────────────────────────────────
    const globalSeo = {
      siteTitle: 'CodeVerse — Coding Education & Assessment Platform',
      siteDescription: 'Learn programming, build projects, practice coding, and prepare for your software engineering career with CodeVerse.',
      defaultKeywords: ['coding education', 'programming', 'software development', 'online coding courses', 'DSA', 'web development'],
      canonicalBaseUrl: 'https://codeverse.dev',
      defaultOgImage: 'https://codeverse.dev/og-default.png',
      ogTitle: 'CodeVerse — Premier Coding Education Platform',
      ogDescription: 'Master programming through interactive sandboxes and verified assessments.',
      twitterHandle: '@codeverse_dev',
      twitterCardType: 'summary_large_image',
      defaultLanguage: 'en',
      indexingPreference: 'all',
      robotsTxt: `User-agent: *\nAllow: /\nDisallow: /super-admin/\nDisallow: /api/\nSitemap: https://codeverse.dev/sitemap.xml`,
      sitemapEnabled: true,
    };

    // Upsert into platform_configurations
    await client.query(
      `INSERT INTO platform_configurations
         (id, config_key, config_value, category, description, is_sensitive, updated_at)
       VALUES ('seo.global', 'seo.global', $1, 'seo', 'Platform global SEO configuration and metadata', false, NOW())
       ON CONFLICT (config_key) DO UPDATE SET
         config_value = EXCLUDED.config_value,
         updated_at = NOW()`,
      [JSON.stringify(globalSeo)]
    );

    // Upsert into seo_settings
    await client.query(
      `INSERT INTO seo_settings
         (site_title, site_description, default_keywords, canonical_base_url, default_og_image,
          og_title, og_description, twitter_handle, twitter_card_type, default_language,
          indexing_preference, robots_txt, sitemap_enabled, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        globalSeo.siteTitle, globalSeo.siteDescription, globalSeo.defaultKeywords,
        globalSeo.canonicalBaseUrl, globalSeo.defaultOgImage, globalSeo.ogTitle,
        globalSeo.ogDescription, globalSeo.twitterHandle, globalSeo.twitterCardType,
        globalSeo.defaultLanguage, globalSeo.indexingPreference, globalSeo.robotsTxt,
        globalSeo.sitemapEnabled,
      ]
    );

    // 5 Seed Redirects
    const redirects = [
      { source_path: '/docs', target_path: '/super-admin/help-center', status_code: 301 },
      { source_path: '/learn', target_path: '/courses', status_code: 301 },
      { source_path: '/ide-classic', target_path: '/dashboard/ide', status_code: 302 },
      { source_path: '/pricing-2025', target_path: '/pricing', status_code: 301 },
      { source_path: '/about-us', target_path: '/super-admin/content', status_code: 301 },
    ];

    for (const r of redirects) {
      await client.query(
        `INSERT INTO seo_redirects (source_path, target_path, status_code, is_active, created_by, updated_at)
         VALUES ($1, $2, $3, true, $4, NOW())
         ON CONFLICT (source_path) DO UPDATE SET
           target_path = EXCLUDED.target_path,
           status_code = EXCLUDED.status_code,
           updated_at = NOW()`,
        [r.source_path, r.target_path, r.status_code, superAdminId]
      );
    }
    console.log('[Seeder] Global SEO & 5 Redirects seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 5. HELP CENTER SEED DATA (5 Categories, 15 Articles: 11 pub, 3 draft, 1 arch)
    // ─────────────────────────────────────────────────────────────────────────
    const helpCats = [
      { name: 'Getting Started', slug: 'getting-started', description: 'Platform onboarding, account setup, and quickstart tutorials.', icon: 'Compass', display_order: 1 },
      { name: 'Account & Profile', slug: 'account-profile', description: 'Security, password management, profile customization, and notification preferences.', icon: 'User', display_order: 2 },
      { name: 'Courses & Learning', slug: 'courses-learning', description: 'Course navigation, coding assignments, quiz submissions, and syllabus tracking.', icon: 'BookOpen', display_order: 3 },
      { name: 'Payments & Billing', slug: 'payments-billing', description: 'Invoices, payment gateways, receipts, coupon codes, and refund policies.', icon: 'CreditCard', display_order: 4 },
      { name: 'Technical Support', slug: 'technical-support', description: 'IDE compilers, WebAssembly sandboxes, browser troubleshooting, and API keys.', icon: 'Terminal', display_order: 5 },
    ];

    const catMap: Record<string, string> = {};
    for (const c of helpCats) {
      const res = await client.query(
        `INSERT INTO help_categories (name, slug, description, icon, display_order, is_visible, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           display_order = EXCLUDED.display_order,
           updated_at = NOW()
         RETURNING id`,
        [c.name, c.slug, c.description, c.icon, c.display_order]
      );
      catMap[c.slug] = res.rows[0].id;
    }

    const helpArticlesList = [
      {
        title: 'How to create a CodeVerse account',
        slug: 'how-to-create-a-codeverse-account',
        catSlug: 'getting-started',
        short_description: 'Step-by-step instructions for signing up with personal or college credentials.',
        content: `<h3>Creating Your Account</h3><p>Navigate to codeverse.in/register, select whether you are a Student or Institution Admin, and complete email verification.</p>`,
        status: 'published', is_published: true, is_featured: true, helpful_count: 142, not_helpful_count: 3, view_count: 890,
      },
      {
        title: 'How to reset your password',
        slug: 'how-to-reset-your-password',
        catSlug: 'account-profile',
        short_description: 'Regain account access securely using email password recovery.',
        content: `<h3>Password Recovery Steps</h3><p>Click "Forgot Password" on the login modal to receive a 6-digit verification code valid for 15 minutes.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 89, not_helpful_count: 1, view_count: 420,
      },
      {
        title: 'How to enroll in a course',
        slug: 'how-to-enroll-in-a-course',
        catSlug: 'courses-learning',
        short_description: 'Browse the course catalog and enroll into self-paced or cohort-based programs.',
        content: `<h3>Enrolling in Courses</h3><p>Select any course from the catalog and click "Enroll Now". Institute students are auto-enrolled by administrators.</p>`,
        status: 'published', is_published: true, is_featured: true, helpful_count: 195, not_helpful_count: 4, view_count: 1250,
      },
      {
        title: 'How to access course lessons',
        slug: 'how-to-access-course-lessons',
        catSlug: 'courses-learning',
        short_description: 'Navigate modular chapters, video explanations, and interactive coding challenges.',
        content: `<h3>Navigating Lessons</h3><p>Open the Course Player to view syllabus chapters, downloadable lecture notes, and linked coding practice sandboxes.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 76, not_helpful_count: 2, view_count: 530,
      },
      {
        title: 'How to submit coding assignments',
        slug: 'how-to-submit-coding-assignments',
        catSlug: 'courses-learning',
        short_description: 'Write, debug, and submit programming homework directly in the browser IDE.',
        content: `<h3>Assignment Submissions</h3><p>Run your solution against public test cases first. When ready, click "Final Submit" to test hidden unit test suites.</p>`,
        status: 'published', is_published: true, is_featured: true, helpful_count: 310, not_helpful_count: 5, view_count: 2100,
      },
      {
        title: 'How to track your learning progress',
        slug: 'how-to-track-your-learning-progress',
        catSlug: 'getting-started',
        short_description: 'Understand the progress bar, completion percentage, and weekly streak metrics.',
        content: `<h3>Progress Tracking</h3><p>Your Student Dashboard calculates overall course completion and displays daily algorithmic problem-solving streaks.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 112, not_helpful_count: 1, view_count: 670,
      },
      {
        title: 'How to download certificates',
        slug: 'how-to-download-certificates',
        catSlug: 'getting-started',
        short_description: 'Obtain verified digital certificates after completing required curriculum thresholds.',
        content: `<h3>Downloading Certificates</h3><p>Once you achieve 100% course completion and pass the final assessment, click "Generate Certificate" on your profile.</p>`,
        status: 'published', is_published: true, is_featured: true, helpful_count: 245, not_helpful_count: 3, view_count: 1800,
      },
      {
        title: 'How to update your profile',
        slug: 'how-to-update-your-profile',
        catSlug: 'account-profile',
        short_description: 'Modify your name, bio, social links, and GitHub / LinkedIn integrations.',
        content: `<h3>Updating Your Profile</h3><p>Visit Settings > Profile to upload an avatar and link your competitive programming handles.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 64, not_helpful_count: 2, view_count: 380,
      },
      {
        title: 'How to change your email address',
        slug: 'how-to-change-your-email-address',
        catSlug: 'account-profile',
        short_description: 'Update the primary login email associated with your CodeVerse user account.',
        content: `<h3>Email Update Procedure</h3><p>For security, changing your email requires confirming verification tokens sent to both old and new addresses.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 48, not_helpful_count: 0, view_count: 290,
      },
      {
        title: 'Understanding course payments',
        slug: 'understanding-course-payments',
        catSlug: 'payments-billing',
        short_description: 'Supported currencies, GST tax invoices, and institutional group purchase pricing.',
        content: `<h3>Payment Breakdown</h3><p>We support INR and USD transactions with instant GST invoice generation for Indian educational institutions.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 82, not_helpful_count: 2, view_count: 510,
      },
      {
        title: 'How to request a refund',
        slug: 'how-to-request-a-refund',
        catSlug: 'payments-billing',
        short_description: 'Learn about our 7-day refund policy and how to initiate a payment reversal.',
        content: `<h3>Refund Requests</h3><p>If you have consumed less than 20% of course content within 7 days of purchase, raise a billing ticket for an immediate refund.</p>`,
        status: 'published', is_published: true, is_featured: false, helpful_count: 91, not_helpful_count: 4, view_count: 620,
      },
      {
        title: 'How to contact instructors',
        slug: 'how-to-contact-instructors',
        catSlug: 'courses-learning',
        short_description: 'Communicate with faculty during office hours or via lecture discussion threads.',
        content: `<h3>Instructor Communication</h3><p>Draft guidance for reaching course mentors through direct in-app messaging and weekly AMA sessions.</p>`,
        status: 'draft', is_published: false, is_featured: false, helpful_count: 12, not_helpful_count: 1, view_count: 45,
      },
      {
        title: 'How to resolve code execution errors',
        slug: 'how-to-resolve-code-execution-errors',
        catSlug: 'technical-support',
        short_description: 'Troubleshoot Time Limit Exceeded (TLE), Memory Limit Exceeded (MLE), and SIGSEGV errors.',
        content: `<h3>Compiler Error Guide</h3><p>Draft article breaking down common online judge compilation and execution errors.</p>`,
        status: 'draft', is_published: false, is_featured: false, helpful_count: 19, not_helpful_count: 0, view_count: 88,
      },
      {
        title: 'Browser compatibility requirements',
        slug: 'browser-compatibility-requirements',
        catSlug: 'technical-support',
        short_description: 'Recommended hardware, browser extensions, and WebAssembly support matrix.',
        content: `<h3>Supported Browsers</h3><p>Draft specifications for running the multi-file Monaco and WASM sandboxes smoothly.</p>`,
        status: 'draft', is_published: false, is_featured: false, helpful_count: 8, not_helpful_count: 1, view_count: 32,
      },
      {
        title: 'How to contact technical support',
        slug: 'how-to-contact-technical-support',
        catSlug: 'technical-support',
        short_description: 'Legacy support guide archived in favor of the real-time Support Ticket Help Desk.',
        content: `<h3>Legacy Technical Support Guide</h3><p>This article is archived. Please use the in-app Support Tickets hub for instant assistance.</p>`,
        status: 'archived', is_published: false, is_featured: false, helpful_count: 55, not_helpful_count: 10, view_count: 410,
      },
    ];

    for (const a of helpArticlesList) {
      const catId = catMap[a.catSlug];
      await client.query(
        `INSERT INTO help_articles
           (category_id, category, title, slug, short_description, content, status, is_published,
            is_featured, helpful_count, not_helpful_count, view_count, created_by,
            published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                 $14, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           category_id = EXCLUDED.category_id,
           category = EXCLUDED.category,
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           status = EXCLUDED.status,
           is_published = EXCLUDED.is_published,
           is_featured = EXCLUDED.is_featured,
           helpful_count = EXCLUDED.helpful_count,
           not_helpful_count = EXCLUDED.not_helpful_count,
           view_count = EXCLUDED.view_count,
           updated_at = NOW()`,
        [
          catId, a.catSlug, a.title, a.slug, a.short_description, a.content,
          a.status, a.is_published, a.is_featured, a.helpful_count, a.not_helpful_count,
          a.view_count, superAdminId,
          a.is_published ? new Date() : null,
        ]
      );
    }
    console.log('[Seeder] 5 Help Categories & 15 Help Articles seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. COMMUNITY SEED DATA (8 Categories, 20 Threads, 50 Replies, 5 Reports)
    // ─────────────────────────────────────────────────────────────────────────
    const commCats = [
      { name: 'General Discussion', slug: 'general-discussion', description: 'Hangout spot for coding enthusiasts, project showcases, and tech gossip.', icon: 'Coffee', color: '#6366F1' },
      { name: 'Data Structures & Algorithms', slug: 'data-structures-algorithms', description: 'Binary trees, graphs, dynamic programming, and complexity optimization.', icon: 'Binary', color: '#3B82F6' },
      { name: 'Web Development', slug: 'web-development', description: 'Next.js, React, Tailwind CSS, TypeScript, and modern frontend architectures.', icon: 'Globe', color: '#10B981' },
      { name: 'Python Programming', slug: 'python-programming', description: 'Data analysis, automation, FastAPI, PyTorch, and idiomatic Python.', icon: 'Terminal', color: '#F59E0B' },
      { name: 'Java Programming', slug: 'java-programming', description: 'Core Java, Spring Boot, OOP design patterns, and JVM memory profiling.', icon: 'Coffee', color: '#EF4444' },
      { name: 'Database & SQL', slug: 'database-sql', description: 'PostgreSQL, query indexing, ACID transactions, and database normalizations.', icon: 'Database', color: '#8B5CF6' },
      { name: 'Interview Preparation', slug: 'interview-preparation', description: 'Mock interviews, FAANG questions, behavioral rounds, and resume reviews.', icon: 'Briefcase', color: '#EC4899' },
      { name: 'Career Guidance', slug: 'career-guidance', description: 'Tech career roadmaps, college placements, remote jobs, and freelance tips.', icon: 'TrendingUp', color: '#14B8A6' },
    ];

    const commCatMap: Record<string, string> = {};
    for (const c of commCats) {
      const res = await client.query(
        `INSERT INTO community_categories (name, slug, description, icon, color, is_active, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           color = EXCLUDED.color,
           updated_at = NOW()
         RETURNING id`,
        [c.name, c.slug, c.description, c.icon, c.color]
      );
      commCatMap[c.slug] = res.rows[0].id;
    }

    const threadsList = [
      {
        title: 'Best approach to mastering DSA in 6 months?',
        slug: 'best-approach-to-mastering-dsa-in-6-months',
        catSlug: 'data-structures-algorithms',
        content: 'I am in my 3rd year of engineering and want to systematically prepare for campus placements. What is the optimal study progression?',
        tags: ['dsa', 'roadmap', 'placements'],
        upvotes: 84, view_count: 1420, reply_count: 5, status: 'open', moderation_status: 'approved', is_pinned: true, is_locked: false, is_resolved: false,
      },
      {
        title: 'How does binary search work on rotated sorted arrays?',
        slug: 'how-does-binary-search-work-on-rotated-sorted-arrays',
        catSlug: 'data-structures-algorithms',
        content: 'I always stumble on the pivot condition when nums[mid] is compared with nums[low] vs nums[high]. Can someone explain the invariants?',
        tags: ['binary-search', 'algorithms', 'leetcode'],
        upvotes: 42, view_count: 910, reply_count: 4, status: 'resolved', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: true,
      },
      {
        title: 'React Server Components vs Traditional SSR: What changes?',
        slug: 'react-server-components-vs-traditional-ssr',
        catSlug: 'web-development',
        content: 'Next.js 14 App Router uses RSC by default. How does client component hydration differ from old `getServerSideProps`?',
        tags: ['react', 'nextjs', 'ssr'],
        upvotes: 68, view_count: 1350, reply_count: 4, status: 'open', moderation_status: 'approved', is_pinned: true, is_locked: false, is_resolved: false,
      },
      {
        title: 'Python list comprehension vs map/filter performance',
        slug: 'python-list-comprehension-vs-map-filter-performance',
        catSlug: 'python-programming',
        content: 'Is list comprehension faster in CPython due to optimized bytecode execution compared to lambda functions passed to map()?',
        tags: ['python', 'performance', 'cpython'],
        upvotes: 31, view_count: 640, reply_count: 3, status: 'resolved', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: true,
      },
      {
        title: 'SQL joins explained with practical Venn diagrams',
        slug: 'sql-joins-explained-with-practical-venn-diagrams',
        catSlug: 'database-sql',
        content: 'A comprehensive visual guide contrasting INNER JOIN, LEFT OUTER JOIN, FULL JOIN, and CROSS JOIN with sample student tables.',
        tags: ['sql', 'database', 'tutorial'],
        upvotes: 95, view_count: 2100, reply_count: 3, status: 'resolved', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: true,
      },
      {
        title: 'System Design Interview Checklist for 2026',
        slug: 'system-design-interview-checklist-for-2026',
        catSlug: 'interview-preparation',
        content: 'Key concepts to cover: Rate limiting, consistent hashing, message queues (Kafka vs RabbitMQ), caching layers (Redis), and DB replication.',
        tags: ['system-design', 'interviews', 'architecture'],
        upvotes: 110, view_count: 2800, reply_count: 4, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Java 21 Virtual Threads (Project Loom) in Production',
        slug: 'java-21-virtual-threads-project-loom',
        catSlug: 'java-programming',
        content: 'How lightweight virtual threads compare to platform OS threads when scaling high-throughput Spring Boot microservices.',
        tags: ['java', 'virtual-threads', 'backend'],
        upvotes: 56, view_count: 1180, reply_count: 3, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Campus placement coding round tips from a Google engineer',
        slug: 'campus-placement-coding-round-tips',
        catSlug: 'career-guidance',
        content: 'Sharing my personal journey from a tier-3 college to securing an L4 Software Engineer role at Google Bangalore.',
        tags: ['career', 'google', 'placements'],
        upvotes: 180, view_count: 4500, reply_count: 5, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Spam promotional thread advertising dubious certificates',
        slug: 'spam-promotional-thread-dubious-certificates',
        catSlug: 'general-discussion',
        content: 'Buy direct degree certificates and bypass coding test with 100% guarantee at fake-site.com!',
        tags: ['spam'],
        upvotes: 0, view_count: 85, reply_count: 1, status: 'locked', moderation_status: 'flagged', is_pinned: false, is_locked: true, is_resolved: false,
      },
      {
        title: 'Offensive language in contest discussion',
        slug: 'offensive-language-in-contest-discussion',
        catSlug: 'general-discussion',
        content: 'This problem was garbage and whoever wrote the test cases is an incompetent fraud.',
        tags: ['contest'],
        upvotes: 1, view_count: 95, reply_count: 1, status: 'locked', moderation_status: 'pending', is_pinned: false, is_locked: true, is_resolved: false,
      },
      {
        title: 'Understanding recursion and backtracking with N-Queens',
        slug: 'understanding-recursion-backtracking-n-queens',
        catSlug: 'data-structures-algorithms',
        content: 'Visualizing state space tree exploration and prune conditions in standard backtracking algorithms.',
        tags: ['recursion', 'backtracking', 'dsa'],
        upvotes: 49, view_count: 980, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Tailwind CSS v4: Key Changes and Performance Upgrades',
        slug: 'tailwind-css-v4-key-changes',
        catSlug: 'web-development',
        content: 'Tailwind v4 features an all-new high performance engine built with Rust (Oxide) and zero-config CSS imports.',
        tags: ['tailwind', 'css', 'frontend'],
        upvotes: 38, view_count: 750, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'PostgreSQL vs MongoDB for high-scale e-commerce',
        slug: 'postgresql-vs-mongodb-for-high-scale-ecommerce',
        catSlug: 'database-sql',
        content: 'Evaluating schema flexibility vs relational data integrity and transaction rollbacks for order processing.',
        tags: ['database', 'postgresql', 'mongodb'],
        upvotes: 62, view_count: 1240, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'How to build your first portfolio project that stands out',
        slug: 'how-to-build-your-first-portfolio-project',
        catSlug: 'career-guidance',
        content: 'Why you should avoid building another generic ToDo app and focus on solving real campus pain points.',
        tags: ['portfolio', 'projects', 'advice'],
        upvotes: 87, view_count: 1820, reply_count: 3, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'FastAPI async route handlers and database connection pooling',
        slug: 'fastapi-async-route-handlers-db-pooling',
        catSlug: 'python-programming',
        content: 'Proper patterns for managing async SQLAlchemy 2.0 sessions inside FastAPI dependency injection.',
        tags: ['fastapi', 'python', 'async'],
        upvotes: 44, view_count: 880, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Spring Security 6 with JWT stateless authentication',
        slug: 'spring-security-6-jwt-stateless-auth',
        catSlug: 'java-programming',
        content: 'Configuring SecurityFilterChain and OncePerRequestFilter for modern stateless token authorization.',
        tags: ['spring-boot', 'security', 'jwt'],
        upvotes: 51, view_count: 1020, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'How to explain time complexity in FAANG interviews',
        slug: 'how-to-explain-time-complexity-faang-interviews',
        catSlug: 'interview-preparation',
        content: 'Articulating worst-case vs amortized analysis clearly to your interviewer before writing code.',
        tags: ['big-o', 'complexity', 'interview-tips'],
        upvotes: 73, view_count: 1530, reply_count: 3, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Duplicate discussion thread regarding contest rules',
        slug: 'duplicate-discussion-contest-rules',
        catSlug: 'general-discussion',
        content: 'What are the penalty points for wrong submissions? (Duplicated from announcement)',
        tags: ['contest'],
        upvotes: 2, view_count: 110, reply_count: 1, status: 'locked', moderation_status: 'approved', is_pinned: false, is_locked: true, is_resolved: false,
      },
      {
        title: 'Dockerizing Next.js 14 applications with multi-stage builds',
        slug: 'dockerizing-nextjs-14-applications',
        catSlug: 'web-development',
        content: 'Reducing production standalone container image sizes from 1.2GB down to 110MB.',
        tags: ['docker', 'nextjs', 'devops'],
        upvotes: 92, view_count: 2300, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
      {
        title: 'Transitioning from manual QA to Software Development Engineer',
        slug: 'transitioning-from-manual-qa-to-sde',
        catSlug: 'career-guidance',
        content: 'A structured 9-month guide for automated testing and backend engineering upskilling.',
        tags: ['qa', 'sde', 'career-switch'],
        upvotes: 65, view_count: 1390, reply_count: 2, status: 'open', moderation_status: 'approved', is_pinned: false, is_locked: false, is_resolved: false,
      },
    ];

    const threadIds: string[] = [];
    for (let i = 0; i < threadsList.length; i++) {
      const t = threadsList[i];
      const authorId = studentIds[i % studentIds.length];
      const catId = commCatMap[t.catSlug];

      const res = await client.query(
        `INSERT INTO community_threads
           (author_id, category_id, title, slug, content, tags, status, moderation_status,
            is_pinned, is_locked, is_resolved, upvotes, view_count, reply_count,
            last_activity_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           tags = EXCLUDED.tags,
           status = EXCLUDED.status,
           moderation_status = EXCLUDED.moderation_status,
           is_pinned = EXCLUDED.is_pinned,
           is_locked = EXCLUDED.is_locked,
           is_resolved = EXCLUDED.is_resolved,
           upvotes = EXCLUDED.upvotes,
           view_count = EXCLUDED.view_count,
           updated_at = NOW()
         RETURNING id`,
        [
          authorId, catId, t.title, t.slug, t.content, t.tags, t.status,
          t.moderation_status, t.is_pinned, t.is_locked, t.is_resolved,
          t.upvotes, t.view_count, t.reply_count,
        ]
      );
      threadIds.push(res.rows[0].id);
    }
    console.log('[Seeder] 8 Community Categories & 20 Threads seeded.');

    // 50 Discussion Replies
    const replyContents = [
      'Excellent question! I recommend solving problems by pattern rather than randomly.',
      'Start with Two Pointers and Sliding Window before jumping straight into Dynamic Programming.',
      'Make sure you write clean code with meaningful variable names during interviews.',
      'Binary search always maintains the invariant: the target element is within [low, high].',
      'Remember to calculate mid using low + (high - low) / 2 to avoid integer overflow in languages like C++ and Java.',
      'RSC executed on the server produces a virtual DOM JSON payload, not raw HTML replacement.',
      'CPython list comprehension executes internal bytecode loops in C, minimizing Python VM opcode dispatch overhead.',
      'Check out the official PostgreSQL documentation for EXPLAIN ANALYZE to visualize hash join vs nested loop joins.',
      'Great advice! Consistent daily practice of 2 problems is far better than cramming on weekends.',
      'Virtual threads make blocking I/O virtually cost-free without having to write complex reactive WebFlux code.',
    ];

    // Delete existing replies for seeded threads to avoid duplicate reply count inflation
    await client.query(`DELETE FROM community_replies WHERE thread_id = ANY($1::uuid[])`, [threadIds]);

    let createdRepliesCount = 0;
    const sampleReplyIds: string[] = [];

    for (let i = 0; i < 50; i++) {
      const targetThreadId = threadIds[i % threadIds.length];
      const authorId = studentIds[(i + 1) % studentIds.length];
      const content = replyContents[i % replyContents.length] + ` (Insight #${i + 1})`;
      const isBest = (i === 1 || i === 4 || i === 7); // 3 best answers

      const repRes = await client.query(
        `INSERT INTO community_replies
           (thread_id, author_id, content, is_best_answer, is_pinned, is_hidden, upvotes, moderation_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, false, $5, 'approved', NOW(), NOW())
         RETURNING id`,
        [targetThreadId, authorId, content, isBest, Math.floor(Math.random() * 20) + 1]
      );
      sampleReplyIds.push(repRes.rows[0].id);
      createdRepliesCount++;
    }

    // Update reply_count on threads
    await client.query(`
      UPDATE community_threads t
      SET reply_count = (SELECT COUNT(*) FROM community_replies r WHERE r.thread_id = t.id)
    `);
    console.log(`[Seeder] ${createdRepliesCount} Community Discussion Replies seeded.`);

    // 5 Reports (2 pending, 2 resolved, 1 reviewing)
    await client.query(`DELETE FROM community_reports WHERE reason IN ('spam', 'harassment', 'inappropriate', 'abuse')`);

    // Report 1: Spam thread (pending)
    await client.query(
      `INSERT INTO community_reports
         (reporter_id, report_type, target_thread_id, reason, description, status, created_at)
       VALUES ($1, 'thread', $2, 'spam', 'Promoting unauthorized third-party credential purchase website.', 'pending', NOW())`,
      [studentIds[0], threadIds[8]]
    );

    // Report 2: Offensive thread (pending)
    await client.query(
      `INSERT INTO community_reports
         (reporter_id, report_type, target_thread_id, reason, description, status, created_at)
       VALUES ($1, 'thread', $2, 'harassment', 'Aggressive and abusive language directed at problem setters.', 'pending', NOW())`,
      [studentIds[1 % studentIds.length], threadIds[9]]
    );

    // Report 3: Duplicate thread (resolved)
    await client.query(
      `INSERT INTO community_reports
         (reporter_id, report_type, target_thread_id, reason, description, status, moderator_id, moderation_action, resolution_note, resolved_at, created_at)
       VALUES ($1, 'thread', $2, 'inappropriate', 'Duplicate question already answered in announcement sticky.', 'resolved', $3, 'lock', 'Locked thread and pointed student to official FAQ.', NOW(), NOW())`,
      [studentIds[0], threadIds[17], superAdminId]
    );

    // Report 4: Abuse on reply (resolved)
    if (sampleReplyIds.length > 0) {
      await client.query(
        `INSERT INTO community_reports
           (reporter_id, report_type, target_reply_id, reason, description, status, moderator_id, moderation_action, resolution_note, resolved_at, created_at)
         VALUES ($1, 'reply', $2, 'abuse', 'Trolling comment belittling junior learners.', 'resolved', $3, 'warn', 'Warned user and preserved forum etiquette.', NOW(), NOW())`,
        [studentIds[0], sampleReplyIds[0], superAdminId]
      );
    }

    // Report 5: Reviewing
    if (sampleReplyIds.length > 1) {
      await client.query(
        `INSERT INTO community_reports
           (reporter_id, report_type, target_reply_id, reason, description, status, created_at)
         VALUES ($1, 'reply', $2, 'spam', 'Affiliate link posted inside code explanation.', 'reviewing', NOW())`,
        [studentIds[0], sampleReplyIds[1]]
      );
    }
    console.log('[Seeder] 5 Community Moderation Reports seeded.');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. BLOG SEED DATA (6 Categories, 12 Articles: 7 pub, 3 draft, 2 sched)
    // ─────────────────────────────────────────────────────────────────────────
    const blogCats = [
      { name: 'Programming', slug: 'programming', description: 'Core languages, idioms, compilers, and coding fundamentals.' },
      { name: 'Web Development', slug: 'web-development', description: 'Full-stack engineering, frameworks, APIs, and browsers.' },
      { name: 'Data Structures & Algorithms', slug: 'data-structures-algorithms', description: 'Algorithmic paradigms, time complexity, and data organization.' },
      { name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'Machine learning, neural networks, LLMs, and prompt engineering.' },
      { name: 'Career Development', slug: 'career-development', description: 'Interviews, resume building, industry trends, and leadership.' },
      { name: 'Technology News', slug: 'technology-news', description: 'Tech ecosystem updates, open-source releases, and cloud tooling.' },
    ];

    const blogCatMap: Record<string, string> = {};
    for (const bc of blogCats) {
      const res = await client.query(
        `INSERT INTO blog_categories (name, slug, description, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description
         RETURNING id`,
        [bc.name, bc.slug, bc.description]
      );
      blogCatMap[bc.slug] = res.rows[0].id;
    }

    const blogArticlesList = [
      {
        title: 'The Complete Roadmap to Becoming a Software Developer',
        slug: 'the-complete-roadmap-to-becoming-a-software-developer',
        catSlug: 'career-development',
        excerpt: 'A comprehensive, step-by-step roadmap from writing your first line of code to landing your first software engineer job.',
        content: `<h2>Introduction</h2><p>Becoming a modern software engineer requires mastering foundational computing principles, version control, database design, and cloud deployments.</p>`,
        tags: ['career', 'roadmap', 'beginner'],
        status: 'published', is_featured: true, read_time: 12, view_count: 5420, published_at: new Date(Date.now() - 30 * 86400000),
      },
      {
        title: 'Top 10 Programming Languages to Learn in 2026',
        slug: 'top-10-programming-languages-to-learn-in-2026',
        catSlug: 'programming',
        excerpt: 'An analysis of developer demand, salary trends, and ecosystem growth for Python, TypeScript, Rust, Go, and Kotlin.',
        content: `<h2>The 2026 Language Landscape</h2><p>Rust and Go continue to dominate backend systems infrastructure, while TypeScript powers modern web experiences.</p>`,
        tags: ['languages', 'rust', 'typescript', 'python'],
        status: 'published', is_featured: true, read_time: 9, view_count: 3890, published_at: new Date(Date.now() - 22 * 86400000),
      },
      {
        title: 'Understanding Data Structures and Algorithms',
        slug: 'understanding-data-structures-and-algorithms-guide',
        catSlug: 'data-structures-algorithms',
        excerpt: 'A beginner-friendly visual guide to arrays, linked lists, trees, graphs, and Big-O notation.',
        content: `<h2>Why DSA Matters</h2><p>Algorithms teach you how to write efficient, scalable, and memory-conscious software.</p>`,
        tags: ['dsa', 'algorithms', 'computer-science'],
        status: 'published', is_featured: false, read_time: 15, view_count: 4210, published_at: new Date(Date.now() - 15 * 86400000),
      },
      {
        title: 'Getting Started with React and Next.js',
        slug: 'getting-started-with-react-and-nextjs',
        catSlug: 'web-development',
        excerpt: 'Build lightning-fast, SEO-optimized web applications with the Next.js App Router and React Server Components.',
        content: `<h2>The Power of React Server Components</h2><p>Learn how server-side rendering and client state interact seamlessly in modern Next.js.</p>`,
        tags: ['react', 'nextjs', 'webdev'],
        status: 'published', is_featured: false, read_time: 8, view_count: 2840, published_at: new Date(Date.now() - 10 * 86400000),
      },
      {
        title: 'Python for Beginners: From Zero to Code',
        slug: 'python-for-beginners-from-zero-to-code',
        catSlug: 'programming',
        excerpt: 'Master Python syntax, functions, object-oriented concepts, and package management with practical exercises.',
        content: `<h2>Why Learn Python?</h2><p>Python's elegant readability makes it the language of choice for scripting, data science, and web APIs.</p>`,
        tags: ['python', 'coding', 'tutorial'],
        status: 'published', is_featured: false, read_time: 10, view_count: 3120, published_at: new Date(Date.now() - 7 * 86400000),
      },
      {
        title: 'Building Your First REST API with Node.js and Express',
        slug: 'building-your-first-rest-api-nodejs-express',
        catSlug: 'web-development',
        excerpt: 'A hands-on walkthrough building secure, production-ready REST endpoints with JWT authentication and PostgreSQL.',
        content: `<h2>Designing RESTful Architecture</h2><p>Understand HTTP verbs, status codes, middleware chaining, and input validation schemas.</p>`,
        tags: ['nodejs', 'express', 'api', 'backend'],
        status: 'published', is_featured: false, read_time: 11, view_count: 1980, published_at: new Date(Date.now() - 4 * 86400000),
      },
      {
        title: 'SQL Fundamentals Every Developer Should Know',
        slug: 'sql-fundamentals-every-developer-should-know',
        catSlug: 'programming',
        excerpt: 'Master relational queries, indexing strategies, normalization forms, and transaction isolation levels.',
        content: `<h2>Relational Data Mastery</h2><p>Learn how B-tree indexes accelerate query retrieval and why avoiding SELECT * protects database throughput.</p>`,
        tags: ['sql', 'database', 'postgres'],
        status: 'published', is_featured: false, read_time: 14, view_count: 2650, published_at: new Date(Date.now() - 2 * 86400000),
      },
      {
        title: 'How to Prepare for Technical Interviews',
        slug: 'how-to-prepare-for-technical-interviews-2026',
        catSlug: 'career-development',
        excerpt: 'Draft guide on behavioral interviewing, live whiteboarding, and effective problem-solving communication.',
        content: `<h2>Interview Preparation Strategy</h2><p>Draft guide covering mock interview cycles and behavioral STAR responses.</p>`,
        tags: ['interview', 'career', 'faang'],
        status: 'draft', is_featured: false, read_time: 7, view_count: 45, published_at: null,
      },
      {
        title: 'Introduction to Artificial Intelligence and Machine Learning',
        slug: 'introduction-to-artificial-intelligence-machine-learning',
        catSlug: 'artificial-intelligence',
        excerpt: 'Demystifying neural networks, gradient descent, transformer architectures, and foundation models.',
        content: `<h2>Understanding AI Foundations</h2><p>Draft article breaking down supervised learning and modern LLM inference mechanics.</p>`,
        tags: ['ai', 'machine-learning', 'transformers'],
        status: 'draft', is_featured: false, read_time: 13, view_count: 82, published_at: null,
      },
      {
        title: 'Git and GitHub for Developers: Best Practices',
        slug: 'git-and-github-for-developers-best-practices',
        catSlug: 'technology-news',
        excerpt: 'Draft article exploring git rebase vs merge, branch protection rules, and automated CI/CD GitHub Actions.',
        content: `<h2>Professional Version Control</h2><p>Draft guide covering atomic commits and conventional commit standards.</p>`,
        tags: ['git', 'github', 'devops'],
        status: 'draft', is_featured: false, read_time: 6, view_count: 28, published_at: null,
      },
      {
        title: 'Understanding JavaScript Async/Await and the Event Loop',
        slug: 'understanding-javascript-async-await-event-loop',
        catSlug: 'web-development',
        excerpt: 'Deep-dive into microtask queues, macrotasks, Promise resolution, and non-blocking asynchronous execution.',
        content: `<h2>The Node.js and Browser Event Loop</h2><p>Scheduled editorial release covering V8 callstack mechanics and Promise scheduling.</p>`,
        tags: ['javascript', 'async', 'event-loop'],
        status: 'scheduled', is_featured: false, read_time: 9, view_count: 15, published_at: null,
        scheduled_at: new Date(Date.now() + 3 * 86400000),
      },
      {
        title: 'Essential Skills for Modern Software Engineers',
        slug: 'essential-skills-for-modern-software-engineers',
        catSlug: 'career-development',
        excerpt: 'Beyond coding: debugging distributed systems, reading telemetry metrics, and cross-functional communication.',
        content: `<h2>The Well-Rounded Engineer</h2><p>Scheduled editorial piece exploring observability, empathy, and code review etiquette.</p>`,
        tags: ['engineering', 'career', 'soft-skills'],
        status: 'scheduled', is_featured: false, read_time: 10, view_count: 22, published_at: null,
        scheduled_at: new Date(Date.now() + 7 * 86400000),
      },
    ];

    for (const b of blogArticlesList) {
      const catId = blogCatMap[b.catSlug];
      await client.query(
        `INSERT INTO blog_posts
           (author_id, category_id, title, slug, excerpt, content, tags, status, is_featured,
            read_time_minutes, view_count, published_at, scheduled_at, seo_title, seo_description,
            created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           category_id = EXCLUDED.category_id,
           excerpt = EXCLUDED.excerpt,
           content = EXCLUDED.content,
           tags = EXCLUDED.tags,
           status = EXCLUDED.status,
           is_featured = EXCLUDED.is_featured,
           read_time_minutes = EXCLUDED.read_time_minutes,
           view_count = EXCLUDED.view_count,
           published_at = EXCLUDED.published_at,
           scheduled_at = EXCLUDED.scheduled_at,
           seo_title = EXCLUDED.seo_title,
           seo_description = EXCLUDED.seo_description,
           updated_at = NOW()`,
        [
          superAdminId, catId, b.title, b.slug, b.excerpt, b.content, b.tags,
          b.status, b.is_featured, b.read_time, b.view_count, b.published_at,
          b.scheduled_at || null, b.title, b.excerpt.substring(0, 150),
        ]
      );
    }
    console.log('[Seeder] 6 Blog Categories & 12 Blog Articles seeded.');

    await client.query('COMMIT');
    console.log('[Seeder] All Content & Marketing seed data successfully committed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seeder] Error executing seed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedContentMarketing()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
