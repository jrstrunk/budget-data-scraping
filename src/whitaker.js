import inquirer from 'inquirer';

// log in to sofi.com and get the user's checking account balance
export async function getWhitakerBankingBalance(browser) {
    const page = await browser.newPage();
    await page.goto(
        'https://web9.secureinternetbank.com/PBI_PBI1151/Login/042104168/'
    );

    // log in to whitaker
    await page.type('input#username', process.env.WHITAKER_USERNAME);
    await page.type('input#password', process.env.WHITAKER_PASSWORD);
    await page.click('button[type="submit"]');

    // answer the security question
    await page.click('button#securityQuestionButton');

    await page.waitForSelector("label[for='securityQuestion']");
    let securityQuestionLabel = page.locator("label[for='securityQuestion']");
    let securityQuestion = await securityQuestionLabel.evaluate(
        node => node.innerText
    );

    if (securityQuestion.includes('Maid of Honor')) {
        await page.type('input#securityQuestion', process.env.WHITAKER_MOHONOR);
    } else if (securityQuestion.includes('Best Man')) {
        await page.type('input#securityQuestion', process.env.WHITAKER_BESTMAN);
    } else if (securityQuestion.includes('Song')) {
        await page.type('input#securityQuestion', process.env.WHITAKER_FAVSONG);
    }

    await page.click("form#securityChallengeForm button[type='submit']");

    // get the banking account balance
    await page.waitForSelector('dd.h3 span');
    let accountBalance = page.locator('dd.h3 span');
    let balanceStr = await accountBalance.evaluate(node => node.innerText);

    try {
        var balance = parseFloat(balanceStr.replace(/[^0-9\.]/g, ''));
    } catch {
        console.log('Error parsing balance: ', balanceStr);
    }

    return balance ?? 0;
}
