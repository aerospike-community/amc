exports.config = {  
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  baseUrl: 'http://localhost:3004',
  specs: ['tests/e2e/**/*.js'],
  onPrepare: () => {
    browser.ignoreSynchronization = true
    var width = 2250
    var height = 1200
    browser.driver.manage().window().setSize(width, height)
  },
  allScriptsTimeout: 15000,
  multiCapabilities: [{
    // browserName: 'firefox'
  // }, {
    browserName: 'chrome'
  // },
  //   browserName: 'ie'
  // },
  //   browserName: 'safari'
  }],
}
