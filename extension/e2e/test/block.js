const {
  initBrowser,
  isVisible,
  takeScreenshot,
  wait,
  cleanScreenshots
} = require('../util/common')

const http = require('http')

let browser, page, unblockBtn, input, server

const TEST_PORT = 9091
const TEST_URL = `http://localhost:${TEST_PORT}`
const TEST_PIN = '1234'

beforeAll(async () => {
  ;({ browser } = await initBrowser({ pin: TEST_PIN }))
  page = await browser.newPage()
  cleanScreenshots(__filename)

  server = http.createServer(function (req, res) {
    res.write("<html><title>OK</title><body>It's all good y'all!</html>")
    res.end()
  })

  server.listen(TEST_PORT)
})

afterAll(async () => {
  await browser.close()
  server.close()
})

describe('First page', () => {
  it('should show block page', async () => {
    await page.goto(TEST_URL)
    await wait(500)
    expect(await page.title()).toContain('Blocked')
  })

  it('should show unblock button', async () => {
    unblockBtn = await page.waitForSelector('button')
    expect(unblockBtn).not.toBeNull()
    expect(await isVisible(unblockBtn)).toBe(true)
    await takeScreenshot(page, __filename, '1-unblock button visible')
  })

  it('should prompt for pin after button clicked', async () => {
    await unblockBtn.click()
    input = await page.waitForSelector('input:focus')
    expect(input).not.toBeNull()
    expect(await isVisible(input)).toBe(true)
    await takeScreenshot(page, __filename, '2-prompt for pin')
  })

  it('should unblock after entering pin', async () => {
    await input.type(TEST_PIN)
    await input.press('Enter')
    await wait(500)
    expect(await page.title()).not.toContain('Blocked')
    await takeScreenshot(page, __filename, '3-page unblocked')
  })
})
