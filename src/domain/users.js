export const createUserBalance = (userId) => ({
  userId,
  balance: 0,
  earned: 0,
  spent: 0,
  payout: 0,
  paidOut: 0
});

export const updateBalance = (userBalance, transaction) => {
  const updated = { ...userBalance };

  switch (transaction.type) {
    case 'earn':
      updated.earned += transaction.amount;
      updated.balance += transaction.amount;
      break;
    case 'spend':
      updated.spent += transaction.amount;
      updated.balance -= transaction.amount;
      break;
    case 'payout_request':
      updated.payout += transaction.amount;
      updated.balance -= transaction.amount;
      break;
    case 'payout_completed':
      updated.paidOut += transaction.amount;
      break;
  }

  return updated;
};
