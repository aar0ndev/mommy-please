const {
  initBrowser,
  takeScreenshot,
  cleanScreenshots,
  isVisible
} = require('../util/common')

let browser, page
const TEST_PIN = '1234'

beforeAll(async () => {
  ;({ browser } = await initBrowser())
  page = (await browser.pages())[0]
  cleanScreenshots(__filename)
})

afterAll(async () => {
  await browser.close()
})

describe('First page', () => {
  it('should show options page', async () => {
    const title = await page.title()
    await takeScreenshot(page, __filename, '1-show welcome page')
    expect(title).toContain('Options')
  })

  it('should prompt for pin', async () => {
    const input1 = await page.waitForSelector(
      'input[data-test-set-input1]:focus'
    )
    expect(await isVisible(input1)).toBe(true)
    const btn = await page.waitForSelector('[data-test-set-button1]')
    expect(await isVisible(btn)).toBe(true)
  })

  it('should prompt to confirm pin', async () => {
    await page.keyboard.type(TEST_PIN)
    await page.keyboard.press('Tab')
    await takeScreenshot(page, __filename, '2-input to verify pin')
    const input2 = await page.waitForSelector(
      'input[data-test-set-input2]:focus'
    )
    expect(input2).not.toBeNull()
  })

  it('should show success message', async () => {
    await page.keyboard.type(TEST_PIN)
    await page.keyboard.press('Enter')
    await takeScreenshot(page, __filename, '3-show success message')
    const msg = await page.waitForSelector('[data-test-set-message]')
    expect(await msg.evaluate((e) => e.innerText)).toContain('success')
  })
})
