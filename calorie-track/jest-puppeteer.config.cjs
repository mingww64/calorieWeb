const isCI = process.env.CI === 'true';

module.exports = {
  launch: {
    // Run headless in CI environments, otherwise run headed for easier local debugging
    headless: isCI ? true : false,
    slowMo: 50,
    args: isCI ? [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ] : [],
  },
  
  browserContext: 'incognito', // Prevent data persistence between tests, otherwise logout after each test is needed
  
  server: {
    command: 'npm start', 
    port: 5173,
    host: '127.0.0.1',           
    launchTimeout: 30000, 
    debug: true,
    usedPortAction: 'ignore',          
  },
}