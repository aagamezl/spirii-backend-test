import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export const createServer = (aggregationService) => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Rate limiting
  app.use(rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 100 requests per windowMs
  }));

  // Proper route handlers as middleware functions
  app.get('/users/:userId/balance', async (req, res, next) => {
    try {
      const data = await aggregationService.getUserAggregatedData(req.params.userId);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get('/users/payouts', async (req, res, next) => {
    try {
      const payouts = await aggregationService.getAggregatedPayouts();
      res.json(payouts);
    } catch (error) {
      next(error);
    }
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    res.status(500).json({ error: error.message });
  });

  return app;
};
