import { createRequest, Router, equals, check, isHome, matches, hasPrefix } from '../src/index'
import { wait, compare, mockDom } from './utils'
import * as assert from 'assert'

beforeEach(mockDom)

describe('isHome', () => {
  it('should skip to the next route if hash is non-empty', async () => {
    const data: Array<string> = []
    new Router()
      .route(check(isHome), req => {
        data.push('foo')
        throw req.control.abort
      })
      .route(() => {
        data.push('bar')
      })
      .listen()

    await compare(data, ['foo']) // initial page load
    window.location.hash = '#'
    await compare(data, ['foo', 'foo'])

    window.location.hash = '#foo'
    await compare(data, ['foo', 'foo', 'bar'])

    window.location.hash = '#bar'
    await compare(data, ['foo', 'foo', 'bar', 'bar'])

    window.location.hash = '#baz'
    await compare(data, ['foo', 'foo', 'bar', 'bar', 'bar'])
  })
})

describe('equals', () => {
  describe('if fragment ID equals input string', () => {
    it('should run remaining filters', async () => {
      const data: Array<string> = []
      new Router()
        .route(
          check(equals('foo')), () => data.push('foo'),
          () => data.push('bar')
        )
        .listen()
      await compare(data, []) // initial page load
      window.location.hash = '#foo'
      await compare(data, ['foo', 'bar'])
    })
  })

  describe('if fragment ID does not equal input string', () => {
    it('should skip to next route', async () => {
      const data: Array<string> = []
      new Router()
        .route(check(equals('foo')), () => data.push('foo'))
        .route(() => data.push('bar'))
        .listen()

      await compare(data, ['bar']) // initial page load
      window.location.hash = '#bar'
      await compare(data, ['bar', 'bar'])
    })
  })
})

describe('matches', () => {
  describe('if fragment ID matches pattern', () => {
    it('should run all remaining filters', async () => {
      const data: Array<string> = []
      new Router()
        .route(
          check(matches(/ba/)), () => data.push('foo'),
          () => data.push('bar')
        )
        .listen()

      await compare(data, []) // initial page load
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
        .route(check(matches(/ba/)), () => data.push('foo'))
        .route(() => data.push('bar'))
        .listen()

      await compare(data, ['bar']) // initial page load
      window.location.hash = '#foo'
      await compare(data, ['bar', 'bar'])
    })
  })

  describe('with unnamed captures', () => {
    it('should store matched pattern in req object', async () => {
      const data: Array<any> = []
      new Router()
        .route(
          check(matches(/^user\/([a-z]+)\/post\/(\d+)$/)),
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
    it('should store matched groups in req.params', async () => {
      const data: Array<any> = []
      new Router()
        .route(
          check(matches(/^(?<foo>[a-z]+)\/(?<bar>[a-z]+)$/)),
          req => data.push(req)
        ).listen()

      window.location.hash = '#bar/baz'
      await wait()
      const req = data.pop()!
      assert.deepStrictEqual(req.params, req.matched.groups)
      assert.strictEqual(req.params.foo, 'bar')
      assert.strictEqual(req.params.bar, 'baz')
    })

    it('should store matched pattern in req object', async () => {
      const data: Array<any> = []
      new Router()
        .route(
          check(matches(/^user\/(?<user>[a-z]+)\/post\/(?<post>\d+)$/)),
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

describe('hasPrefix', () => {
  beforeEach(mockDom)

  describe('with non-empty prefix', () => {
    it('should have the same result as calling currentRequest with a prefix', async () => {
      window.location.hash = '#foo/bar'
      const expected = createRequest('bar')
      expected.prefix = 'foo/'

      const actual = createRequest('foo/bar')
      hasPrefix('foo/')(actual)
      await wait()
      assert.deepStrictEqual(expected, actual)
    })
  })

  describe('with empty prefix', () => {
    it('should not modify input req', () => {
      const expected = createRequest('test')
      expected.prefix = ''

      const actual = createRequest('test')
      actual.prefix = ''

      hasPrefix('')(actual)
      assert.deepStrictEqual(expected, actual)
    })
  })

  describe('when prefix does not match id in req', () => {
    it('should not return anything', () => {
      assert.ok(!hasPrefix('foo')(createRequest('')))
    })
  })
})
