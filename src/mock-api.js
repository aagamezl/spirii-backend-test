import { randomUUID } from 'node:crypto'

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

export const createMockTransactionAPI = () => {
  const app = express()

  // Security middleware
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  // Rate limiting
  app.use(rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  }))

  const transactions = []

  // Generate mock data
  for (let i = 0; i < 10000; i++) {
    const types = ['earned', 'spent', 'payout']
    const type = types[Math.floor(Math.random() * types.length)]

    transactions.push({
      id: randomUUID(),
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
      type,
      amount: type === 'earned'
        ? Math.floor(Math.random() * 100) + 1
        : Math.floor(Math.random() * 50) + 1
    })
  }

  app.get('/transactions', (req, res) => {
    const { startDate, endDate, page = 1, limit = 100 } = req.query
    const start = startDate ? new Date(startDate) : new Date(0)
    const end = endDate ? new Date(endDate) : new Date()

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)

    // Filter by date
    const filtered = transactions.filter(tx => {
      const timestamp = new Date(tx.timestamp)

      return timestamp >= start && timestamp <= end
    })

    // Pagination logic
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / limitNumber)
    const offset = (pageNumber - 1) * limitNumber
    const items = filtered.slice(offset, offset + limitNumber)

    res.json({
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limitNumber,
        totalPages,
        currentPage: pageNumber
      }
    })
  })

  return app
}
