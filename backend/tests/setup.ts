import { beforeAll, afterAll } from 'vitest'

beforeAll(async () => {
  // Setup test database, mock external services, etc.
  console.log('Setting up test environment...')
})

afterAll(async () => {
  // Cleanup test database, close connections, etc.
  console.log('Cleaning up test environment...')
})

