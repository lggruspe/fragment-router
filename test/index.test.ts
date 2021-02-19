import { Router, equals, guard, isHome, isNotNull, matches } from '../src/index'
import * as assert from 'assert'
import { JSDOM } from 'jsdom'

async function wait () {
  // Wait for queued functions (e.g. event listeners) to resolve.
  return await new Promise(resolve => setTimeout(resolve, 0))
}

async function compare (a: any, b: any) {
  await wait()
  assert.deepStrictEqual(await a, await b)
}

function mockDom () {
  const html = `
    <div id="foo"></div>
    <div id="bar"></div>
    <div id="baz"></div>
  `
  const dom = new JSDOM(html, { url: 'https://example.com' })
  const writable = true
  Object.defineProperties(global, {
    dom: { value: dom, writable },
    window: { value: dom.window, writable },
    document: { value: dom.window.document, writable }
  })
}

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
  })

  describe('listen', () => {
    beforeEach(mockDom)

    describe('with single route', () => {
      describe('when req gets returned', () => {
        it('should run every request handler', async () => {
          const data: Array<string> = []
          new Router()
            .route(
              function (req) {
                data.push('foo')
                return req
              },
              function (req) {
                data.push('bar')
                return req
              },
              function (req) {
                data.push('baz')
                return req
              }
            )
            .listen()
          window.location.hash = '#'
          await compare(data, ['foo', 'bar', 'baz'])
        })
      })

      describe('when req does not get returned', () => {
        it('should stop at handler that fails to return req', async () => {
          const data: Array<string> = []
          new Router()
            .route(
              function (req) {
                data.push('foo')
                return req
              },
              function () {
                data.push('bar')
              },
              function (req) {
                data.push('baz')
                return req
              }
            )
            .listen()
          window.location.hash = '#'
          await compare(data, ['foo', 'bar'])
        })
      })
    })

    describe('with multiple routes', () => {
      describe('when req gets returned', () => {
        it('should run every request handler', async () => {
          const data: Array<number> = []
          new Router()
            .route(
              function (req) {
                data.push(0)
                return req
              },
              function (req) {
                data.push(1)
                return req
              }
            )
            .route(
              function (req) {
                data.push(2)
                return req
              },
              function (req) {
                data.push(3)
                return req
              }
            )
            .listen()
          window.location.hash = '#'
          await compare(data, [0, 1, 2, 3])
        })
      })

      describe('when req does not get returned', () => {
        it('should skip to the next route', async () => {
          const data: Array<number> = []
          new Router()
            .route(
              function () {
                data.push(0)
              },
              function (req) {
                data.push(1)
                return req
              }
            )
            .route(
              function (req) {
                data.push(2)
                return req
              },
              function (req) {
                data.push(3)
                return req
              }
            )
            .listen()
          window.location.hash = '#'
          await compare(data, [0, 2, 3])
        })
      })

      describe('when req.done is set to true', () => {
        it('should skip all remaining handlers and routes', async () => {
          const data: Array<number> = []
          new Router()
            .route(
              function (req) {
                data.push(0)
                req.done = true
                return req
              },
              function (req) {
                data.push(1)
                return req
              }
            )
            .route(
              function (req) {
                data.push(2)
                return req
              },
              function (req) {
                data.push(3)
                return req
              }
            )
            .listen()
          window.location.hash = '#'
          await compare(data, [0])
        })
      })
    })

    describe('with prefix', () => {
      it('should not handle requests if hash does not match the prefix', async () => {
        const data: Array<string> = []
        new Router()
          .route(req => {
            data.push('foo')
            req.done = true
          })
          .listen('foo/')
        new Router()
          .route(req => {
            data.push('bar')
            req.done = true
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
        it('should not get stuck in a loop', async () => {

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
    describe('with done = false', () => {
      it('should skip to the next route if hash is non-empty', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(isHome), req => {
            data.push('foo')
            req.done = true
          })
          .route(req => {
            data.push('bar')
            req.done = true
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

    describe('with done = true', () => {
      it('should skip all handlers if hash is non-empty', async () => {
        const data: Array<string> = []
        new Router()
          .route(guard(isHome, true), req => {
            data.push('foo')
            req.done = true
          })
          .route(req => {
            data.push('bar')
            req.done = true
          })
          .listen()

        window.location.hash = '#'
        await compare(data, ['foo'])

        window.location.hash = '#foo'
        await compare(data, ['foo'])

        window.location.hash = '#bar'
        await compare(data, ['foo'])

        window.location.hash = '#baz'
        await compare(data, ['foo'])
      })
    })
  })

  describe('isNotNull', () => {
    describe('with done = false', () => {
      describe('with existing fragment', () => {
        it('should run remaining handlers', async () => {
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
        it('should skip remaining handlers in route but run handlers in other routes', async () => {
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

    describe('with done = true', () => {
      describe('with existing fragment', () => {
        it('should run remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(isNotNull, true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#baz'
          await compare(data, ['foo', 'bar'])
        })
      })

      describe('with non-existing fragment', () => {
        it('should skip all remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(isNotNull, true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#non-existent-fragment'
          await compare(data, [])
        })
      })
    })
  })

  describe('equals', () => {
    describe('with done = false', () => {
      describe('if fragment ID equals input string', () => {
        it('should run remaining handlers', async () => {
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

    describe('with done = true', () => {
      describe('if fragment ID equals input string', () => {
        it('should run remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(equals('foo'), true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#foo'
          await compare(data, ['foo', 'bar'])
        })
      })

      describe('if no fragment ID equals input string', () => {
        it('should skip all remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(equals('foo'), true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#baz'
          await compare(data, [])
        })
      })
    })
  })

  describe('matches', () => {
    describe('with done = false', () => {
      describe('if fragment ID matches pattern', () => {
        it('should run all remaining handlers', async () => {
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
    })

    describe('with done = true', () => {
      describe('if fragment ID matches pattern', () => {
        it('should run all remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(matches(/ba/), true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#bar'
          await compare(data, ['foo', 'bar'])

          window.location.hash = '#baz'
          await compare(data, ['foo', 'bar', 'foo', 'bar'])
        })
      })

      describe('if fragment ID does not match pattern', () => {
        it('should skip all remaining handlers', async () => {
          const data: Array<string> = []
          new Router()
            .route(guard(matches(/ba/), true), () => data.push('foo'))
            .route(() => data.push('bar'))
            .listen()

          window.location.hash = '#foo'
          await compare(data, [])
        })
      })
    })

    describe('with unnamed captures', () => {
      it('should store matched pattern in req object', async () => {
        const data: Array<any> = []
        new Router()
          .route(guard(matches(/^user\/([a-z]+)\/post\/(\d+)$/), true))
          .route(req => data.push(req.matched))
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
          .route(guard(matches(/^user\/(?<user>[a-z]+)\/post\/(?<post>\d+)$/), true))
          .route(req => data.push(req.matched))
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
