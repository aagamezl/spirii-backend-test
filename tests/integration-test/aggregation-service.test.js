import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test
} from '@jest/globals'

import request from 'supertest'
import express from 'express'
import { createAggregationService } from '../../src/aggregation-service.js'
import { createMockTransactionAPI } from '../../src/mock-api.js'

let app
let mockApiServer

beforeAll(done => {
  // Start the mock transaction API
  const mockApi = createMockTransactionAPI()
  mockApiServer = mockApi.listen(4000, () => {
    console.log('Mock Transaction API running on port 4000')
    done()
  })
})

beforeAll(async () => {
  const aggregationService = createAggregationService()

  app = express()
  app.use(express.json())

  app.get('/users/:userId/balance', async (req, res) => {
    try {
      const data = await aggregationService.getUserAggregatedData(req.params.userId)
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get('/users/payouts', async (req, res) => {
    try {
      const data = await aggregationService.getAggregatedPayouts()
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
})

afterAll(done => {
  mockApiServer.close(() => {
    console.log('Mock API server closed')
    done()
  })
})

describe('Aggregation Service - Integration Tests', () => {
  test('GET /users/:userId/balance should return user aggregate', async () => {
    const res = await request(app).get('/users/user1/balance')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        userId: 'user1',
        balance: expect.any(Number),
        earned: expect.any(Number),
        spent: expect.any(Number),
        payout: expect.any(Number)
      })
    )
  })

  test('GET /users/payouts should return payout list', async () => {
    const res = await request(app).get('/users/payouts')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    if (res.body.length > 0) {
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          userId: expect.any(String),
          amount: expect.any(Number)
        })
      )
    }
  })

  test('GET /users/nonexistent-user/balance should return default empty data', async () => {
    const res = await request(app).get('/users/nonexistent-user/balance')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      userId: 'nonexistent-user',
      balance: 0,
      earned: 0,
      spent: 0,
      payout: 0
    })
  })
})
