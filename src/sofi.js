import inquirer from 'inquirer';

// log in to sofi.com and get the user's checking account balance
export async function getBankingBalance(browser) {
    const page = await browser.newPage();
    await page.goto('https://www.sofi.com/login/');

    // log in to sofi.com
    await page.type('input[type="email"]', process.env.SOFI_EMAIL);
    await page.type('input[type="password"]', process.env.SOFI_PASSWORD);
    await page.click('button[type="submit"]');

    // get the 2fa code from the user
    let loginCode;
    await inquirer
        .prompt([
            {
                type: 'input',
                name: 'sofi2FACode',
                message: 'Enter your SoFi 2FA code: ',
            },
        ])
        .then(answers => {
            loginCode = answers.sofi2FACode;
        })
        .catch(error => {
            if (error.isTtyError) {
                console.log(
                    "Prompt couldn't be rendered in the current environment"
                );
            } else {
                console.log('Error creating prompt: ', error);
            }
        });

    await page.type('input#code', loginCode);
    await page.click('button#verifyCode');

    // get the banking account balance
    await page.waitForSelector('p.egBMLt.account-summary');
    let balanceStr = await page
        .evaluate(() => {
            return document.querySelector('p.egBMLt.account-summary').innerText;
        })
        .catch(error => {
            console.log('Error getting balance: ', error);
        });

    try {
        var balance = parseFloat(balanceStr.replace(/[^0-9\.]/, ''));
    } catch {
        console.log('Error parsing balance: ', balanceStr);
    }

    return balance ?? 0;
}
