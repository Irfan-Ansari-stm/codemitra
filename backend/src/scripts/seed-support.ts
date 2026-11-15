import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import bcrypt from 'bcrypt';
import { pool } from '../db';

export async function seedSupport() {
  console.log('--- Seeding Support Ticket Help Desk ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch existing tenants to link agents and tickets realistically
    const tenantsRes = await client.query("SELECT id, name FROM tenants LIMIT 5");
    const tenants = tenantsRes.rows;
    const defaultTenantId = tenants[0]?.id || null;

    // 1. Ensure 5 Support Agents exist in users table
    console.log('Ensuring 5 Support Agents...');
    const agentPasswordHash = await bcrypt.hash('SupportAgent@2026', 10);
    const agentDefs = [
      { name: 'Vikram Malhotra', email: 'vikram.support@codeverse.dev', department: 'Technical Tier-2' },
      { name: 'Priya Sharma', email: 'priya.support@codeverse.dev', department: 'Billing & Subscriptions' },
      { name: 'Amitabh Sen', email: 'amitabh.support@codeverse.dev', department: 'Platform & Infrastructure' },
      { name: 'Sneha Roy', email: 'sneha.support@codeverse.dev', department: 'Academic & Courses' },
      { name: 'Karan Verma', email: 'karan.support@codeverse.dev', department: 'Customer Success' },
    ];

    const agentIds: string[] = [];
    for (const ag of agentDefs) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [ag.email]);
      if (existing.rows.length > 0) {
        agentIds.push(existing.rows[0].id);
      } else {
        const ins = await client.query(`
          INSERT INTO users (name, email, password_hash, role, tenant_id, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, 'institution_admin', $4, true, NOW() - INTERVAL '30 days', NOW())
          RETURNING id
        `, [ag.name, ag.email, agentPasswordHash, defaultTenantId]);
        agentIds.push(ins.rows[0].id);
      }
    }

    // 2. Fetch existing students and tenants to link tickets realistically
    const studentsRes = await client.query("SELECT id, name, email, tenant_id FROM users WHERE role IN ('institution_student', 'general_student') LIMIT 25");
    let studentUsers = studentsRes.rows;
    if (studentUsers.length === 0) {
      const allUsers = await client.query("SELECT id, name, email, tenant_id FROM users LIMIT 15");
      studentUsers = allUsers.rows;
    }

    // 3. Define the 30 realistic support tickets
    // Target status distribution: 10 Open, 8 In Progress, 7 Resolved, 5 Closed.
    // Target priority distribution: 5 Urgent, 8 High, 10 Medium, 7 Low.
    const ticketDefinitions = [
      // 1-10: Open Tickets (10)
      {
        num: 'TCK-2026-0001',
        subject: 'Unable to log in to student dashboard after password reset',
        desc: 'I reset my password 20 minutes ago, but the login page continues displaying invalid credentials error.',
        category: 'Account Issue',
        priority: 'high',
        status: 'open',
        dept: 'Customer Success',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Please help, I have an upcoming test at 4 PM and cannot log in.' }
        ]
      },
      {
        num: 'TCK-2026-0002',
        subject: 'Payment deducted but campus subscription not activated',
        desc: 'Razorpay payment for student annual tier succeeded, bank transaction ID #TXN882991. The dashboard still shows Free plan.',
        category: 'Payment Issue',
        priority: 'urgent',
        status: 'open',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Attached payment receipt screenshot. Amount INR 4,999 debited.' }
        ]
      },
      {
        num: 'TCK-2026-0003',
        subject: 'Course videos and lecture slides are failing to buffer',
        desc: 'In the Distributed Systems course, videos in Module 3 hang indefinitely on 1080p stream.',
        category: 'Course Issue',
        priority: 'medium',
        status: 'open',
        dept: 'Academic & Courses',
        assignedIdx: null,
        messages: [
          { senderType: 'user', msg: 'Reproduced on both Chrome 124 and Firefox 126.' }
        ]
      },
      {
        num: 'TCK-2026-0004',
        subject: 'Institute administrator unable to bulk-upload student roster',
        desc: 'CSV import fails on row 142 stating duplicate email format error, but spreadsheet column validates cleanly.',
        category: 'Account Issue',
        priority: 'high',
        status: 'open',
        dept: 'Technical Tier-2',
        assignedIdx: 2,
        messages: [
          { senderType: 'user', msg: 'We have 250 students waiting to begin today\'s orientation lab.' }
        ]
      },
      {
        num: 'TCK-2026-0005',
        subject: 'Online IDE WebAssembly sandbox crashing on memory-intensive recursion',
        desc: 'Running fibonacci benchmark with depth 40 throws Uncaught RuntimeError: memory access out of bounds.',
        category: 'Technical Issue',
        priority: 'urgent',
        status: 'open',
        dept: 'Platform & Infrastructure',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Happens on C++ and Go runtimes in the browser.' }
        ]
      },
      {
        num: 'TCK-2026-0006',
        subject: 'Inquiry regarding campus license upgrade for 2026-2027 academic session',
        desc: 'Our university wants to expand from 500 to 2,000 active student seats. Need custom enterprise quotation.',
        category: 'General Query',
        priority: 'medium',
        status: 'open',
        dept: 'Customer Success',
        assignedIdx: 4,
        messages: [
          { senderType: 'user', msg: 'Please connect our procurement office with your enterprise sales lead.' }
        ]
      },
      {
        num: 'TCK-2026-0007',
        subject: 'Dark mode syntax highlighter contrast issue in Python editor',
        desc: 'Keyword tokens appear dark purple against black canvas, making variable identifiers hard to read.',
        category: 'Bug Report',
        priority: 'low',
        status: 'open',
        dept: 'Technical Tier-2',
        assignedIdx: null,
        messages: [
          { senderType: 'user', msg: 'Minor UI accessibility bug in Monaco editor theme config.' }
        ]
      },
      {
        num: 'TCK-2026-0008',
        subject: 'Two-factor authentication SMS OTP never arrives on Airtel number',
        desc: 'OTP request times out after 60 seconds without delivering SMS token.',
        category: 'Account Issue',
        priority: 'urgent',
        status: 'open',
        dept: 'Platform & Infrastructure',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'I have retried 4 times. Country code +91.' }
        ]
      },
      {
        num: 'TCK-2026-0009',
        subject: 'Incorrect GST invoice generated for quarterly institute billing',
        desc: 'State GST code in the invoice PDF shows Delhi instead of Maharashtra campus branch.',
        category: 'Billing',
        priority: 'medium',
        status: 'open',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Our accounting department needs the corrected tax credit document.' }
        ]
      },
      {
        num: 'TCK-2026-0010',
        subject: 'Request to reset contest submission attempt after accidental disconnect',
        desc: 'Wi-Fi dropped during CodeVerse Weekly Contest 14, locking problem 3 submission.',
        category: 'General Query',
        priority: 'low',
        status: 'open',
        dept: 'Academic & Courses',
        assignedIdx: null,
        messages: [
          { senderType: 'user', msg: 'Is it possible to grant a re-attempt flag?' }
        ]
      },

      // 11-18: In Progress Tickets (8)
      {
        num: 'TCK-2026-0011',
        subject: 'Assignment submission button not responding on Safari iOS',
        desc: 'Tapping Submit Assignment does nothing on iPhone 15 Pro Safari; no network call dispatched in devtools.',
        category: 'Assignment Issue',
        priority: 'urgent',
        status: 'in_progress',
        dept: 'Technical Tier-2',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Submission deadline is tonight at 11:59 PM.' },
          { senderType: 'admin', msg: 'We have reproduced the touch event propagation issue and are packaging a patch.' },
          { senderType: 'note', msg: 'Internal Note: Safari pointer-events bug in FixedBottomCTA component.' }
        ]
      },
      {
        num: 'TCK-2026-0012',
        subject: 'Quiz submission timeout triggered false zero grade',
        desc: 'Student finished quiz with 8 minutes remaining, but server recorded timeout state and gave 0/100.',
        category: 'Technical Issue',
        priority: 'urgent',
        status: 'in_progress',
        dept: 'Academic & Courses',
        assignedIdx: 3,
        messages: [
          { senderType: 'user', msg: 'Audit logs should show my answers were submitted at 11:42.' },
          { senderType: 'admin', msg: 'Investigating Redis submission buffer to restore your raw attempt snapshot.' }
        ]
      },
      {
        num: 'TCK-2026-0013',
        subject: 'Student batch synchronization delay from institute ERP integration',
        desc: 'Webhook sent from campus ERP enrolled 40 students, but only 12 show in the CodeVerse cohort roster.',
        category: 'Technical Issue',
        priority: 'high',
        status: 'in_progress',
        dept: 'Platform & Infrastructure',
        assignedIdx: 2,
        messages: [
          { senderType: 'user', msg: 'Webhook delivery returned HTTP 200.' },
          { senderType: 'admin', msg: 'Examining asynchronous queue worker logs for retry backoff drops.' }
        ]
      },
      {
        num: 'TCK-2026-0014',
        subject: 'Credit card recurring auto-debit failed despite active card',
        desc: 'HDFC credit card was declined with gateway code 54 expired card, but physical card is valid till 2028.',
        category: 'Payment Issue',
        priority: 'medium',
        status: 'in_progress',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Please provide an alternate direct payment link.' },
          { senderType: 'admin', msg: 'Sent secure Stripe payment link to your registered email.' }
        ]
      },
      {
        num: 'TCK-2026-0015',
        subject: 'Missing Python 3.12 library dependencies (pandas, torch) in Data Science lab',
        desc: 'Importing torch in lab 4 notebook throws ModuleNotFoundError: No module named torch.',
        category: 'Course Issue',
        priority: 'high',
        status: 'in_progress',
        dept: 'Academic & Courses',
        assignedIdx: 3,
        messages: [
          { senderType: 'user', msg: 'Students cannot complete gradient descent exercises.' },
          { senderType: 'admin', msg: 'Rebuilding container image with pytorch CPU wheel.' }
        ]
      },
      {
        num: 'TCK-2026-0016',
        subject: 'Weekly analytics export CSV missing student email column',
        desc: 'Downloaded institution report has roll number and progress, but user email column is empty.',
        category: 'Bug Report',
        priority: 'medium',
        status: 'in_progress',
        dept: 'Customer Success',
        assignedIdx: 4,
        messages: [
          { senderType: 'user', msg: 'We need this to cross-reference university attendance.' },
          { senderType: 'admin', msg: 'Fixing SQL projection in analytics export service.' }
        ]
      },
      {
        num: 'TCK-2026-0017',
        subject: 'Plagiarism check false-positive on standard boilerplate code',
        desc: 'System marked 89% plagiarism because all students used the provided starter template code.',
        category: 'Assignment Issue',
        priority: 'high',
        status: 'in_progress',
        dept: 'Academic & Courses',
        assignedIdx: 3,
        messages: [
          { senderType: 'user', msg: 'Please whitelist template files in assignment 2.' },
          { senderType: 'admin', msg: 'Excluding template AST nodes and recalculating scores.' }
        ]
      },
      {
        num: 'TCK-2026-0018',
        subject: 'Faculty role cannot view cross-department student submissions',
        desc: 'Professor assigned to interdisciplinary AI minor cannot open engineering department student code.',
        category: 'Account Issue',
        priority: 'medium',
        status: 'in_progress',
        dept: 'Technical Tier-2',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Please check RBAC permissions on faculty group.' },
          { senderType: 'admin', msg: 'Reviewing tenant role permissions matrix.' }
        ]
      },

      // 19-25: Resolved Tickets (7)
      {
        num: 'TCK-2026-0019',
        subject: 'Course completion certificate not generated upon 100% video completion',
        desc: 'Finished Full-Stack Next.js curriculum, all checkmarks green, but certificate button was grayed out.',
        category: 'Course Issue',
        priority: 'medium',
        status: 'resolved',
        dept: 'Academic & Courses',
        assignedIdx: 3,
        messages: [
          { senderType: 'user', msg: 'I completed module 12 yesterday.' },
          { senderType: 'admin', msg: 'Recalculated completion state; your signed PDF certificate is now ready for download.' }
        ]
      },
      {
        num: 'TCK-2026-0020',
        subject: 'Unable to reset account password due to expired token link',
        desc: 'Reset link clicked within 5 minutes says Token has expired.',
        category: 'Account Issue',
        priority: 'medium',
        status: 'resolved',
        dept: 'Customer Success',
        assignedIdx: 4,
        messages: [
          { senderType: 'user', msg: 'Link sent to user@college.edu was rejected.' },
          { senderType: 'admin', msg: 'Issued fresh 24-hour verification token. Account access restored.' }
        ]
      },
      {
        num: 'TCK-2026-0021',
        subject: 'Double billing charge on student annual subscription',
        desc: 'Account was charged twice ($49.99 x 2) on November 2nd invoice.',
        category: 'Billing',
        priority: 'high',
        status: 'resolved',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Bank statement attached.' },
          { senderType: 'admin', msg: 'Duplicate charge refunded back to original payment method. Ref #RFD48921.' }
        ]
      },
      {
        num: 'TCK-2026-0022',
        subject: 'Judge0 online execution engine returning unexpected memory limit exceeded on simple loop',
        desc: 'Basic for loop in Java exceeded 256MB threshold due to JVM heap default.',
        category: 'Technical Issue',
        priority: 'high',
        status: 'resolved',
        dept: 'Platform & Infrastructure',
        assignedIdx: 2,
        messages: [
          { senderType: 'user', msg: 'Java runtime arguments needed -Xmx128m flag.' },
          { senderType: 'admin', msg: 'Updated Judge0 compiler configuration for Java 21 to tune heap limits properly.' }
        ]
      },
      {
        num: 'TCK-2026-0023',
        subject: 'Request to update institution registered domain name from .org to .edu.in',
        desc: 'College rebranded from apextech.org to apex.edu.in and needs SSO callback URL updated.',
        category: 'Account Issue',
        priority: 'medium',
        status: 'resolved',
        dept: 'Technical Tier-2',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Domain ownership DNS TXT record configured.' },
          { senderType: 'admin', msg: 'Tenant domain and SAML SSO redirect endpoints updated.' }
        ]
      },
      {
        num: 'TCK-2026-0024',
        subject: 'Typo in problem statement description for Graph Traversal Lab #4',
        desc: 'Problem statement referred to directed graph but test cases expected undirected adjacency list.',
        category: 'Bug Report',
        priority: 'low',
        status: 'resolved',
        dept: 'Academic & Courses',
        assignedIdx: 3,
        messages: [
          { senderType: 'user', msg: 'Confused several students during lab.' },
          { senderType: 'admin', msg: 'Problem description revised and test cases clarified.' }
        ]
      },
      {
        num: 'TCK-2026-0025',
        subject: 'How to download invoice receipt for tax filing reimbursement',
        desc: 'Need official tax invoice with company GSTIN for expense claim.',
        category: 'General Query',
        priority: 'low',
        status: 'resolved',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Need receipt by end of week.' },
          { senderType: 'admin', msg: 'E-invoice with digital signature attached and also available in your Billing tab.' }
        ]
      },

      // 26-30: Closed Tickets (5)
      {
        num: 'TCK-2026-0026',
        subject: 'Dashboard showing incorrect progress counter after browser cache stale',
        desc: 'Progress stuck at 64% even after finishing chapter 7.',
        category: 'Bug Report',
        priority: 'low',
        status: 'closed',
        dept: 'Customer Success',
        assignedIdx: 4,
        messages: [
          { senderType: 'user', msg: 'Resolved after hard refresh (Ctrl+F5). Closing ticket.' },
          { senderType: 'admin', msg: 'Glad it resolved! Closing ticket.' }
        ]
      },
      {
        num: 'TCK-2026-0027',
        subject: 'Inquiry on whether C# 12 is supported in Online IDE',
        desc: 'Does the browser sandbox run .NET 8 / C# 12 features like primary constructors?',
        category: 'General Query',
        priority: 'low',
        status: 'closed',
        dept: 'Customer Success',
        assignedIdx: 4,
        messages: [
          { senderType: 'user', msg: 'Can I use collection expressions?' },
          { senderType: 'admin', msg: 'Yes, C# 12 is fully supported via our sandboxed execution router.' }
        ]
      },
      {
        num: 'TCK-2026-0028',
        subject: 'Spam test ticket created by intern during onboarding',
        desc: 'Please delete or close this dummy test submission.',
        category: 'General Query',
        priority: 'low',
        status: 'closed',
        dept: 'Customer Success',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Safe to close.' },
          { senderType: 'admin', msg: 'Closed.' }
        ]
      },
      {
        num: 'TCK-2026-0029',
        subject: 'Duplicate payment attempt cancelled by user',
        desc: 'Clicked Pay twice; second transaction aborted by gateway automatically.',
        category: 'Payment Issue',
        priority: 'medium',
        status: 'closed',
        dept: 'Billing & Subscriptions',
        assignedIdx: 1,
        messages: [
          { senderType: 'user', msg: 'Only single charge reflected on bank. No action needed.' },
          { senderType: 'admin', msg: 'Confirmed single payment. Ticket closed.' }
        ]
      },
      {
        num: 'TCK-2026-0030',
        subject: 'Feature request for Vim keybindings in online code editor',
        desc: 'Please add option for Vim / Emacs keymap in editor settings.',
        category: 'General Query',
        priority: 'low',
        status: 'closed',
        dept: 'Technical Tier-2',
        assignedIdx: 0,
        messages: [
          { senderType: 'user', msg: 'Logged for product team roadmap consideration.' },
          { senderType: 'admin', msg: 'Vim keybinding mode is now released in IDE Settings dialog! Closing ticket.' }
        ]
      }
    ];

    console.log('Seeding 30 realistic support tickets...');
    for (let i = 0; i < ticketDefinitions.length; i++) {
      const def = ticketDefinitions[i];
      const studentUser = studentUsers[i % studentUsers.length];
      const assignedAgentId = def.assignedIdx !== null ? agentIds[def.assignedIdx] : null;
      const tenantId = studentUser.tenant_id || defaultTenantId;

      const existingTicket = await client.query('SELECT id FROM support_tickets WHERE ticket_number = $1', [def.num]);
      let ticketId = existingTicket.rows[0]?.id;

      let resolvedAt = null;
      let closedAt = null;
      let firstResponseAt = null;

      if (def.status === 'resolved') {
        resolvedAt = "NOW() - INTERVAL '2 days'";
        firstResponseAt = "NOW() - INTERVAL '5 days'";
      } else if (def.status === 'closed') {
        resolvedAt = "NOW() - INTERVAL '4 days'";
        closedAt = "NOW() - INTERVAL '3 days'";
        firstResponseAt = "NOW() - INTERVAL '6 days'";
      } else if (def.status === 'in_progress') {
        firstResponseAt = "NOW() - INTERVAL '1 day'";
      }

      if (!ticketId) {
        const insTicket = await client.query(`
          INSERT INTO support_tickets (
            ticket_number, user_id, tenant_id, subject, description, category, priority,
            status, assigned_to, department, first_response_at, resolved_at, closed_at,
            last_activity_at, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            ${firstResponseAt || 'NULL'},
            ${resolvedAt || 'NULL'},
            ${closedAt || 'NULL'},
            NOW() - INTERVAL '${i * 3} hours',
            NOW() - INTERVAL '${(i + 1) * 6} hours',
            NOW()
          ) RETURNING id
        `, [
          def.num, studentUser.id, tenantId, def.subject, def.desc, def.category,
          def.priority, def.status, assignedAgentId, def.dept
        ]);
        ticketId = insTicket.rows[0].id;
      } else {
        await client.query(`
          UPDATE support_tickets
          SET subject = $1, description = $2, category = $3, priority = $4,
              status = $5, assigned_to = $6, department = $7, updated_at = NOW()
          WHERE id = $8
        `, [def.subject, def.desc, def.category, def.priority, def.status, assignedAgentId, def.dept, ticketId]);
      }

      // Seed conversation messages for this ticket
      for (let mIdx = 0; mIdx < def.messages.length; mIdx++) {
        const msg = def.messages[mIdx];
        const isNote = msg.senderType === 'note';
        const isAdmin = msg.senderType === 'admin';
        const senderId = (isAdmin || isNote) ? (assignedAgentId || agentIds[0]) : studentUser.id;
        const msgType = isNote ? 'INTERNAL_NOTE' : isAdmin ? 'ADMIN_REPLY' : 'USER_REPLY';

        const existingMsg = await client.query(`
          SELECT id FROM support_ticket_replies 
          WHERE ticket_id = $1 AND message = $2
        `, [ticketId, msg.msg]);

        if (existingMsg.rows.length === 0) {
          await client.query(`
            INSERT INTO support_ticket_replies (
              ticket_id, user_id, message, is_internal, message_type, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, NOW() - INTERVAL '${(def.messages.length - mIdx) * 2} hours', NOW()
            )
          `, [ticketId, senderId, msg.msg, isNote, msgType]);
        }
      }

      // Seed assignment history
      if (assignedAgentId) {
        const existingAssign = await client.query('SELECT id FROM support_assignment_history WHERE ticket_id = $1', [ticketId]);
        if (existingAssign.rows.length === 0) {
          await client.query(`
            INSERT INTO support_assignment_history (
              ticket_id, assigned_by, assigned_to, note, created_at
            ) VALUES (
              $1, $2, $3, 'Assigned based on category specialization and department queue.', NOW() - INTERVAL '4 hours'
            )
          `, [ticketId, agentIds[0], assignedAgentId]);
        }
      }

      // Seed ticket activity
      const existingActivity = await client.query('SELECT id FROM support_ticket_activity WHERE ticket_id = $1', [ticketId]);
      if (existingActivity.rows.length === 0) {
        await client.query(`
          INSERT INTO support_ticket_activity (
            ticket_id, actor_id, action, old_value, new_value, description, created_at
          ) VALUES 
            ($1, $2, 'created', NULL, 'open', 'Ticket created by user', NOW() - INTERVAL '${(i + 1) * 6} hours'),
            ($1, $3, 'status_changed', 'open', $4, 'Status updated during review', NOW() - INTERVAL '${i * 2} hours')
        `, [ticketId, studentUser.id, agentIds[0], def.status]);
      }
    }

    await client.query('COMMIT');
    console.log('Support Ticket Help Desk successfully seeded with 5 agents and 30 tickets!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedSupport()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}
