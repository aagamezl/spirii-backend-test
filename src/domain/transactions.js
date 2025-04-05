export const createTransaction = ({ id, userId, type, amount, createdAt }) => ({
  id,
  userId,
  type,
  amount,
  createdAt: new Date(createdAt)
});

export const isTransactionInRange = (startDate, endDate) => transaction => {
  const date = transaction.createdAt;
  return (!startDate || date >= new Date(startDate)) &&
    (!endDate || date <= new Date(endDate));
};

export const transactionTypes = {
  EARN: 'earn',
  SPEND: 'spend',
  PAYOUT_REQUEST: 'payout_request',
  PAYOUT_COMPLETED: 'payout_completed'
};
