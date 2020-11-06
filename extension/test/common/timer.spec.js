/* global describe, it, expect */
import { Timer } from '../../src/common/timer.js'

describe('Timer', () => {
  it('exists', () => {
    expect(Timer).not.toBe(null)
  })

  it('instantiates', () => {
    expect(new Timer()).not.toBe(null)
  })

  it('returns value', async () => {
    const t = new Timer()

    const result = await new Promise((resolve) => {
      t.on('stuff', resolve)
      t.set('stuff', 0, 'good')
    })

    expect(result).toBe('good')
  })

  it('returns value from json', async () => {
    const t = new Timer()
    const t2 = new Timer()

    const result = await new Promise((resolve) => {
      const id = t.set('stuff', 0, 'good')
      const serial = t.toJson()
      t.cancel(id)

      t2.on('stuff', resolve)
      t2.fromJson(serial)
    })

    expect(result).toBe('good')
  })

  it('ignores expired from json', async () => {
    const t = new Timer()
    const t2 = new Timer()

    const result = await new Promise((resolve) => {
      const ids = [t.set('stuff', 0, 'bad'), t.set('stuff2', 10, 'good')]
      const serial = t.toJson()
      ids.map((id) => t.cancel(id))

      t2.on('stuff', resolve)
      t2.on('stuff2', resolve)
      t2.fromJson(serial, true)
    })

    expect(result).toBe('good')
  })

  it('cancels', async () => {
    const t = new Timer()

    const result = await new Promise((resolve) => {
      t.on('stuff', resolve)
      t.on('stuff2', resolve)
      const id = t.set('stuff', 0, 'bad')
      t.set('stuff2', 10, 'good')
      t.cancel(id)
    })

    expect(result).toBe('good')
  })
})
