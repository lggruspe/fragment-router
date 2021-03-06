import { Router, DomAppender, DomWriter } from '../src/index'
import { mockDom, wait } from './utils'

import * as assert from 'assert'

describe('DomWriter', () => {
  beforeEach(mockDom)

  describe('outside of request context', () => {
    it('should throw an exception', () => {
      const router = new Router()
      const renderer = new DomWriter(router)
      const div = document.createElement('div')
      assert.throws(
        () => renderer.render(div)
      )
    })
  })

  describe('renderContent', () => {
    describe('when req.id is empty', () => {
      it('id of created element should be empty', async () => {
        document.body.innerHTML = ''
        const router = new Router()
        const writer = new DomWriter(router)
        router.route(() => router.defer(() => writer.renderContent('test')))
        router.listen()

        window.location.hash = '#'
        await wait()
        assert.strictEqual(document.body.children.length, 1)
        assert.strictEqual(document.body.firstElementChild!.id, '')
        assert.strictEqual(document.body.firstElementChild!.textContent, 'test')
      })
    })

    describe('when req.id is non-empty', () => {
      it('id of created element should not be empty', async () => {
        document.body.innerHTML = ''
        const router = new Router()
        const writer = new DomWriter(router)
        router.route(() => router.defer(() => writer.renderContent('test')))
        router.listen()

        window.location.hash = '#foo'
        await wait()
        assert.strictEqual(document.body.children.length, 1)
        assert.strictEqual(document.body.firstElementChild!.id, 'foo')
        assert.strictEqual(document.body.firstElementChild!.textContent, 'test')
      })
    })

    describe('when there is an existing fragment with the same ID as request', () => {
      describe('outside the container', () => {
        it('should not mess with the existing fragment', async () => {
          document.body.innerHTML = `
            <div id="foo">No!</div>
            <div class="container">
              <div id="foo"></div>
            </div>
          `
          const router = new Router()
          const writer = new DomWriter(router, {
            container: document.querySelector('.container')
          })
          router.route(() => router.defer(() => writer.renderContent('test')))
          router.listen()

          window.location.hash = '#foo'
          await wait()
          assert.strictEqual(document.getElementById('foo')!.textContent, 'No!')

          const foo = document.querySelector('.container div')
          assert.ok(foo!)
          assert.strictEqual(foo.tagName, 'DIV')
          assert.strictEqual(foo.id, 'foo')
          assert.strictEqual(foo.textContent, 'test')
        })
      })
    })
  })

  describe('restore', () => {
    describe('when request ID is the same as the ID of an existing fragment', () => {
      it('should save and restore existing fragment after switching to another hash', async () => {
        const div = document.querySelector('#foo')
        assert.ok(div)
        div.textContent = 'yay'

        const router = new Router()
        const writer = new DomWriter(router)
        router.route(req => {
          router.defer(() => {
            writer.renderContent(`Hello, ${req.id}!`)
          })
        }).listen()
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
      router.route(req => {
        router.defer(() => {
          writer.renderContent(`Hello, ${req.id}!`)
        })
      }).listen()

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

  describe('with non-HTMLElement', () => {
    it('should insert div with result as textContent', async () => {
      const router = new Router()
      const writer = new DomWriter(router)
      router.route(() => {
        router.defer(() => {
          writer.renderContent([1, 2, 3])
        })
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
      router.route(req => {
        router.defer(() => {
          writer.renderContent(`Hello, ${req.id}!`)
        })
      }).listen()

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
      const appender = new DomAppender(router)
      router.route(req => {
        router.defer(() => {
          appender.renderContent(`Hello, ${req.id}!`)
        })
      }).listen()

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
      const appender = new DomAppender(router, { container })
      router.route(req => {
        router.defer(() => {
          appender.renderContent(`Hello, ${req.id}!`)
        })
      }).listen()

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

  describe('with non-HTMLElement', () => {
    it('should append div with result as textContent', async () => {
      const router = new Router()
      const appender = new DomAppender(router)
      router.route(() => {
        router.defer(() => {
          appender.renderContent([1, 2, 3])
        })
      }).listen()

      window.location.hash = '#test'
      await wait()

      const div = document.querySelector('#test')!
      assert.ok(Boolean(div))
      assert.strictEqual(div.tagName, 'DIV')
      assert.strictEqual(div.textContent, [1, 2, 3].toString())
    })
  })

  describe('outside of request context', () => {
    it('should throw an exception', () => {
      const router = new Router()
      const renderer = new DomAppender(router)
      const div = document.createElement('div')
      assert.throws(
        () => renderer.render(div)
      )
    })
  })

  describe('renderHtml', () => {
    it('should convert html to element and append it to the document', async () => {
      document.body.innerHTML = ''
      const router = new Router()
      const appender = new DomAppender(router)
      router.route(
        req => {
          router.defer(() => {
            appender.renderHtml(`
              <h1>${req.id}</h1>
            `)
          })
        }
      ).listen()

      window.location.hash = '#test'
      await wait()

      const h1 = document.querySelector('#test')!
      assert.ok(Boolean(h1))
      assert.strictEqual(h1.tagName, 'H1')
      assert.strictEqual(h1.id, 'test')
      assert.strictEqual(h1.textContent, 'test')
    })
  })
})
