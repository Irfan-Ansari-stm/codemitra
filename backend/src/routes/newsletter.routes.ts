import { Router } from 'express';
import { validate } from '../middleware/validate';
import { newsletterSubscribeSchema } from '../validators';
import { newsletterRateLimiter } from '../middleware/rateLimit';
import * as newsletterService from '../services/newsletter.service';

export const newsletterRouter = Router();

// POST /api/v1/newsletter/subscribe
newsletterRouter.post(
  '/subscribe',
  newsletterRateLimiter,
  validate(newsletterSubscribeSchema),
  async (req, res, next) => {
    try {
      const subscriber = await newsletterService.subscribe({
        email: req.body.email,
        name: req.body.name,
      });
      res.status(201).json({ success: true, data: subscriber });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/newsletter/unsubscribe
newsletterRouter.post(
  '/unsubscribe',
  newsletterRateLimiter,
  validate(newsletterSubscribeSchema),
  async (req, res, next) => {
    try {
      const subscriber = await newsletterService.unsubscribe(req.body.email);
      if (!subscriber) {
        res.json({ success: true, data: { message: 'Not subscribed' } });
        return;
      }
      res.json({ success: true, data: subscriber });
    } catch (err) {
      next(err);
    }
  }
);
