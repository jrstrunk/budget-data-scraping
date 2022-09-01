import { chromium } from 'playwright';
import { getSoFiBankingBalance } from './src/sofi.js';
import { getWhitakerBankingBalance } from './src/whitaker.js';
import * as dotenv from 'dotenv'
dotenv.config()

console.log("Starting web scraper...");

(async () => {
    const browser = await chromium.launch({
        headless: false // Show the browser. 
    });
    
    let sofiBalance = await getSoFiBankingBalance(browser);
    let whitakerBalance = await getWhitakerBankingBalance(browser);

    await browser.close();

    console.log(`Your balances are: `, sofiBalance, whitakerBalance);
})();