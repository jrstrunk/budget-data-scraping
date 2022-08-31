import { chromium } from 'playwright';
import { getBankingBalance } from './src/sofi.js';
import * as dotenv from 'dotenv'
dotenv.config()

console.log("Starting web scraper...");

(async () => {
    const browser = await chromium.launch({
        headless: false // Show the browser. 
    });
    
    let sofiBalance = await getBankingBalance(browser);

    await browser.close();

    console.log(`Your SoFi balance is: ${sofiBalance}`);
})();