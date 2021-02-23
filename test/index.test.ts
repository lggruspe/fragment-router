import { Request, currentRequest, Router, equals, guard, isHome, isNotNull, matches, withPrefix } from '../src/index'
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
      const data: Array<any> = []
      new Router()
        .route(req => data.push(req))
        .route(req => data.push(req))
        .listen()
      window.location.hash = '#'

      await wait()
      assert.strictEqual(data.length, 2)
      assert.notEqual(data[0], data[1])
    })

    it('should clear req.control between routes', async () => {
      const data: Array<any> = []
      new Router()
        .route(
          () => data.push(0),
          req => {
            req.control = 'next'
            data.push(1)
          },
          () => data.push('error')
        )
        .route(
          req => {
            assert.ok(!req.control)
            data.push(2)
          }
        )
        .listen()
      window.location.hash = '#'

      await wait()
      assert.deepStrictEqual(data, [0, 1, 2])
    })

    describe('when req.control does not get modified', () => {
      it('should run every filter', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            () => data.push(0),
            () => data.push(1)
          )
          .route(
            () => data.push(2),
            () => data.push(3)
          )
          .listen()
        window.location.hash = '#'
        await compare(data, [0, 1, 2, 3])
      })
    })

    describe('when req.control is set to "next"', () => {
      it('should skip to the next route', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            req => {
              req.control = 'next'
              data.push(0)
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

    describe('when req.control is set to "abort"', () => {
      it('should skip all remaining filters and routes', async () => {
        const data: Array<number> = []
        new Router()
          .route(
            () => data.push(0),
            req => {
              req.control = 'abort'
              data.push(1)
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
            req.control = 'abort'
          })
          .listen('foo/')
        new Router()
          .route(req => {
            data.push('bar')
            req.control = 'abort'
          })
          .listen('bar/')

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
        foo.listen('foo/')

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

describe('utils', () => {
  beforeEach(mockDom)

  describe('isHome', () => {
    it('should skip to the next route if hash is non-empty', async () => {
      const data: Array<string> = []
      new Router()
        .route(guard(isHome), req => {
          data.push('foo')
          req.control = 'abort'
        })
        .route(() => {
          data.push('bar')
        })
        .listen()

      window.location.hash = '#'
      await compare(data, ['foo'])

      window.location.hash = '#foo'
      await compare(data, ['foo', 'bar'])

      window.location.hash = '#bar'
      await compare(data, ['foo', 'bar', 'bar'])

      window.location.hash = '#baz'
      await compare(data, ['foo', 'bar', 'bar', 'bar'])
    })
  })

  describe('isNotNull', () => {
    describe('with existing fragment', () => {
      it('should run remaining filters', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(isNotNull))
          .route(() => data.push('foo'))
          .listen()

        window.location.hash = '#foo'
        await compare(data, ['foo'])
      })
    })

    describe('with non-existent fragment', () => {
      it('should skip remaining filters in route but run filters in other routes', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(isNotNull), () => data.push('foo'))
          .route(() => data.push('bar'))
          .listen()

        window.location.hash = '#non-existent-fragment'
        await compare(data, ['bar'])
      })
    })
  })

  describe('equals', () => {
    describe('if fragment ID equals input string', () => {
      it('should run remaining filters', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(equals('foo')), () => data.push('foo'))
          .route(() => data.push('bar'))
          .listen()

        window.location.hash = '#foo'
        await compare(data, ['foo', 'bar'])
      })
    })

    describe('if fragment ID does not equal input string', () => {
      it('should skip to next route', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(equals('foo')), () => data.push('foo'))
          .route(() => data.push('bar'))
          .listen()

        window.location.hash = '#bar'
        await compare(data, ['bar'])
      })
    })
  })

  describe('matches', () => {
    describe('if fragment ID matches pattern', () => {
      it('should run all remaining filters', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(matches(/ba/)), () => data.push('foo'))
          .route(() => data.push('bar'))
          .listen()

        window.location.hash = '#bar'
        await compare(data, ['foo', 'bar'])

        window.location.hash = '#baz'
        await compare(data, ['foo', 'bar', 'foo', 'bar'])
      })
    })

    describe('if fragment ID does not match pattern', () => {
      it('should skip to next route', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(matches(/ba/)), () => data.push('foo'))
          .route(() => data.push('bar'))
          .listen()

        window.location.hash = '#foo'
        await compare(data, ['bar'])
      })
    })

    describe('with unnamed captures', () => {
      it('should store matched pattern in req object', async () => {
        const data: Array<any> = []
        new Router()
          .route(
            guard(matches(/^user\/([a-z]+)\/post\/(\d+)$/)),
            req => data.push(req.matched)
          )
          .listen()

        window.location.hash = '#user/foo/post/'
        await compare(data, [])

        window.location.hash = '#user/foo/post/0/'
        await compare(data, [])

        window.location.hash = '#user/foo/post/0'
        await wait()
        const matched = data.pop() || []
        const first = matched[1] || ''
        const second = matched[2] || ''
        assert.strictEqual(first, 'foo')
        assert.strictEqual(second, '0')
      })
    })

    describe('with named captures', () => {
      it('should store matched pattern in req object', async () => {
        const data: Array<any> = []
        new Router()
          .route(
            guard(matches(/^user\/(?<user>[a-z]+)\/post\/(?<post>\d+)$/)),
            req => data.push(req.matched)
          )
          .listen()

        window.location.hash = '#user/foo/post/'
        await compare(data, [])

        window.location.hash = '#user/foo/post/0/'
        await compare(data, [])

        window.location.hash = '#user/foo/post/0'
        await wait()
        const matched = data.pop() || []
        const first = matched[1] || ''
        const second = matched[2] || ''
        assert.strictEqual(first, 'foo')
        assert.strictEqual(second, '0')

        assert.ok(matched.groups)
        assert.strictEqual(matched.groups.user, 'foo')
        assert.strictEqual(matched.groups.post, '0')
      })
    })
  })
})

describe('withPrefix', () => {
  beforeEach(mockDom)

  describe('with non-empty prefix', () => {
    it('should have the same result as calling currentRequest with a prefix', async () => {
      window.location.hash = '#foo/bar'
      const expected = currentRequest('foo/')
      const actual = withPrefix('foo/')(currentRequest())

      await wait()
      assert.deepStrictEqual(expected, actual)
    })
  })

  describe('with empty prefix', () => {
    it('should not modify input req', () => {
      const expected = currentRequest()
      const actual = withPrefix('')(expected)
      assert.deepStrictEqual(expected, actual)
    })
  })

  describe('when prefix does not match id in req', () => {
    it('should not return anything', () => {
      const req = currentRequest()
      assert.ok(!withPrefix('foo')(req))
    })
  })
})

function hello (req: Request) {
  const div = document.createElement('div')
  div.textContent = `Hello, ${req.id || 'world'}!`
  req.result = div
}

describe('dynamic fragments', () => {
  beforeEach(mockDom)

  describe('with no specified container in options', () => {
    it('should insert elements into document.body', async () => {
      document.body.innerHTML = ''
      new Router().route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.body.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')

      window.location.hash = '#bar'
      await wait()

      assert.ok(!document.body.querySelector('#foo'))
      const bar = document.body.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
    })
  })

  describe('with container in options', () => {
    it('should insert elements into container', async () => {
      document.body.innerHTML = '<div id="test"></div>'
      const container = document.body.querySelector('#test')
      new Router({ container }).route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.body.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')
      assert.deepStrictEqual(container, foo.parentNode)

      window.location.hash = '#bar'
      await wait()

      assert.ok(!document.body.querySelector('#foo'))
      const bar = document.body.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
      assert.deepStrictEqual(container, bar.parentNode)
    })
  })
})
