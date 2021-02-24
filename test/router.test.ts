import { Router } from '../src/index'
import { mockDom, wait } from './utils'
import * as assert from 'assert'

describe('Router', () => {
  beforeEach(mockDom)

  describe('when entire route finishes without breaking', () => {
    it('should not run other routes', async () => {
      const data: string[] = []
      new Router()
        .route(() => data.push('yes'))
        .route(() => data.push('no'))
        .listen()

      window.location.hash = '#'
      await wait()
      assert.deepStrictEqual(data, ['yes'])
    })
  })

  describe('when invalid exception is thrown (i.e. not in req.control)', () => {
    it('should ignore the exception', async () => {
      new Router()
        .route(() => { throw new Error() })
        .listen()

      window.location.hash = '#'
      await wait()
      assert.ok(true)
    })
  })
})
