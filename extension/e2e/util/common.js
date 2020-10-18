const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

/* global chrome */

let browser, backgroundPage
const pathToExtension = path.join(__dirname, '../../src')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isVisible = (el) => el.evaluate((e) => !!(e.clientHeight + e.clientWidth))

const initBrowser = async (opts) => {
  const { pin } = opts || {}
  browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  })
  const targets = await browser.targets()
  const backgroundPageTarget = targets.find(
    (target) => target.type() === 'background_page'
  )
  backgroundPage = await backgroundPageTarget.page()

  // set pin to simulate an already-set up extension
  if (pin) {
    await backgroundPage.evaluate(
      (pinVal) =>
        new Promise((resolve) =>
          chrome.storage.sync.set({ __pin: pinVal }, resolve)
        ),
      pin
    )

    await backgroundPage.evaluate(() =>
      /* eslint-disable-next-line */
      eval('import("./pin.js")').then((pin) => pin.init(chrome.storage.sync))
    )
  }
  return { browser, backgroundPage }
}

const takeScreenshot = async (page, scriptPath, comment = '') => {
  const baseName = path.basename(scriptPath, path.extname(scriptPath))
  const targetDir = path.join(path.dirname(scriptPath), 'screenshots', baseName)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  const normComment = comment && '-' + comment.replace(/\W+/g, '-')
  const targetFilename = baseName + normComment + '.png'
  const targetPath = path.join(targetDir, targetFilename)
  await page.screenshot({ path: targetPath })
}

const cleanScreenshots = (scriptPath) => {
  // todo: remove all screenshots from folder
  const baseName = path.basename(scriptPath, path.extname(scriptPath))
  const targetDir = path.join(path.dirname(scriptPath), 'screenshots', baseName)
  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir)
    const cleanRegex = /\.png$/i
    files
      .filter((fileName) => cleanRegex.test(fileName))
      .forEach((fileName) => fs.unlinkSync(path.join(targetDir, fileName)))
  }
}

module.exports = {
  initBrowser,
  wait,
  isVisible,
  takeScreenshot,
  cleanScreenshots
}
