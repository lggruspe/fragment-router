import { Renderer } from '../src/renderer'
import { Router } from '../src/index'
import { mockDom } from './utils'

import * as assert from 'assert'

describe('Renderer', () => {
  beforeEach(mockDom)

  describe('constructor', () => {
    it('should use document.body as default container if none is specified', () => {
      const router = new Router()
      const renderer = new Renderer(router)
      assert.strictEqual(renderer.options.container, document.body)
    })
  })

  describe('write', () => {
    describe('outside of request context', () => {
      it('should throw an exception', () => {
        const router = new Router()
        const renderer = new Renderer(router)
        const div = document.createElement('div')
        assert.throws(
          () => renderer.write(div)
        )
      })
    })
  })

  describe('append', () => {
    describe('outside of request context', () => {
      it('should throw an exception', () => {
        const router = new Router()
        const renderer = new Renderer(router)
        const div = document.createElement('div')
        assert.throws(
          () => renderer.append(div)
        )
      })
    })

    describe('inside request context', () => {
      it('should append element', async () => {

      })
    })
  })
})

/*
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
*/
