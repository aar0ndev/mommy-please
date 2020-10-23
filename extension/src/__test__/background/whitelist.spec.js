/* global describe, it, expect */
import { fakeStorage } from '../fakeChrome.js'
console.info = () => {} // prevent console messages
// eslint-disable-next-line import/first
import * as whitelist from '../../background/whitelist.js'

describe('whitelist', () => {
  it('exists', () => {
    expect(whitelist).not.toBe(null)
  })

  it('throws exception when no whitelist is found', async () => {
    await expect(whitelist.init(fakeStorage())).rejects.toThrow(
      'could not load'
    )
  })

  it('unblocks url added forever', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    whitelist.addUrl('https://testdomain.com/', -1)
    expect(whitelist.check('https://testdomain.com/')).toStrictEqual({
      blocked: false,
      timeLeft: -1
    })
  })

  it('unblocks url added in future', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    const timestamp = Date.now() + 1000
    whitelist.addUrl('https://testdomain.com/', timestamp)
    const result = whitelist.check('https://testdomain.com/')
    expect(result.blocked).toBe(false)
    expect(result.timeLeft).toBeLessThanOrEqual(1000)
  })

  it('blocks url added in past', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    const timestamp = Date.now()
    whitelist.addUrl('https://testdomain.com/', timestamp)
    const result = whitelist.check('https://testdomain.com/')
    expect(result.blocked).toBe(true)
  })

  it('blocks url after removed', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    whitelist.addUrl('https://testdomain.com/', -1)
    expect(whitelist.check('https://testdomain.com/').blocked).toBe(false)
    whitelist.removeUrl('https://testdomain.com/')
    expect(whitelist.check('https://testdomain.com/').blocked).toBe(true)
  })

  it('unblocks different url with same domain', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    whitelist.addUrl('https://testdomain.com/', -1)
    expect(whitelist.check('https://testdomain.com/test123').blocked).toBe(
      false
    )
  })

  it('unblocks www url same as without', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    whitelist.addUrl('https://testdomain.com/', -1)
    expect(whitelist.check('https://www.testdomain.com/').blocked).toBe(false)
  })

  it('blocks non-www url as different domain', async () => {
    await whitelist.init(fakeStorage()).catch(() => {})
    whitelist.addUrl('https://testdomain.com/', -1)
    expect(whitelist.check('https://about.testdomain.com/').blocked).toBe(true)
  })
})
