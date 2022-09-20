import dayjs from 'dayjs';
import inquirer from 'inquirer';

async function logInToSoFi(page) {
    await page.goto('https://www.sofi.com/login/');

    if (await page.isVisible('input[type="email"]')) {
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
    }
}

// sofi has 8 account summary cards on the dashboard that each have a balance
// representing different aspects of the user's account
async function getSoFiAccountSummaryValue(page, summaryNum) {
    // log in to sofi.com
    await logInToSoFi(page);

    // get the balance for the passed account summary num
    await page.waitForSelector("div[class^='StyledImpressionTracking']");
    let accountSummaries = page.locator(
        "div[class^='StyledImpressionTracking']"
    );
    let balanceStr = await accountSummaries.evaluateAll(
        (nodes, summaryNum) =>
            nodes?.[summaryNum].querySelectorAll('p')?.[2].innerText,
        summaryNum
    );

    try {
        var balance = parseFloat(balanceStr.replace(/[^0-9\.]/g, ''));
    } catch {
        console.log('Error parsing balance: ', balanceStr);
    }

    return balance ?? 0;
}

export async function getSoFiBankingBalance(page) {
    return await getSoFiAccountSummaryValue(page, 0);
}

export async function getSoFiInvestAccountBalance(page) {
    return await getSoFiAccountSummaryValue(page, 1);
}

export async function getSoFiCreditScore(page) {
    return await getSoFiAccountSummaryValue(page, 2);
}

// log in to sofi.com and get the user's monthly transations
export async function getSofiPreviousMonthTransactions(page) {
    // log in to sofi.com
    await logInToSoFi(page);

    await page.goto('https://www.sofi.com/dashboard/money');

    // load all transactions for the previous month
    await page.click('button[data-qa="btn-view-more-activities"]');
    await page.click('button[data-qa="btn-view-more-activities"]');
    await page.click('button[data-qa="btn-view-more-activities"]');
    await page.click('button[data-qa="btn-view-more-activities"]');

    let prevMonthTableOffset = (await page.isVisible('h4')) ? 1 : 0;
    let prevMonth = dayjs().subtract(1, 'month').format('MMMM');

    let monthTransationHeaders = page.locator('h5');
    let prevMonthTableIndex = await monthTransationHeaders.evaluateAll(
        (nodes, prevMonth) =>
            nodes?.findIndex(node => node.innerText == prevMonth),
        prevMonth
    );

    let monthTransactions = page.locator('table');
    let prevMonthTransactions = await monthTransactions.evaluateAll(
        (nodes, tableIndex) => nodes?.[tableIndex].innerHTML,
        prevMonthTableIndex + prevMonthTableOffset
    );

    let splitTransactions = prevMonthTransactions.split('</tr>');
    splitTransactions.shift();
    splitTransactions.pop();

    console.log('Previous raw month transactions: ', splitTransactions);

    let transactionList = '';
    let categoryTotals = {
        f: 0,
        u: 0,
        t: 0,
        m: 0,
        b: 0,
        v: 0,
        d: 0,
        h: 0,
        s: 0,
        i: 0,
    };

    let categoryPrompt =
        'Categories are f (Food), u (Utilities), t (transportation), m (misc), b (baby), v (vacation, holiday, traveling), d (debt), h (health), s (shopping), i (income), x (exclude) \n\n';

    for (let trans of splitTransactions) {
        let title = trans.match(/<title>.+<\/title>/g);
        let formattedTrans = title?.[0]
            .replace(/<\/*title>/g, '')
            .replace('Transaction. Date: ', '')
            .replace(',', '')
            .replace('. Description: ', ',')
            .replace(/\ *. Amount: /g, ',');
        formattedTrans = formattedTrans.slice(0, -1);

        let transAmount;
        if (formattedTrans.includes('-$')) {
            transAmount = parseFloat(
                formattedTrans
                    .split('-$')
                    .at(-1)
                    .replace(/[^0-9\.]/g, '') * -1
            );
        } else {
            transAmount = parseFloat(
                formattedTrans
                    .split('$')
                    .at(-1)
                    .replace(/[^0-9\.]/g, '')
            );
        }

        let transCategory;
        categoryLoop: for (let cat of categories) {
            for (let tran of transCategories[cat]) {
                if (formattedTrans.includes(tran)) {
                    transCategory = cat;
                    break categoryLoop;
                }
            }
        }

        if (!transCategory) {
            await inquirer
                .prompt([
                    {
                        type: 'input',
                        name: 'transactionCategory',
                        message:
                            categoryPrompt +
                            'Enter the transaction category for \n' +
                            `"${formattedTrans}":`,
                    },
                ])
                .then(answers => {
                    transCategory = answers.transactionCategory;
                    categoryPrompt = '';
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
        }

        categoryTotals[transCategory] += transAmount;

        transactionList += formattedTrans + '\n';
    }

    return {
        transactionList,
        foodSpeding: categoryTotals.f * -1,
        utilitiesSpending: categoryTotals.u * -1,
        transportationSpending: categoryTotals.t * -1,
        miscSpending: categoryTotals.m * -1,
        babySpending: categoryTotals.b * -1,
        vacationSpending: categoryTotals.v * -1,
        debtSpending: categoryTotals.d * -1,
        healthSpending: categoryTotals.h * -1,
        shoppingSpending: categoryTotals.s * -1,
        income: categoryTotals.i,
    };
}

// categories are f (Food), u (Utilities), t (transportation), m (misc),
// b (baby), v (vaction, holiday, traveling), d (debt), h (health),
// s (shopping), i (income), x (exclude)
let categories = ['f', 'u', 't', 'm', 'b', 'v', 'd', 'h', 's', 'i', 'x'];
let transCategories = {
    f: [
        'ALDI',
        'KROGER',
        'CHICK-FIL-A',
        'GROCERY OUTLET',
        'CHIPOTLE',
        'PUBLIX SUPER MAR',
        'TRADER JOES',
        'SMOOTHIE KING',
        'MARLOWS TAVERN',
        'BBS GROCE',
        'EVANS ORCHARD',
        'ATHENIAN GRILL',
        'Coffe',
        'THE LOCAL GRIND',
        'GRAETERS',
        'YAMALLAMA GARAGE',
        'COOL DOUGH',
    ],
    u: [],
    t: ['FSI KY FARM BUREAU'],
    m: [
        'SOFI BANK,',
        'SoFi Credit Card',
        'DIGITALOCEAN.COM',
        'DISCOVER',
        'SPOTIFY',
    ],
    b: [],
    v: [],
    d: ['FIRSTMARK'],
    h: [],
    s: [
        'TARGET',
        'THE SALVATION ARMY',
        'Goodwill',
        'ROSS STORES',
        'LIFEPATH THRIFT STORES',
        'THRIFT BOOKS GLOBAL',
        'GABRIEL BROS',
    ],
    i: ['LIBERTY UNIVER', 'Interest earned'],
    x: ['SOFI SECURITIES'],
};
