import { Router, hasPrefix } from '../src/index'
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

  describe('listen', () => {
    describe('with filters', () => {
      describe('if a filter throws', () => {
        it('should abort all routes', async () => {
          const data: string[] = []
          const router = new Router()
          router.route(() => data.push('bar'))
          router.route(() => data.push('baz'))
          router.listen(req => {
            if (!hasPrefix('foo/')(req)) {
              throw new Error()
            }
          })

          window.location.hash = '#'
          await wait()
          assert.deepStrictEqual(data, [])
          window.location.hash = '#bar'
          await wait()
          assert.deepStrictEqual(data, [])
          window.location.hash = '#baz'
          await wait()
          assert.deepStrictEqual(data, [])

          window.location.hash = '#foo/'
          await wait()
          assert.deepStrictEqual(data, ['bar'])
        })
      })
    })
  })
})
