import { Router } from '../src/index'
import assert from 'assert'

describe('Router', () => {
  describe('constructor', () => {
    it('should not crash', () => {
      const router = new Router()
      assert.ok(router)
    })
  })
})
