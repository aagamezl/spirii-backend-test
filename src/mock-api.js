import express from 'express';

export const createMockTransactionAPI = () => {
  const app = express();
  const transactions = [];

  // Generate mock data
  for (let i = 0; i < 1000; i++) {
    const types = ['earned', 'spent', 'payout'];
    const type = types[Math.floor(Math.random() * types.length)];

    transactions.push({
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      type,
      amount: type === 'earned'
        ? Math.floor(Math.random() * 100) + 1
        : Math.floor(Math.random() * 50) + 1
    });
  }

  app.get('/transactions', (req, res) => {
    const { startDate, endDate } = req.query;
    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return (!startDate || txDate >= new Date(startDate)) &&
        (!endDate || txDate <= new Date(endDate));
    }).slice(0, 1000); // Respect 1000 transaction limit

    res.json({
      items: filtered,
      meta: {
        totalItems: filtered.length,
        itemCount: filtered.length,
        itemsPerPage: filtered.length,
        totalPages: 1,
        currentPage: 1
      }
    });
  });

  return app;
};
