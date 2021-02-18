import { Router, isHome } from '../src/index'
import * as assert from 'assert'
import { JSDOM } from 'jsdom'

async function compare (a: any, b: any) {
  // Wait for queued functions (e.g. event listeners) to resolve.
  await new Promise(resolve => setTimeout(resolve, 0))
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
              function (req) {
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
              function (req) {
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
  })
})

describe('utils', () => {
  beforeEach(mockDom)

  describe('isHome', () => {
    describe('empty URL hash', () => {
      it('should skip remaining routes', async () => {
        const data: Array<string> = []
        new Router()
          .route(isHome(), req => {
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
  })

  describe('isNotNull', () => {
    it('should skip remaining', async () => {

    })
  })
})
