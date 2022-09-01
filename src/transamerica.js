import inquirer from 'inquirer';

// log in to transamerica and get the user's account balance
export async function getTransamericaRetirementBalance(browser) {
    const page = await browser.newPage();
    await page.goto('https://secure2.transamerica.com/login');

    // log in to sofi.com
    await page.type('input#userName', process.env.TRANSAMERICA_USERNAME);
    await page.type('input#password', process.env.TRANSAMERICA_PASSWORD);
    await page.click('button#loginBtn');

    // request a 2fa code
    await page.click('#mobileRadio.mat-radio-button');
    await page.click('button#submitBtn');

    // get the 2fa code from the user
    let loginCode;
    await inquirer
        .prompt([
            {
                type: 'input',
                name: 'twoFACode',
                message: 'Enter your Transamerica 2FA code: ',
            },
        ])
        .then(answers => {
            loginCode = answers.twoFACode;
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

    await page.type('input#securityCode', loginCode);
    await page.click('button#submitBtn');

    // get the retirement account balance
    await page.waitForSelector("p.px-plan-header__balance_amt");
    let accountSummary = page.locator("p.px-plan-header__balance_amt");
    let balanceStr = await accountSummary.evaluate(
        node => node.innerText
    );

    try {
        var balance = parseFloat(balanceStr.replace(/[^0-9\.]/g, ''));
    } catch {
        console.log('Error parsing balance: ', balanceStr);
    }

    return balance ?? 0;
}
