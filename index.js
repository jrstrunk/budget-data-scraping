import { chromium } from 'playwright';
import { getSoFiBankingBalance, getSofiPreviousMonthTransactions } from './src/sofi.js';
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

    const page = await browser.newPage();

    let sofiBalance = await getSoFiBankingBalance(page);
    let whitakerBalance = await getWhitakerBankingBalance(browser);
    let wellsFargoBalance = await getWellsFargoBankingBalance(browser);
    let cashAmount = await getCashAmount();
    let transamericaBalance = await getTransamericaRetirementBalance(browser);

    let { 
        transactionList,
        foodSpeding,
        utilitiesSpending,
        transportationSpending,
        miscSpending,
        babySpending,
        vacationSpending,
        debtSpending,
        healthSpending,
        shoppingSpending,
        income,
    } = await getSofiPreviousMonthTransactions(page);

    await browser.close();

    console.log('Your transactions are: ', transactionList);
    console.log("Balances: \n", foodSpeding, utilitiesSpending, transportationSpending, miscSpending, babySpending, vacationSpending, debtSpending, healthSpending, shoppingSpending, income);
})();
