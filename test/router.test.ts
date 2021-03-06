import { check, Router, hasPrefix } from '../src/index'
import { compare, mockDom, wait } from './utils'
import * as assert from 'assert'

describe('Router', () => {
  beforeEach(mockDom)

  describe('with exit handlers', () => {
    describe('if subrouters have exit handlers', () => {
      it('all exit handlers should be run on the next request even if fragment prefix does not match', async () => {
        const data: string[] = []
        const fooRouter = new Router()
        const barRouter = new Router()
        const bazRouter = new Router()
        fooRouter.mount('bar', barRouter)
        fooRouter.mount('baz', bazRouter)
        barRouter.onExit(() => data.push('bar'))
        bazRouter.onExit(() => data.push('baz'))
        fooRouter.listen()

        window.location.hash = '#baz'
        await compare(data, ['bar', 'baz'])
      })
    })

    it('should run exit handlers on next request (even if the request does not match)', async () => {
      const data: string[] = []
      const router = new Router()
      router.route(() => {
        router.defer(() => data.push('foo'))
        router.onExit(() => {
          while (data.length) data.pop()
        })
      })
      router.listen(check(hasPrefix('foo/')))

      window.location.hash = '#foo'
      await compare(data, [])

      window.location.hash = '#foo/'
      await compare(data, ['foo'])

      window.location.hash = '#'
      await compare(data, [])
    })

    it('should clear exit handlers after running them', async () => {
      const data: string[] = []
      const router = new Router()
      router.route(
        check(hasPrefix('foo')),
        () => router.onExit(() => data.push('foo'))
      )
      router.route(
        check(hasPrefix('bar')),
        () => router.onExit(() => data.push('bar'))
      )
      router.listen()

      await compare(data, [])

      window.location.hash = '#foo'
      await compare(data, [])

      window.location.hash = '#bar'
      await compare(data, ['foo'])

      window.location.hash = '#'
      await compare(data, ['foo', 'bar'])

      window.location.hash = '#bar'
      await compare(data, ['foo', 'bar'])
    })
  })

  describe('when entire route finishes without breaking', () => {
    it('should not run other routes', async () => {
      const data: string[] = []
      new Router()
        .route(() => data.push('yes'))
        .route(() => data.push('no'))
        .listen()

      await compare(data, ['yes']) // initial page load
      window.location.hash = '#'
      await wait()
      assert.deepStrictEqual(data, ['yes', 'yes'])
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
    describe('with deferred filters', () => {
      it('should run deferred filters after regular filters', async () => {
        const data: string[] = []
        const router = new Router()
        router.route(
          () => {
            router.defer(() => data.push('bar'))
          },
          () => data.push('foo')
        )
        router.listen()
        await compare(data, ['foo', 'bar']) // initial page load
        window.location.hash = '#'
        await compare(data, ['foo', 'bar', 'foo', 'bar'])
      })

      describe('if a filter throws', () => {
        it('should convert the exception into req.control.abort (even req.control.next)', async () => {
          const data: string[] = []
          const router = new Router()
          router.route(
            req => router.defer(() => {
              throw req.control.next
            })
          )
          router.route(() => data.push('foo'))
          router.listen()
          window.location.hash = '#'
          await compare(data, [])
        })
      })
    })

    describe('with listen filters', () => {
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

    it('should run when page loads', async () => {
      const data: string[] = []
      const router = new Router()
      router.route(() => {
        data.push('foo')
      })
      router.listen()

      await compare(data, ['foo'])
    })

    it('should run when "fragment-router" event gets dispatched', async () => {
      let counter = 0

      const router = new Router()
      router.route(() => counter++)
      router.listen()

      await wait()
      assert.strictEqual(counter, 1)

      window.dispatchEvent(new window.CustomEvent('fragment-router', {}))
      await wait()
      assert.strictEqual(counter, 2)
    })
  })
})
