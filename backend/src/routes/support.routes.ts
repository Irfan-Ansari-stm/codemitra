import { Router, Request, Response, NextFunction } from 'express';
import { isSuperAdmin } from '../middleware/rbac';
import { supportService } from '../services/support.service';

const router = Router();

// Protect all support routes with isSuperAdmin
router.use(isSuperAdmin);

// =============================================================================
// STATISTICS
// =============================================================================
router.get('/statistics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await supportService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// AGENTS
// =============================================================================
router.get('/agents', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await supportService.getSupportAgents();
    res.json({ success: true, data: agents });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// EXPORT CSV
// =============================================================================
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const csvData = await supportService.exportTicketsCSV(req.query as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=support-tickets.csv');
    res.send(csvData);
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// TICKET CRUD & LISTING
// =============================================================================
router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await supportService.listTickets(req.query as any);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const ticket = await supportService.createTicket(req.body, actorId);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await supportService.getTicketById(req.params.id);
    res.json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const updated = await supportService.updateTicket(req.params.id, req.body, actorId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const result = await supportService.deleteTicket(req.params.id, actorId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// CONVERSATIONS & INTERNAL NOTES
// =============================================================================
router.get('/tickets/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await supportService.getTicketMessages(req.params.id);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { message, attachments } = req.body;
    const reply = await supportService.replyToTicket(req.params.id, actorId, message, false, attachments);
    res.json({ success: true, data: reply });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets/:id/internal-notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { note, message, attachments } = req.body;
    const content = note || message;
    const reply = await supportService.replyToTicket(req.params.id, actorId, content, true, attachments);
    res.json({ success: true, data: reply });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// ASSIGNMENT & MODERATION
// =============================================================================
router.post('/tickets/:id/assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { assignedTo, note } = req.body;
    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'assignedTo agent ID is required' });
    }
    const result = await supportService.assignTicket(req.params.id, assignedTo, actorId, note);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:id/assignment-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await supportService.getTicketById(req.params.id);
    res.json({ success: true, data: ticket.assignmentHistory || [] });
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const updated = await supportService.updateStatus(req.params.id, status, actorId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id/priority', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { priority } = req.body;
    if (!priority) {
      return res.status(400).json({ success: false, message: 'Priority is required' });
    }
    const updated = await supportService.updatePriority(req.params.id, priority, actorId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets/:id/escalate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const result = await supportService.escalateTicket(req.params.id, actorId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/tickets/:id/reopen', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const { reason } = req.body;
    const result = await supportService.reopenTicket(req.params.id, actorId, reason);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/tickets/:id/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await supportService.getTicketActivity(req.params.id);
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

export const supportRouter = router;
