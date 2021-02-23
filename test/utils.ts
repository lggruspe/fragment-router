import { JSDOM } from 'jsdom'
import * as assert from 'assert'

export async function wait () {
  // Wait for queued functions (e.g. event listeners) to resolve.
  return await new Promise(resolve => setTimeout(resolve, 0))
}

export async function compare (a: any, b: any) {
  await wait()
  assert.deepStrictEqual(await a, await b)
}

export function mockDom () {
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
