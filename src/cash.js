import inquirer from 'inquirer';

export async function getCashAmount() {
    // Get the user's cash amount. This cannot be done with a web scraper 
    let cashAmountStr;
    await inquirer
        .prompt([
            {
                type: 'input',
                name: 'cashAmount',
                message: 'Enter your cash amount: ',
            },
        ])
        .then(answers => {
            cashAmountStr = answers.cashAmount;
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

    try {
        var cashAmount = parseFloat(cashAmountStr.replace(/[^0-9\.]/g, ''));
    } catch {
        console.log('Error parsing balance: ', balanceStr);
    }

    return cashAmount ?? 0;
}
