import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../db';
import { supportService } from './support.service';

after(async () => {
  await pool.end();
});

test('Super Admin Support Ticket Help Desk Suite', async (t) => {
  let adminUserId: string;
  let testTicketId: string;
  let testAgentId: string;

  const adminRes = await pool.query("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
  adminUserId = adminRes.rows[0]?.id || '00000000-0000-0000-0000-000000000001';

  const agentRes = await pool.query("SELECT id FROM users WHERE email LIKE '%@codeverse.dev' LIMIT 1");
  testAgentId = agentRes.rows[0]?.id || adminUserId;

  await t.test('1. Support statistics returns calculated live counts', async () => {
    const stats = await supportService.getStatistics();
    assert.ok(stats);
    assert.strictEqual(typeof stats.totalTickets, 'number');
    assert.strictEqual(typeof stats.openTickets, 'number');
    assert.strictEqual(typeof stats.inProgressTickets, 'number');
    assert.strictEqual(typeof stats.resolvedTickets, 'number');
    assert.strictEqual(typeof stats.closedTickets, 'number');
    assert.ok(stats.totalTickets >= 30);
    assert.strictEqual(typeof stats.averageFirstResponseTime, 'string');
    assert.strictEqual(typeof stats.averageResolutionTime, 'string');
  });

  await t.test('2. List tickets supports pagination, search, and status filters', async () => {
    // List all
    const all = await supportService.listTickets({ page: 1, limit: 10 });
    assert.strictEqual(all.items.length, 10);
    assert.ok(all.total >= 30);

    // Filter by status 'open'
    const openList = await supportService.listTickets({ status: 'open', page: 1, limit: 10 });
    assert.ok(openList.items.length >= 10);
    assert.ok(openList.items.every((t: any) => t.status === 'open'));

    // Filter by priority 'urgent'
    const urgentList = await supportService.listTickets({ priority: 'urgent' });
    assert.ok(urgentList.items.length >= 5);
    assert.ok(urgentList.items.every((t: any) => t.priority === 'urgent'));

    // Search by subject keyword
    const searchRes = await supportService.listTickets({ search: 'dashboard' });
    assert.ok(searchRes.items.length > 0);
  });

  await t.test('3. Create ticket manually by Super Admin', async () => {
    const studentUser = await pool.query("SELECT id FROM users WHERE role IN ('institution_student', 'general_student') LIMIT 1");
    const studentId = studentUser.rows[0]?.id || adminUserId;

    const newTicket = await supportService.createTicket({
      userId: studentId,
      subject: 'Automated Test Ticket - Platform Connectivity',
      description: 'System connectivity latency spike detected during automated test run.',
      category: 'Technical Issue',
      priority: 'high',
      department: 'Platform & Infrastructure',
      assignedTo: testAgentId,
    }, adminUserId);

    assert.ok(newTicket);
    assert.ok(newTicket.id);
    assert.ok(newTicket.ticket_number.startsWith('TCK-2026-'));
    assert.strictEqual(newTicket.subject, 'Automated Test Ticket - Platform Connectivity');
    testTicketId = newTicket.id;

    // Verify detail retrieval
    const details = await supportService.getTicketById(testTicketId);
    assert.strictEqual(details.id, testTicketId);
    assert.strictEqual(details.messages.length, 1);
    assert.strictEqual(details.assignmentHistory.length, 1);
    assert.ok(details.activities.length >= 1);
  });

  await t.test('4. Reply to ticket and add internal note', async () => {
    // Post public admin reply
    const reply = await supportService.replyToTicket(
      testTicketId,
      adminUserId,
      'Our SRE team has resolved the upstream gateway latency.',
      false
    );
    assert.ok(reply);
    assert.strictEqual(reply.message_type, 'ADMIN_REPLY');
    assert.strictEqual(reply.is_internal, false);

    // Verify ticket transitioned from open to in_progress
    const afterReply = await supportService.getTicketById(testTicketId);
    assert.strictEqual(afterReply.status, 'in_progress');
    assert.ok(afterReply.first_response_at !== null);

    // Post internal note
    const note = await supportService.replyToTicket(
      testTicketId,
      adminUserId,
      'Internal note: Database connection pool was saturated by batch job.',
      true
    );
    assert.ok(note);
    assert.strictEqual(note.message_type, 'INTERNAL_NOTE');
    assert.strictEqual(note.is_internal, true);

    const messages = await supportService.getTicketMessages(testTicketId);
    assert.strictEqual(messages.length, 3);
  });

  await t.test('5. Agent listing and ticket reassignment', async () => {
    const agents = await supportService.getSupportAgents();
    assert.ok(agents.length >= 5);
    const targetAgent = agents[0];

    const assignRes = await supportService.assignTicket(
      testTicketId,
      targetAgent.id,
      adminUserId,
      'Reassigned to primary agent for final verification.'
    );
    assert.strictEqual(assignRes.success, true);

    const updated = await supportService.getTicketById(testTicketId);
    assert.strictEqual(updated.assigned_to_id, targetAgent.id);
    assert.ok(updated.assignmentHistory.length >= 2);
  });

  await t.test('6. Status, priority, escalation, and reopening workflow', async () => {
    // Change priority
    const prioRes = await supportService.updatePriority(testTicketId, 'low', adminUserId);
    assert.strictEqual(prioRes.priority, 'low');

    // Escalate to urgent
    const escRes = await supportService.escalateTicket(testTicketId, adminUserId);
    assert.strictEqual(escRes.success, true);
    const afterEsc = await supportService.getTicketById(testTicketId);
    assert.strictEqual(afterEsc.priority, 'urgent');

    // Resolve ticket
    const resRes = await supportService.updateStatus(testTicketId, 'resolved', adminUserId);
    assert.strictEqual(resRes.status, 'resolved');
    assert.ok(resRes.resolved_at !== null);

    // Reopen ticket
    const reopenRes = await supportService.reopenTicket(testTicketId, adminUserId, 'Customer reported recurring issue.');
    assert.strictEqual(reopenRes.success, true);
    const afterReopen = await supportService.getTicketById(testTicketId);
    assert.strictEqual(afterReopen.status, 'open');
    assert.strictEqual(afterReopen.resolved_at, null);
  });

  await t.test('7. CSV Export and soft delete cleanup', async () => {
    const csv = await supportService.exportTicketsCSV({ limit: 10 });
    assert.ok(typeof csv === 'string');
    assert.ok(csv.includes('Ticket Number,Subject,Category,Priority,Status'));

    const delRes = await supportService.deleteTicket(testTicketId, adminUserId);
    assert.strictEqual(delRes.success, true);

    // Should no longer be returned by getTicketById
    await assert.rejects(
      async () => supportService.getTicketById(testTicketId),
      /Support ticket not found/
    );

    // Cleanup permanent
    await pool.query('DELETE FROM support_ticket_activity WHERE ticket_id = $1', [testTicketId]);
    await pool.query('DELETE FROM support_assignment_history WHERE ticket_id = $1', [testTicketId]);
    await pool.query('DELETE FROM support_ticket_replies WHERE ticket_id = $1', [testTicketId]);
    await pool.query('DELETE FROM support_tickets WHERE id = $1', [testTicketId]);
  });
});
