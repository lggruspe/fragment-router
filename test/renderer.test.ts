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
