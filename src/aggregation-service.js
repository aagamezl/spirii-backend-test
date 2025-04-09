// src/aggregation-service.js
import axios from 'axios'

// Constants
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
const TRANSACTION_TYPES = {
  EARNED: 'earned',
  SPENT: 'spent',
  PAYOUT: 'payout'
}

// Default user aggregation structure
const createEmptyUserData = (userId) => ({
  userId,
  balance: 0,
  earned: 0,
  spent: 0,
  payout: 0
})

/**
 * Apply a transaction to the existing user data.
 * This pure function ensures easier testing and better separation of concerns.
 */
const applyTransaction = (userData, tx) => {
  const newUserData = { ...userData }

  switch (tx.type) {
    case TRANSACTION_TYPES.EARNED:
      newUserData.earned += tx.amount
      newUserData.balance += tx.amount
      break
    case TRANSACTION_TYPES.SPENT:
      newUserData.spent += tx.amount
      newUserData.balance -= tx.amount
      break
    case TRANSACTION_TYPES.PAYOUT:
      newUserData.payout += tx.amount
      newUserData.balance -= tx.amount
      break
    default:
      // Ignore unknown transaction types but could also throw/log if desired
      break
  }

  return newUserData
}

/**
 * Create the Aggregation Service
 * @param {function} transactionApiClient - A function that fetches transactions between two dates
 */
export const createAggregationService = (transactionApiClient = fetchTransactionsFromAPI) => {
  const userDataCache = new Map() // userId -> aggregation
  const payoutCache = new Map() // userId -> total payouts
  let lastUpdated = null

  /**
   * Fetch new transactions and update in-memory caches.
   * Skips if cache is considered fresh.
   */
  const updateCache = async () => {
    const now = new Date()

    if (lastUpdated && now - lastUpdated < CACHE_TTL_MS) {
      return // Cache is fresh
    }

    const startDate = lastUpdated || new Date(0)
    const endDate = now

    let response

    try {
      response = await transactionApiClient(startDate, endDate)
    } catch (err) {
      throw new Error(`Failed to fetch transactions: ${err.message}`)
    }

    const transactions = response.items || []

    for (const tx of transactions) {
      const { userId, amount, type } = tx

      if (!userId || typeof amount !== 'number' || !type) {
        continue
      } // Validate input

      const userData = userDataCache.get(userId) || createEmptyUserData(userId)

      userDataCache.set(userId, applyTransaction(userData, tx))

      if (type === TRANSACTION_TYPES.PAYOUT) {
        payoutCache.set(userId, (payoutCache.get(userId) || 0) + amount)
      }
    }

    lastUpdated = now
  }

  return {
    /**
     * Get aggregated data for a specific user
     */
    getUserAggregatedData: async (userId) => {
      if (!userId) throw new Error('User ID is required')

      await updateCache()

      return userDataCache.get(userId) || createEmptyUserData(userId)
    },

    /**
     * Get all aggregated payouts across users
     */
    getAggregatedPayouts: async () => {
      await updateCache()

      return Array.from(payoutCache.entries()).map(([userId, amount]) => ({
        userId,
        amount
      }))
    }
  }
}

/**
 * Default transaction API client using axios
 * This is separated to allow mocking in tests
 */
const fetchTransactionsFromAPI = async (startDate, endDate) => {
  const response = await axios.get('http://localhost:4000/transactions', {
    params: {
      startDate,
      endDate
    }
  })

  return response.data
}
