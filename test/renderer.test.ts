import { Renderer, DomAppender, DomWriter } from '../src/renderer'
import { Request, Router } from '../src/index'
import { mockDom, wait } from './utils'

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
  })
})

function hello (req: Request) {
  const div = document.createElement('div')
  div.textContent = `Hello, ${req.id || 'world'}!`
  req.result = div
}

describe('DomWriter', () => {
  beforeEach(mockDom)

  describe('restore', () => {
    describe('when request ID is the same as the ID of an existing fragment', () => {
      it('should save and restore existing fragment after switching to another hash', async () => {
        const div = document.querySelector('#foo')
        assert.ok(div)
        div.textContent = 'yay'

        const router = new Router()
        const writer = new DomWriter(router)
        router.stack.plugins.push(writer)
        router.route(hello).listen()

        window.location.hash = '#foo'
        await wait()

        const foo = document.querySelector('#foo')
        assert.ok(Boolean(foo))
        assert.strictEqual(foo?.textContent, 'Hello, foo!')

        window.location.hash = '#bar'
        await wait()

        assert.ok(document.querySelector('#foo'))
        assert.strictEqual(
          document.querySelector('#foo')!.textContent,
          'yay'
        )
        const bar = document.querySelector('#bar')
        assert.ok(Boolean(bar))
        assert.strictEqual(bar?.textContent, 'Hello, bar!')
      })
    })
  })

  describe('with no specified container in options', () => {
    it('should insert elements into document.body', async () => {
      document.body.innerHTML = ''
      const router = new Router()
      const writer = new DomWriter(router)
      router.stack.plugins.push(writer)
      router.route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')

      window.location.hash = '#bar'
      await wait()

      assert.ok(!document.querySelector('#foo'))
      const bar = document.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
    })
  })

  describe('with non-HTMLElement req.result', () => {
    it('should insert div with result as textContent', async () => {
      const router = new Router()
      const writer = new DomWriter(router)
      router.stack.plugins.push(writer)
      router.route(req => {
        req.result = [1, 2, 3]
      }).listen()

      window.location.hash = '#test'
      await wait()

      const div = document.querySelector('#test')!
      assert.ok(Boolean(div))
      assert.strictEqual(div.tagName, 'DIV')
      assert.strictEqual(div.textContent, [1, 2, 3].toString())
    })
  })

  describe('with container in options', () => {
    it('should insert elements into container', async () => {
      document.body.innerHTML = '<div id="test"></div>'
      const container = document.querySelector('#test')

      const router = new Router()
      const writer = new DomWriter(router, { container })
      router.stack.plugins.push(writer)
      router.route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')
      assert.deepStrictEqual(container, foo.parentNode)

      window.location.hash = '#bar'
      await wait()

      assert.ok(!document.querySelector('#foo'))
      const bar = document.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
      assert.deepStrictEqual(container, bar.parentNode)
    })
  })
})

describe('DomAppender', () => {
  beforeEach(mockDom)

  describe('with no specified container in options', () => {
    it('should append elements into document.body', async () => {
      document.body.innerHTML = ''
      const router = new Router()
      const writer = new DomAppender(router)
      router.stack.plugins.push(writer)
      router.route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')

      window.location.hash = '#bar'
      await wait()

      assert.ok(document.querySelector('#foo'))
      const bar = document.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
    })
  })

  describe('with container in options', () => {
    it('should append elements into container', async () => {
      document.body.innerHTML = '<div id="test"></div>'
      const container = document.querySelector('#test')

      const router = new Router()
      const writer = new DomAppender(router, { container })
      router.stack.plugins.push(writer)
      router.route(hello).listen()

      window.location.hash = '#foo'
      await wait()

      const foo = document.querySelector('#foo')
      assert.ok(Boolean(foo))
      assert.strictEqual(foo?.textContent, 'Hello, foo!')
      assert.deepStrictEqual(container, foo.parentNode)

      window.location.hash = '#bar'
      await wait()

      assert.ok(document.querySelector('#foo'))
      const bar = document.querySelector('#bar')
      assert.ok(Boolean(bar))
      assert.strictEqual(bar?.textContent, 'Hello, bar!')
      assert.deepStrictEqual(container, bar.parentNode)
    })
  })

  describe('with non-HTMLElement req.result', () => {
    it('should append div with result as textContent', async () => {
      const router = new Router()
      const writer = new DomAppender(router)
      router.stack.plugins.push(writer)
      router.route(req => {
        req.result = [1, 2, 3]
      }).listen()

      window.location.hash = '#test'
      await wait()

      const div = document.querySelector('#test')!
      assert.ok(Boolean(div))
      assert.strictEqual(div.tagName, 'DIV')
      assert.strictEqual(div.textContent, [1, 2, 3].toString())
    })
  })
})
