import { PluginStack } from '../src/plugin'
import * as assert from 'assert'

describe('PluginStack', () => {
  it('should run enter method forwards and exit method backwards', () => {
    const data: Array<string> = []
    const a = {
      enter: () => data.push('a'),
      exit: () => data.push('d')
    }
    const b = {
      enter: () => data.push('b'),
      exit: () => data.push('c')
    }
    const stack = new PluginStack()
    stack.plugins.push(a, b)
    stack.enter()
    stack.exit()
    assert.deepStrictEqual(data, ['a', 'b', 'c', 'd'])
  })
})
