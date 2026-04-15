const { chromium } = require('playwright');

async function testDeskFlow() {
  console.log('🔌 Connecting to Electron via CDP...');
  
  const browser = await chromium.connectOverCDP('http://localhost:9333');
  console.log('✅ Connected!');
  
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('📄 Page URL:', page.url());
  console.log('📄 Page Title:', await page.title());
  
  // Get page content
  const html = await page.content();
  console.log('📄 HTML length:', html.length);
  
  // Look for key elements
  const bodyText = await page.locator('body').innerText();
  console.log('📄 Body text preview:', bodyText.substring(0, 500));
  
  await browser.close();
  console.log('✅ Test complete');
}

testDeskFlow().catch(console.error);
