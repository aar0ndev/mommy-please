/* global describe, it, expect */
import { Timer } from '../../src/common/timer.js'

describe('Timer', () => {
  it('exists', () => {
    expect(Timer).not.toBe(null)
  })

  it('instantiates', () => {
    expect(new Timer()).not.toBe(null)
  })

  it('returns value from set', async () => {
    const t = new Timer()

    const result = await new Promise((resolve) => {
      t.on('stuff', resolve)
      t.set('stuff', 0, 'good')
    })

    expect(result).toBe('good')
  })

  it('returns value from json', async () => {
    const t = new Timer()
    t.set('stuff', 0, 'good')
    const serial = t.toJson()

    const result = await new Promise((resolve) => {
      const t2 = new Timer()
      t2.on('stuff', resolve)
      t2.fromJson(serial)
    })

    expect(result).toBe('good')
  })

  it('ignores expired from json', async () => {
    const t = new Timer()
    t.set('stuff', 0, 'bad')
    t.set('stuff2', 10, 'good')
    const serial = t.toJson()

    const result = await new Promise((resolve) => {
      const t2 = new Timer()
      t2.on('stuff', resolve)
      t2.on('stuff2', resolve)
      t2.fromJson(serial, true)
    })

    expect(result).toBe('good')
  })
}, 100)
