const {
  initBrowser,
  takeScreenshot,
  isVisible,
  cleanScreenshots
} = require('../util/common')

let browser, page, button1, input1, input2, input3, button2
const TEST_OLD_PIN = '1234'
const TEST_NEW_PIN = '1235'

beforeAll(async () => {
  ;({ browser } = await initBrowser({ pin: TEST_OLD_PIN }))
  page = (await browser.pages())[0]
  await page.reload()
  cleanScreenshots(__filename)
})

afterAll(async () => {
  await browser.close()
})

describe('Update pin', () => {
  it('should show options page', async () => {
    expect(await page.title()).toContain('Options')
  })

  it('should show update pin button', async () => {
    button1 = await page.waitForSelector('button[data-test-update-button1]')
    await takeScreenshot(page, __filename, '1-show update pin button')
    expect(await isVisible(button1)).toBe(true)
  })

  it('should prompt for old pin after clicking button', async () => {
    await button1.click()
    await takeScreenshot(page, __filename, '2-prompt for old pin')
    input1 = await page.waitForSelector('input[data-test-update-input1]:focus')
    button2 = await page.waitForSelector('button[data-test-update-button2]')
    expect(await isVisible(input1)).toBe(true)
    expect(await isVisible(button2)).toBe(true)
  })

  it('should prompt for new pin', async () => {
    await input1.type(TEST_OLD_PIN)
    await input1.press('Tab')
    await takeScreenshot(page, __filename, '3-prompt for new pin')
    input2 = await page.waitForSelector('input[data-test-update-input2]:focus')
    expect(await isVisible(input2)).toBe(true)
  })

  it('should prompt to verify new pin', async () => {
    await input2.type(TEST_NEW_PIN)
    await input2.press('Tab')
    await takeScreenshot(page, __filename, '4-prompt for new pin again')
    input3 = await page.waitForSelector('input[data-test-update-input3]:focus')
    expect(await isVisible(input3)).toBe(true)
  })

  it('should show success message', async () => {
    await input3.type(TEST_NEW_PIN)
    await input2.press('Enter')
    await takeScreenshot(page, __filename, '5-show success message')
    const msg = await page.waitForSelector('[data-test-update-message]')
    expect(await isVisible(msg)).toBe(true)
    expect(await msg.evaluate((e) => e.innerText)).toContain('success')
  })
})
