import { Router, isHome } from '../src/index'
import * as assert from 'assert'
import { JSDOM } from 'jsdom'

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
})

function mockDom (url: string) {
  const html = `
    <div id="foo"></div>
    <div id="bar"></div>
    <div id="baz"></div>
  `
  const dom = new JSDOM(html, { url })
  const writable = true
  Object.defineProperties(global, {
    dom: { value: dom, writable },
    window: { value: dom.window, writable },
    document: { value: dom.window.document, writable }
  })
}

describe('utils', () => {
  describe('isHome', () => {
    describe('empty URL hash', () => {
      it('should skip remaining routes', () => {
        const data: Array<string> = []
        mockDom('https://example.com')
        new Router()
          .route(isHome, req => {
            data.push('foo')
            req.done = true
          })
          .route(req => {
            data.push('bar')
            req.done = true
          })
          .listen()
        mockDom('https://example.com#')
        assert.deepStrictEqual(data, [])
      })
    })
  })
})
