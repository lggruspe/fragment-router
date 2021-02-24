import { currentRequest, Router, equals, guard, isHome, isNotNull, matches, withPrefix } from '../src/index'
import { wait, compare, mockDom } from './utils'
import * as assert from 'assert'

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
          .route(
            guard(isNotNull),
            () => data.push('foo')
          )
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
          .route(
            guard(equals('foo')), () => data.push('foo'),
            () => data.push('bar')
          )
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
          .route(
            guard(matches(/ba/)), () => data.push('foo'),
            () => data.push('bar')
          )
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