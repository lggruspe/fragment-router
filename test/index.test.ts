import { Request, Router, check, hasPrefix } from '../src/index'
import { wait, compare, mockDom } from './utils'
import * as assert from 'assert'

describe('Router', () => {
  describe('constructor', () => {
    it('should initially have no routes', () => {
      assert.strictEqual(new Router().routes.length, 0)
    })

    it('should initially have no subrouters', () => {
      assert.strictEqual(new Router().subrouters.length, 0)
    })
  })

  describe('route', () => {
    it('should insert inputs into Router.routes', () => {
      const f = () => {}
      const g = () => {}
      const router = new Router()
      router.route(f, g)
      router.route(f, g)
      assert.deepStrictEqual(router.routes, [[f, g], [f, g]])
    })

    it('should be chainable', () => {
      const f = () => {}
      const g = () => {}
      const router = new Router()
        .route(f, g)
        .route(g, f)
      assert.deepStrictEqual(router.routes, [[f, g], [g, f]])
    })

    describe('with no input', () => {
      it('should not push anything to Router.routes', () => {
        const router = new Router()
        router.route()
        assert.deepStrictEqual(router.routes, [])
      })
    })
  })

  describe('mount', () => {
    it('should push prefix and subrouter into Router.subrouters', () => {
      const subrouter = new Router()
      const router = new Router()
      router.mount('sub', subrouter)
      assert.deepStrictEqual(router.subrouters, [['sub', subrouter]])
    })

    describe('with subrouter = this', () => {
      it('should not be added into Router.subrouters', async () => {
        const router = new Router()
        router.mount('', router)
        router.mount('sub', router)
        assert.deepStrictEqual(router.subrouters, [])
      })
    })
  })

  describe('currentRequest', () => {
    beforeEach(mockDom)

    it('should be null between routes', async () => {
      const router = new Router()
      router.route(() => {}).listen()
      window.location.hash = '#'
      await wait()
      assert.strictEqual(router.currentRequest(), null)
    })

    describe('no exception', () => {
      describe('while handling requests', () => {
        it('should return request object passed to filters', async () => {
          const router = new Router()
          router.route(
            req => {
              assert.deepStrictEqual(router.currentRequest(), req)
              assert.deepStrictEqual(router.currentRequest()!.id, 'foo')
            },
            req => {
              assert.deepStrictEqual(router.currentRequest(), req)
              assert.deepStrictEqual(router.currentRequest()!.id, 'foo')
            }
          )
          router.listen()
          window.location.hash = '#foo'
          await wait()
        })
      })

      describe('while not handling requests', () => {
        it('should return null', () => {
          const router = new Router()
          assert.strictEqual(router.currentRequest(), null)
        })
      })
    })

    describe('with exception', () => {
      describe('while handling requests', () => {
        it('should return request object passed to filters', async () => {
          const router = new Router()
          const exception = new Error('test')
          router.route(
            req => {
              assert.deepStrictEqual(router.currentRequest(exception), req)
              assert.deepStrictEqual(router.currentRequest(exception)!.id, 'foo')
            },
            req => {
              assert.deepStrictEqual(router.currentRequest(exception), req)
              assert.deepStrictEqual(router.currentRequest(exception)!.id, 'foo')
            }
          )
          router.listen()
          window.location.hash = '#foo'
          await wait()
        })
      })

      describe('while not handling requests', () => {
        it('should throw an exception', () => {
          const router = new Router()
          const exception = new Error('test')
          assert.throws(
            () => router.currentRequest(exception),
            Error
          )
        })
      })
    })
  })

  describe('listen', () => {
    beforeEach(mockDom)

    it('should use a single req object for all filters in the same route', async () => {
      const data: Array<any> = []
      new Router()
        .route(
          req => data.push(req),
          req => data.push(req)
        )
        .listen()
      window.location.hash = '#'
      await wait()
      assert.strictEqual(data.length, 2)
      assert.deepStrictEqual(data[0], data[1])
    })

    it('should create a new req object for each route', async () => {
      const filter = (req: Request) => {
        data.push(req)
        throw req.control.next
      }

      const data: Array<any> = []
      new Router().route(filter).route(filter).listen()
      window.location.hash = '#'

      await wait()
      assert.strictEqual(data.length, 2)
      assert.notEqual(data[0], data[1])
    })

    describe('when filter does not throw', () => {
      it('should not run other filters', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            () => data.push(0),
            () => data.push(1)
          )
          .route(
            () => data.push(2)
          )
          .listen()
        window.location.hash = '#'
        await compare(data, [0, 1])
      })
    })

    describe('when req.control.next is thrown', () => {
      it('should skip to the next route', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            req => {
              data.push(0)
              throw req.control.next
            },
            () => data.push(1)
          )
          .route(
            () => data.push(2),
            () => data.push(3)
          )
          .listen()
        window.location.hash = '#'
        await compare(data, [0, 2, 3])
      })
    })

    describe('when req.control.abort is thrown', () => {
      it('should skip all remaining filters and routes', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            () => data.push(0),
            req => {
              data.push(1)
              throw req.control.abort
            },
            () => data.push(2)
          )
          .route(
            () => data.push(3),
            () => data.push(4)
          )
          .listen()
        window.location.hash = '#'
        await compare(data, [0, 1])
      })
    })

    describe('with prefix', () => {
      it('should not handle requests if hash does not match the prefix', async () => {
        const data: Array<string> = []
        new Router()
          .route(req => {
            data.push('foo')
            throw req.control.abort
          })
          .listen(check(hasPrefix('foo/')))
        new Router()
          .route(req => {
            data.push('bar')
            throw req.control.abort
          })
          .listen(check(hasPrefix('bar/')))

        window.location.hash = '#foo'
        window.location.hash = '#bar'
        await compare(data, [])

        window.location.hash = '#foo/'
        await compare(data, ['foo'])
        window.location.hash = '#foo/bar/'
        await compare(data, ['foo', 'foo'])

        window.location.hash = '#bar/'
        await compare(data, ['foo', 'foo', 'bar'])
        window.location.hash = '#bar/foo/'
        await compare(data, ['foo', 'foo', 'bar', 'bar'])
      })
    })

    describe('with subrouters', () => {
      describe('with subrouter = self', () => {
        it('should not get stuck in a loop/cause stack overflow', async () => {
          const router = new Router()
          router.mount('', router)
          router.listen()

          window.location.hash = '#'
          await wait()
          assert.ok(true)
        })
      })

      it('should run all handlers with the appropriate prefix', async () => {
        const data: Array<string> = []
        const baz = new Router().route(() => data.push('baz'))
        const bar = new Router().route(() => data.push('bar'))
        const foo = new Router().route(() => data.push('foo'))

        bar.mount('baz/', baz)
        foo.mount('bar/', bar)
        foo.listen(check(hasPrefix('foo/')))

        window.location.hash = '#baz/'
        await compare(data, [])
        window.location.hash = '#bar/'
        await compare(data, [])
        window.location.hash = '#foo/'
        await compare(data, ['foo'])

        window.location.hash = '#foo/bar/'
        await compare(data, ['foo', 'foo', 'bar'])
        window.location.hash = '#foo/bar/baz'
        await compare(data, ['foo', 'foo', 'bar', 'foo', 'bar'])
        window.location.hash = '#foo/bar/baz/'
        await compare(data, ['foo', 'foo', 'bar', 'foo', 'bar', 'foo', 'bar', 'baz'])
      })
    })
  })
})
