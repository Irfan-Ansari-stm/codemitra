import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { pool } from '../db';

export async function seedApprovals() {
  console.log('--- Seeding Workflow Approvals Hub Data ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing users and tenants to link realistic foreign keys
    const superAdminRes = await client.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const superAdminId = superAdminRes.rows[0]?.id || null;

    const tenantsRes = await client.query("SELECT id, name FROM tenants ORDER BY created_at ASC LIMIT 5");
    const tenants = tenantsRes.rows;
    if (tenants.length === 0) {
      throw new Error('No tenants found. Ensure baseline tenants are seeded.');
    }
    const defaultTenantId = tenants[0].id;

    const studentUsersRes = await client.query("SELECT id, name, email FROM users WHERE role = 'general_student' LIMIT 20");
    const studentUsers = studentUsersRes.rows;

    const coursesRes = await client.query("SELECT id, title, tenant_id, created_by FROM courses LIMIT 10");
    const courses = coursesRes.rows;

    // -------------------------------------------------------------------------
    // 1. SEED 12 INSTITUTE APPLICATIONS
    // -------------------------------------------------------------------------
    console.log('Seeding Institute Applications...');
    const instituteApps = [
      {
        appNum: 'INS-2026-001',
        name: 'Vellore Advanced Polytechnic',
        slug: 'vellore-adv-polytechnic',
        email: 'dean@vap.edu.in',
        phone: '+91 98401 23456',
        contactPerson: 'Dr. R. Ramanathan',
        city: 'Vellore',
        state: 'Tamil Nadu',
        type: 'Autonomous Polytechnic',
        year: 1998,
        status: 'pending',
        desc: 'Premier state technical institute offering 3-year accredited diplomas in computer engineering and robotics.',
        website: 'https://vap.edu.in',
        docs: [
          { name: 'AICTE_Approval_2025.pdf', size: '2.4 MB', type: 'application/pdf', url: '/documents/aicte_approval.pdf' },
          { name: 'Campus_Infrastructure_Audit.pdf', size: '4.1 MB', type: 'application/pdf', url: '/documents/campus_audit.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-002',
        name: 'National Institute of Computing & AI',
        slug: 'nica-bengaluru',
        email: 'registrar@nica.ac.in',
        phone: '+91 80 2345 6789',
        contactPerson: 'Prof. Ananya Sen',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'Deemed University',
        year: 2012,
        status: 'pending',
        desc: 'Specialized computing university with 1,800 active undergraduate students looking to onboard all labs to CodeVerse IDE.',
        website: 'https://nica.ac.in',
        docs: [
          { name: 'UGC_Autonomous_Certificate.pdf', size: '1.8 MB', type: 'application/pdf', url: '/documents/ugc_cert.pdf' },
          { name: 'Academic_Board_Resolution.pdf', size: '850 KB', type: 'application/pdf', url: '/documents/board_resolution.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-003',
        name: 'Delhi Metropolitan Institute of Tech',
        slug: 'dmit-delhi',
        email: 'admin@dmit.edu.in',
        phone: '+91 11 2678 1234',
        contactPerson: 'Dr. Vivek Sharma',
        city: 'New Delhi',
        state: 'Delhi',
        type: 'State University',
        year: 2004,
        status: 'pending',
        desc: 'Metropolitan university offering B.Tech and MCA courses seeking automated code evaluation and student tracking.',
        website: 'https://dmit.edu.in',
        docs: [
          { name: 'State_Affiliation_Letter.pdf', size: '3.2 MB', type: 'application/pdf', url: '/documents/affiliation.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-004',
        name: 'Kalinga Institute of Software Engineering',
        slug: 'kise-bhubaneswar',
        email: 'contact@kise.edu.in',
        phone: '+91 674 256 7890',
        contactPerson: 'Priya Patnaik',
        city: 'Bhubaneswar',
        state: 'Odisha',
        type: 'Private University',
        year: 2015,
        status: 'pending',
        desc: 'Emerging technology college focused on full-stack web and cloud computing certifications.',
        website: 'https://kise.edu.in',
        docs: [
          { name: 'Registration_Document.pdf', size: '1.5 MB', type: 'application/pdf', url: '/documents/reg_doc.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-005',
        name: 'Sahyadri Institute of Engineering & Research',
        slug: 'sahyadri-ier',
        email: 'principal@sahyadri-ier.org',
        phone: '+91 824 227 7777',
        contactPerson: 'Dr. Umesh Kamath',
        city: 'Mangaluru',
        state: 'Karnataka',
        type: 'Engineering College',
        year: 2007,
        status: 'pending',
        desc: 'NAAC A+ accredited technical campus seeking campus license for 1,200 CS/IT undergrads.',
        website: 'https://sahyadri-ier.org',
        docs: [
          { name: 'NAAC_Accreditation_A_Plus.pdf', size: '3.7 MB', type: 'application/pdf', url: '/documents/naac.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-006',
        name: 'Maharashtra Institute of Cloud Computing',
        slug: 'micc-pune',
        email: 'admissions@micc.pune.edu',
        phone: '+91 20 4123 5678',
        contactPerson: 'Sunil Deshmukh',
        city: 'Pune',
        state: 'Maharashtra',
        type: 'Autonomous College',
        year: 2018,
        status: 'under_review',
        desc: 'Postgraduate computing center offering specialized diploma courses in cloud architecture and DevOps.',
        website: 'https://micc.pune.edu',
        docs: [
          { name: 'Govt_Approval_MICC.pdf', size: '2.1 MB', type: 'application/pdf', url: '/documents/govt_approval.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-007',
        name: 'Hyderabad Institute of Data Science',
        slug: 'hids-hyderabad',
        email: 'director@hids.ac.in',
        phone: '+91 40 2300 4567',
        contactPerson: 'Dr. K. Srinivas Rao',
        city: 'Hyderabad',
        state: 'Telangana',
        type: 'Research Institute',
        year: 2019,
        status: 'under_review',
        desc: 'Research-led center for Data Science and Machine Learning wanting to integrate automated Python test benches.',
        website: 'https://hids.ac.in',
        docs: [
          { name: 'Research_Charter_2025.pdf', size: '2.9 MB', type: 'application/pdf', url: '/documents/charter.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-008',
        name: 'Apex Institute of Technology',
        slug: 'apex-institute-of-technology',
        email: 'admissions@apex.edu.in',
        phone: '+91 98765 43210',
        contactPerson: 'Prof. Rajesh Khanna',
        city: 'Noida',
        state: 'Uttar Pradesh',
        type: 'Engineering College',
        year: 2005,
        status: 'approved',
        desc: 'Premier engineering and polytechnic institution approved for CodeVerse enterprise tier.',
        website: 'https://apex.edu.in',
        docs: [
          { name: 'Apex_Signed_SLA.pdf', size: '1.2 MB', type: 'application/pdf', url: '/documents/apex_sla.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-009',
        name: 'Techno India University',
        slug: 'techno-india-univ',
        email: 'chancellor@technoindia.edu',
        phone: '+91 33 2357 5683',
        contactPerson: 'Dr. G. Roy Chowdhury',
        city: 'Kolkata',
        state: 'West Bengal',
        type: 'Private University',
        year: 2001,
        status: 'approved',
        desc: 'Major eastern India technical university with 5,000+ students on CodeVerse campus plan.',
        website: 'https://technoindia.edu',
        docs: [
          { name: 'UGC_Recognition_techno.pdf', size: '4.5 MB', type: 'application/pdf', url: '/documents/techno_ugc.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-010',
        name: 'Sunrise Global Institute of Computers',
        slug: 'sunrise-global-computers',
        email: 'info@sunriseglobal.org',
        phone: '+91 141 229 9900',
        contactPerson: 'Mahesh Agarwal',
        city: 'Jaipur',
        state: 'Rajasthan',
        type: 'Affiliated Institute',
        year: 2022,
        status: 'rejected',
        rejectionReason: 'Incomplete accreditation credentials and non-verifiable physical campus address.',
        desc: 'Unaccredited coaching setup applying under university tier.',
        website: 'https://sunriseglobal.org',
        docs: [
          { name: 'Local_Trade_License.pdf', size: '512 KB', type: 'application/pdf', url: '/documents/trade_lic.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-011',
        name: 'Shivalik Institute of Technology',
        slug: 'shivalik-inst-tech',
        email: 'dean.academics@shivalik.edu.in',
        phone: '+91 135 277 8899',
        contactPerson: 'Dr. Sandeep Rawat',
        city: 'Dehradun',
        state: 'Uttarakhand',
        type: 'Technical College',
        year: 2011,
        status: 'changes_requested',
        adminNotes: 'Requested updated AICTE approval copy for 2025-2026 academic year and authorized signatory ID proof.',
        desc: 'Pioneering technical institute nestled in Doon valley with 800 enrolled computer engineering scholars.',
        website: 'https://shivalik.edu.in',
        docs: [
          { name: 'Shivalik_AICTE_Old.pdf', size: '2.0 MB', type: 'application/pdf', url: '/documents/shivalik_aicte.pdf' }
        ]
      },
      {
        appNum: 'INS-2026-012',
        name: 'Malabar Academy of Digital Sciences',
        slug: 'malabar-digital-academy',
        email: 'registrar@malabardigital.ac.in',
        phone: '+91 484 288 3344',
        contactPerson: 'Fathima Noor',
        city: 'Kochi',
        state: 'Kerala',
        type: 'Polytechnic',
        year: 2016,
        status: 'changes_requested',
        adminNotes: 'Submitted tax exemption certificate has expired; requested current financial year registration.',
        desc: 'Digital technologies polytechnic specializing in mobile development, frontend engineering, and UI/UX.',
        website: 'https://malabardigital.ac.in',
        docs: [
          { name: 'Malabar_Registration_Doc.pdf', size: '1.4 MB', type: 'application/pdf', url: '/documents/malabar_reg.pdf' }
        ]
      }
    ];

    for (const app of instituteApps) {
      const existing = await client.query('SELECT id FROM institute_applications WHERE application_number = $1 OR slug = $2', [app.appNum, app.slug]);
      let appId = existing.rows[0]?.id;

      if (!appId) {
        const insRes = await client.query(`
          INSERT INTO institute_applications (
            application_number, institution_name, slug, contact_email, contact_phone,
            contact_person, city, state, institution_type, established_year, website_url,
            description, documents, status, rejection_reason, admin_notes, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            NOW() - INTERVAL '${Math.floor(Math.random() * 10) + 1} days', NOW()
          ) RETURNING id
        `, [
          app.appNum, app.name, app.slug, app.email, app.phone,
          app.contactPerson, app.city, app.state, app.type, app.year, app.website,
          app.desc, JSON.stringify(app.docs), app.status, app.rejectionReason || null, app.adminNotes || null
        ]);
        appId = insRes.rows[0].id;
      } else {
        await client.query(`
          UPDATE institute_applications
          SET application_number = $1, contact_person = $2, city = $3, state = $4,
              institution_type = $5, established_year = $6, status = $7, rejection_reason = $8, admin_notes = $9
          WHERE id = $10
        `, [
          app.appNum, app.contactPerson, app.city, app.state, app.type, app.year,
          app.status, app.rejectionReason || null, app.adminNotes || null, appId
        ]);
      }

      // Add approval history if not already present
      const histExists = await client.query('SELECT id FROM approval_history WHERE entity_type = $1 AND entity_id = $2', ['institute', appId]);
      if (histExists.rows.length === 0) {
        await client.query(`
          INSERT INTO approval_history (
            entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '1 day'
          )
        `, [
          'institute', appId,
          app.status === 'approved' ? 'approve' : app.status === 'rejected' ? 'reject' : app.status === 'changes_requested' ? 'request_changes' : 'submit',
          'pending', app.status,
          app.rejectionReason || (app.status === 'approved' ? 'Meets all accreditation standards.' : null),
          app.adminNotes || (app.status === 'approved' ? 'Verified AICTE affiliation with state portal.' : null),
          superAdminId
        ]);
      }
    }

    // -------------------------------------------------------------------------
    // 2. SEED 20 STUDENT ADMISSIONS
    // (10 pending, 3 under_review, 3 approved, 2 rejected, 2 changes_requested)
    // -------------------------------------------------------------------------
    console.log('Seeding Student Admissions...');
    const admissionStatuses: Array<'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested'> = [
      'pending', 'pending', 'pending', 'pending', 'pending',
      'pending', 'pending', 'pending', 'pending', 'pending',
      'under_review', 'under_review', 'under_review',
      'approved', 'approved', 'approved',
      'rejected', 'rejected',
      'changes_requested', 'changes_requested'
    ];

    const studentCandidates = [
      { name: 'Aarav Mehta', email: 'aarav.mehta@example.com', phone: '+91 98200 11223', program: 'B.Tech Computer Science', gpa: '9.2 / 10' },
      { name: 'Diya Sengupta', email: 'diya.sengupta@example.com', phone: '+91 98301 44556', program: 'Master of Computer Applications (MCA)', gpa: '8.8 / 10' },
      { name: 'Rohan Varma', email: 'rohan.varma@example.com', phone: '+91 98402 77889', program: 'B.Sc Data Science & AI', gpa: '8.5 / 10' },
      { name: 'Ananya Deshmukh', email: 'ananya.d@example.com', phone: '+91 98503 99001', program: 'B.Tech Information Technology', gpa: '9.5 / 10' },
      { name: 'Kabir Singhania', email: 'kabir.s@example.com', phone: '+91 98604 12345', program: 'Diploma in Cloud Engineering', gpa: '8.1 / 10' },
      { name: 'Isha Nair', email: 'isha.nair@example.com', phone: '+91 98705 23456', program: 'B.Tech Artificial Intelligence', gpa: '9.0 / 10' },
      { name: 'Aditya Kulkarni', email: 'aditya.k@example.com', phone: '+91 98806 34567', program: 'Integrated M.Tech Software Engg', gpa: '8.9 / 10' },
      { name: 'Tanvi Joshi', email: 'tanvi.j@example.com', phone: '+91 98907 45678', program: 'BCA (Cloud & Security)', gpa: '8.4 / 10' },
      { name: 'Varun Pillai', email: 'varun.p@example.com', phone: '+91 99008 56789', program: 'Postgraduate Diploma in Cyber Defense', gpa: '8.7 / 10' },
      { name: 'Neha Chawla', email: 'neha.c@example.com', phone: '+91 99109 67890', program: 'B.Tech Computer Science (Honors)', gpa: '9.4 / 10' },
      { name: 'Siddharth Rao', email: 'siddharth.r@example.com', phone: '+91 99201 78901', program: 'M.Tech Machine Learning', gpa: '9.1 / 10' },
      { name: 'Pooja Hegde', email: 'pooja.h@example.com', phone: '+91 99302 89012', program: 'B.Sc Computer Science', gpa: '8.3 / 10' },
      { name: 'Manish Pandey', email: 'manish.p@example.com', phone: '+91 99403 90123', program: 'B.Tech DevOps & Systems', gpa: '8.6 / 10' },
      { name: 'Kavita Menon', email: 'kavita.m@example.com', phone: '+91 99504 01234', program: 'B.Tech Computer Science', gpa: '9.6 / 10' },
      { name: 'Rahul Bose', email: 'rahul.b@example.com', phone: '+91 99605 12340', program: 'BCA (Web & App Development)', gpa: '8.9 / 10' },
      { name: 'Sneha Patel', email: 'sneha.p@example.com', phone: '+91 99706 23451', program: 'M.Tech Distributed Systems', gpa: '9.3 / 10' },
      { name: 'Gaurav Gill', email: 'gaurav.g@example.com', phone: '+91 99807 34562', program: 'B.Tech Information Technology', gpa: '5.2 / 10' },
      { name: 'Akash Tripathi', email: 'akash.t@example.com', phone: '+91 99908 45673', program: 'Diploma in Computer Applications', gpa: '5.0 / 10' },
      { name: 'Ritu Ganguly', email: 'ritu.g@example.com', phone: '+91 98101 56784', program: 'MCA (Data Engineering)', gpa: '7.9 / 10' },
      { name: 'Arjun Nambiar', email: 'arjun.n@example.com', phone: '+91 98202 67895', program: 'B.Tech Computer Science', gpa: '8.2 / 10' }
    ];

    for (let i = 0; i < studentCandidates.length; i++) {
      const cand = studentCandidates[i];
      const status = admissionStatuses[i];
      const appNum = `ADM-2026-${String(i + 1).padStart(4, '0')}`;
      const tenant = tenants[i % tenants.length];
      const studentUser = studentUsers[i % studentUsers.length];

      const docs = [
        { name: 'HSC_12th_Grade_Marksheet.pdf', size: '1.4 MB', type: 'application/pdf', url: '/documents/marksheet_12.pdf' },
        { name: 'National_Identity_Aadhaar.pdf', size: '620 KB', type: 'application/pdf', url: '/documents/aadhaar_card.pdf' },
        { name: 'Statement_of_Purpose.pdf', size: '480 KB', type: 'application/pdf', url: '/documents/sop.pdf' }
      ];

      const academicDetails = {
        priorInstitute: 'Delhi Public School / St. Xavier Junior College',
        qualifyingExam: 'CBSE XII / State Board Examination',
        scorePercentage: cand.gpa,
        mathsScore: '94 / 100',
        physicsScore: '89 / 100',
        csScore: '98 / 100'
      };

      let rejectionReason = null;
      let adminNotes = null;
      if (status === 'rejected') {
        rejectionReason = 'Minimum qualification criteria not met (required 60% in PCM aggregate).';
        adminNotes = 'Candidate had backlogs in Class 12 mathematics.';
      } else if (status === 'changes_requested') {
        adminNotes = 'Original migration certificate and transfer certificate must be uploaded; only photocopies submitted.';
      } else if (status === 'approved') {
        adminNotes = 'Merit list Rank #14. All documents verified against state board portal.';
      }

      const existingAdm = await client.query('SELECT id FROM admissions WHERE application_number = $1', [appNum]);
      let admId = existingAdm.rows[0]?.id;

      if (!admId) {
        const admRes = await client.query(`
          INSERT INTO admissions (
            application_number, student_id, tenant_id, full_name, email, phone, program,
            academic_details, documents, status, rejection_reason, admin_notes, submitted_at,
            reviewed_by, reviewed_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            NOW() - INTERVAL '${i + 1} days',
            $13,
            ${status !== 'pending' ? "NOW() - INTERVAL '1 day'" : 'NULL'},
            NOW() - INTERVAL '${i + 1} days',
            NOW()
          ) RETURNING id
        `, [
          appNum, studentUser?.id || null, tenant.id, cand.name, cand.email, cand.phone,
          cand.program, JSON.stringify(academicDetails), JSON.stringify(docs), status,
          rejectionReason, adminNotes, status !== 'pending' ? superAdminId : null
        ]);
        admId = admRes.rows[0].id;
      } else {
        await client.query(`
          UPDATE admissions
          SET status = $1, rejection_reason = $2, admin_notes = $3, full_name = $4, email = $5, program = $6
          WHERE id = $7
        `, [status, rejectionReason, adminNotes, cand.name, cand.email, cand.program, admId]);
      }

      // Record approval history
      const histExists = await client.query('SELECT id FROM approval_history WHERE entity_type = $1 AND entity_id = $2', ['admission', admId]);
      if (histExists.rows.length === 0) {
        await client.query(`
          INSERT INTO approval_history (
            entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${Math.max(1, i)} hours'
          )
        `, [
          'admission', admId,
          status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status === 'changes_requested' ? 'request_changes' : 'submit',
          'pending', status, rejectionReason, adminNotes, superAdminId
        ]);
      }
    }

    // -------------------------------------------------------------------------
    // 3. SEED 15 COURSE SUBMISSIONS
    // (7 pending, 3 under_review, 2 approved, 1 rejected, 2 changes_requested)
    // -------------------------------------------------------------------------
    console.log('Seeding Course Submissions...');
    const courseStatuses: Array<'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested'> = [
      'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
      'under_review', 'under_review', 'under_review',
      'approved', 'approved',
      'rejected',
      'changes_requested', 'changes_requested'
    ];

    const courseCatalog = [
      { title: 'Modern Distributed Systems with Go', category: 'Backend & Cloud', level: 'Advanced', version: '2.1.0', desc: 'Design fault-tolerant distributed consensus, Raft protocol, and gRPC microservices in Go.' },
      { title: 'Full-Stack Next.js 14 & Node.js Production Masterclass', category: 'Web Development', level: 'Intermediate', version: '1.4.0', desc: 'Architect enterprise Next.js App Router applications with Server Actions and PostgreSQL.' },
      { title: 'Rust Systems Programming & Embedded IoT', category: 'Systems Programming', level: 'Advanced', version: '1.0.0', desc: 'Memory safety without garbage collection, concurrency primitives, and bare-metal programming.' },
      { title: 'Deep Learning with PyTorch & CUDA Kernels', category: 'Artificial Intelligence', level: 'Advanced', version: '2.0.0', desc: 'Build transformers from scratch, optimize CUDA forward-backward passes, and fine-tune LLMs.' },
      { title: 'PostgreSQL Internals and Query Optimization', category: 'Database Engineering', level: 'Intermediate', version: '1.2.0', desc: 'MVCC, WAL mechanics, B-tree indexes, execution plans, and production connection pool tuning.' },
      { title: 'Practical Kubernetes & GitOps with ArgoCD', category: 'DevOps & SRE', level: 'Intermediate', version: '1.1.0', desc: 'Automate zero-downtime canary deployments, ingress controllers, and secret managers.' },
      { title: 'Competitive Programming: Advanced Graphs & Flow', category: 'Algorithms', level: 'Advanced', version: '3.0.0', desc: 'Max-Flow Min-Cut, Dinic algorithm, segment trees with lazy propagation, and centroid decomposition.' },
      { title: 'Cybersecurity: Defensive Web Application Security', category: 'Security', level: 'Intermediate', version: '1.0.0', desc: 'Prevent SSRF, XSS, CSRF, and SQL injection with hands-on live target laboratories.' },
      { title: 'C++20 High-Performance Computing & Concurrency', category: 'Systems Programming', level: 'Advanced', version: '2.0.0', desc: 'SIMD vectorization, lock-free queues, atomic primitives, and coroutine pipelines.' },
      { title: 'Microservices Design Patterns in Java & Spring Boot 3', category: 'Enterprise Backend', level: 'Intermediate', version: '1.5.0', desc: 'Event-driven architecture with Apache Kafka, saga pattern, and distributed tracing.' },
      { title: 'Introduction to Data Structures & Algorithms in Java', category: 'Computer Science Core', level: 'Beginner', version: '1.0.0', desc: 'Foundational problem solving covering arrays, linked lists, trees, and sorting techniques.' },
      { title: 'Python for Automated Testing & Web Scraping', category: 'Software Quality', level: 'Beginner', version: '1.2.0', desc: 'Pytest test suites, Playwright headless browser testing, and resilient data extractors.' },
      { title: 'Get Rich Quick with Crypto Scripting', category: 'Unverified', level: 'Beginner', version: '0.1.0', desc: 'Unverified trading bots script claiming unrealistic returns without academic rigor.' },
      { title: 'Applied Machine Learning for Healthcare Data', category: 'Data Science', level: 'Intermediate', version: '1.0.0', desc: 'Computer vision on chest X-rays and structured clinical record prediction.' },
      { title: 'Mobile App Development with Flutter & Dart 3', category: 'Mobile Engineering', level: 'Beginner', version: '1.1.0', desc: 'Cross-platform native iOS & Android applications with Clean Architecture and Riverpod.' }
    ];

    for (let i = 0; i < courseCatalog.length; i++) {
      const cItem = courseCatalog[i];
      const status = courseStatuses[i];
      const subNum = `SUB-2026-${String(i + 1).padStart(4, '0')}`;
      const tenant = tenants[i % tenants.length];
      const instructor = studentUsers[i % studentUsers.length] || superAdminRes.rows[0];

      // Ensure a corresponding course exists in courses table
      let courseId = courses[i % courses.length]?.id;
      if (!courseId) {
        const cRes = await client.query(`
          INSERT INTO courses (
            tenant_id, created_by, title, description, status, is_deleted, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, false, NOW() - INTERVAL '5 days', NOW()
          ) RETURNING id
        `, [tenant.id, instructor.id, cItem.title, cItem.desc, status === 'approved' ? 'published' : 'draft']);
        courseId = cRes.rows[0].id;
      }

      const docs = [
        { name: 'Course_Syllabus_Breakdown.pdf', size: '1.8 MB', type: 'application/pdf', url: '/documents/syllabus.pdf' },
        { name: 'Lecture_Slides_Week_1_to_8.pdf', size: '14.2 MB', type: 'application/pdf', url: '/documents/slides.pdf' },
        { name: 'Sample_Coding_Assignments.pdf', size: '920 KB', type: 'application/pdf', url: '/documents/assignments.pdf' }
      ];

      let rejectionReason = null;
      let reviewComments = null;
      let adminNotes = null;
      if (status === 'rejected') {
        rejectionReason = 'Content fails CodeVerse curriculum guidelines and promotes misleading trading schemes.';
        adminNotes = 'Rejected during content moderation review.';
      } else if (status === 'changes_requested') {
        reviewComments = 'Please add weekly rubric breakdowns and include test case edge specifications for lab assignments.';
        adminNotes = 'Returned to author for curriculum rubric expansion.';
      } else if (status === 'approved') {
        reviewComments = 'Excellent course syllabus and high quality test cases. Approved for platform-wide rollout.';
        adminNotes = 'Published to global course catalog.';
      }

      const existingSub = await client.query('SELECT id FROM course_submissions WHERE submission_number = $1', [subNum]);
      let subId = existingSub.rows[0]?.id;

      if (!subId) {
        const subRes = await client.query(`
          INSERT INTO course_submissions (
            submission_number, course_id, tenant_id, instructor_id, submission_version,
            title, category, level, description, syllabus_summary, documents, status,
            rejection_reason, review_comments, admin_notes, submitted_at,
            reviewed_by, reviewed_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            NOW() - INTERVAL '${i + 2} days',
            $16,
            ${status !== 'pending' ? "NOW() - INTERVAL '1 day'" : 'NULL'},
            NOW() - INTERVAL '${i + 2} days',
            NOW()
          ) RETURNING id
        `, [
          subNum, courseId, tenant.id, instructor.id, cItem.version,
          cItem.title, cItem.category, cItem.level, cItem.desc,
          `Comprehensive 12-week syllabus with hands-on coding modules in ${cItem.category}`,
          JSON.stringify(docs), status, rejectionReason, reviewComments, adminNotes,
          status !== 'pending' ? superAdminId : null
        ]);
        subId = subRes.rows[0].id;
      } else {
        await client.query(`
          UPDATE course_submissions
          SET status = $1, rejection_reason = $2, review_comments = $3, admin_notes = $4,
              title = $5, category = $6, level = $7, submission_version = $8
          WHERE id = $9
        `, [status, rejectionReason, reviewComments, adminNotes, cItem.title, cItem.category, cItem.level, cItem.version, subId]);
      }

      // Record approval history
      const histExists = await client.query('SELECT id FROM approval_history WHERE entity_type = $1 AND entity_id = $2', ['course', subId]);
      if (histExists.rows.length === 0) {
        await client.query(`
          INSERT INTO approval_history (
            entity_type, entity_id, action, previous_status, new_status, reason, admin_notes, performed_by, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '${Math.max(1, i)} hours'
          )
        `, [
          'course', subId,
          status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : status === 'changes_requested' ? 'request_changes' : 'submit',
          'pending', status, rejectionReason || reviewComments, adminNotes, superAdminId
        ]);
      }
    }

    await client.query('COMMIT');
    console.log('Workflow Approvals Hub data seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed approvals:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedApprovals()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
