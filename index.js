import { chromium } from 'playwright';
import { getSoFiBankingBalance } from './src/sofi.js';
import { getWhitakerBankingBalance } from './src/whitaker.js';
import { getWellsFargoBankingBalance } from './src/wellsfargo.js';
import { getCashAmount } from './src/cash.js';
import { getTransamericaRetirementBalance } from './src/transamerica.js';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('Starting web scraper...');

(async () => {
    const browser = await chromium.launch({
        headless: false, // Show the browser.
    });

    let sofiBalance = await getSoFiBankingBalance(browser);
    let whitakerBalance = await getWhitakerBankingBalance(browser);
    let wellsFargoBalance = await getWellsFargoBankingBalance(browser);
    let cashAmount = await getCashAmount();
    let transamericaBalance = await getTransamericaRetirementBalance(browser);

    await browser.close();

    console.log(
        `Your balances are: `,
        sofiBalance,
        whitakerBalance,
        wellsFargoBalance,
        cashAmount,
        transamericaBalance
    );
})();
