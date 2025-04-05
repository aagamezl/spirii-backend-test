import express from 'express'
import { createAggregationService } from './aggregation-service.js'
import { createMockTransactionAPI } from './mock-api.js'

async function start() {
  // Create services
  const mockApi = createMockTransactionAPI();
  const aggregationService = createAggregationService(mockApi);

  // Create Express app
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  app.get('/users/:userId/balance', async (req, res) => {
    try {
      const data = await aggregationService.getUserAggregatedData(req.params.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/users/payouts', async (req, res) => {
    try {
      const payouts = await aggregationService.getAggregatedPayouts();
      res.json(payouts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start mock API
  mockApi.listen(4000, () => {
    console.log('Mock Transaction API running on port 4000');
  });

  // Start main service
  app.listen(3000, () => {
    console.log('Aggregation Service running on port 3000');
    console.log('Try these endpoints:');
    console.log('GET http://localhost:3000/users/074092/balance');
    console.log('GET http://localhost:3000/users/payouts');
  });
}

start().catch(console.error);
