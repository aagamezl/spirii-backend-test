import axios from "axios";

export const createAggregationService = (transactionApi) => {
  // In-memory cache
  const userDataCache = new Map();
  const payoutCache = new Map();
  let lastUpdated = null;

  // Process transactions and update cache
  const updateCache = async () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    if (lastUpdated && lastUpdated > twoMinutesAgo) {
      return; // Data is fresh enough
    }

    // Respect rate limits (5 requests per minute)
    const response = await axios.get('http://localhost:4000/transactions', {
      params: {
        startDate: lastUpdated || new Date(0),
        endDate: now
      }
    });

    // Process new transactions
    for (const tx of response.data.items) {
      // Update user aggregates
      const userData = userDataCache.get(tx.userId) || {
        userId: tx.userId,
        balance: 0,
        earned: 0,
        spent: 0,
        payout: 0,
        paidOut: 0
      };

      switch (tx.type) {
        case 'earned':
          userData.earned += tx.amount;
          userData.balance += tx.amount;
          break;
        case 'spent':
          userData.spent += tx.amount;
          userData.balance -= tx.amount;
          break;
        case 'payout':
          userData.payout += tx.amount;
          userData.balance -= tx.amount;
          // Update payout cache
          payoutCache.set(tx.userId, (payoutCache.get(tx.userId) || 0) + tx.amount);
          break;
      }

      userDataCache.set(tx.userId, userData);
    }

    lastUpdated = now;
  };

  return {
    getUserAggregatedData: async (userId) => {
      await updateCache();
      return userDataCache.get(userId) || {
        userId,
        balance: 0,
        earned: 0,
        spent: 0,
        payout: 0,
        paidOut: 0
      };
    },
    getAggregatedPayouts: async () => {
      await updateCache();
      return Array.from(payoutCache.entries()).map(([userId, amount]) => ({
        userId,
        amount
      }));
    }
  };
};
