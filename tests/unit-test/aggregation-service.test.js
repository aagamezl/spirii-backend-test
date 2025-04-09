import {
  beforeEach,
  describe,
  expect,
  jest,
  test
} from '@jest/globals'

import { createAggregationService } from '../../src/aggregation-service.js'

describe('Aggregation Service Integration', () => {
  let mockTransactionAPI
  let aggregationService

  beforeEach(() => {
    // Reset mock data before each test
    mockTransactionAPI = jest.fn()
    aggregationService = createAggregationService(mockTransactionAPI)
  })

  test('aggregates earned and spent transactions correctly', async () => {
    mockTransactionAPI.mockResolvedValue({
      items: [
        { userId: 'user1', type: 'earned', amount: 100 },
        { userId: 'user1', type: 'spent', amount: 30 }
      ]
    })

    const data = await aggregationService.getUserAggregatedData('user1')

    expect(data).toEqual({
      userId: 'user1',
      earned: 100,
      spent: 30,
      payout: 0,
      balance: 70
    })
  })

  test('aggregates payouts correctly and updates payout cache', async () => {
    mockTransactionAPI.mockResolvedValue({
      items: [
        { userId: 'user2', type: 'payout', amount: 50 }
      ]
    })

    const data = await aggregationService.getUserAggregatedData('user2')
    expect(data.payout).toBe(50)
    expect(data.balance).toBe(-50)

    const payouts = await aggregationService.getAggregatedPayouts()
    expect(payouts).toEqual([{ userId: 'user2', amount: 50 }])
  })

  test('ignores invalid transactions safely', async () => {
    mockTransactionAPI.mockResolvedValue({
      items: [
        { userId: 'user3', type: 'earned', amount: 100 },
        { userId: null, type: 'earned', amount: 100 }, // invalid
        { userId: 'user3', type: 'unknown', amount: 999 }, // unknown type
        { userId: 'user3', type: 'spent', amount: 'not-a-number' } // invalid amount
      ]
    })

    const data = await aggregationService.getUserAggregatedData('user3')
    expect(data).toEqual({
      userId: 'user3',
      earned: 100,
      spent: 0,
      payout: 0,
      balance: 100
    })
  })

  test('returns empty data for unknown user', async () => {
    mockTransactionAPI.mockResolvedValue({ items: [] })

    const data = await aggregationService.getUserAggregatedData('nonexistent-user')
    expect(data).toEqual({
      userId: 'nonexistent-user',
      earned: 0,
      spent: 0,
      payout: 0,
      balance: 0
    })
  })

  test('respects cache and does not call API again within TTL', async () => {
    const transactions = [
      { userId: 'user4', type: 'earned', amount: 200 }
    ]

    mockTransactionAPI.mockResolvedValue({ items: transactions })

    const first = await aggregationService.getUserAggregatedData('user4')
    expect(first.earned).toBe(200)
    expect(mockTransactionAPI).toHaveBeenCalledTimes(1)

    // Call again — should return cached result
    const second = await aggregationService.getUserAggregatedData('user4')
    expect(second.earned).toBe(200)
    expect(mockTransactionAPI).toHaveBeenCalledTimes(1) // Not called again
  })
})
