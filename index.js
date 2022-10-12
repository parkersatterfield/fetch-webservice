const express = require('express');
const app = express();

// middleware for json object parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// define db objects
const transactionArray = [];
const Transaction = require('./models/transaction.js');

// get balance helper
function getBalance() {
    const accountSummary = [];
    let payerArray = [];
    for (const item in transactionArray) {
        if (payerArray.includes(transactionArray[item].payer)) {
            let index = accountSummary.findIndex(x => x.payer === transactionArray[item].payer);
            accountSummary[index].points += transactionArray[item].points;
        } else {
            const accountItem = {
                payer: transactionArray[item].payer,
                points: transactionArray[item].points
            }
            payerArray.push(transactionArray[item].payer);
            accountSummary.push(accountItem);
        }
    }
    return accountSummary;
}

app.post('/add', (req, res) => {
    try {
        if (req.body.payer && req.body.points) {
            if ((typeof(req.body.payer) === 'string' && typeof(req.body.points) === 'number' && typeof(req.body.timestamp) === 'string')) {
                const t = new Transaction(req.body.payer, req.body.points, Date.parse(req.body.timestamp), req.body.points);
    
                // add transaction to transaction array
                transactionArray.push(t);
                
                return res.status(200).send(`Successfully added ${t.points} point transaction from ${t.payer}.`);
            } else {
                return res.status(400).send('Check data types on request body');
            }
        } else {
            res.status(400).json('Request body must contain Payer and Points data');
        }
    } catch(err) {
        return res.status(404).send(err);
    }
});

app.post('/spend', (req, res) => {
    try {
        if (req.body.points) {
            if ((typeof(req.body.points)) === 'number') {
                const spendArray = [];
                const payerArray = [];
                let pointsToSpend = req.body.points;
                
                // filter array for transactions with points available
                const filteredTransactionArray = transactionArray.filter(a => a.pointsAvailable !== 0 && a.pointsAvailable !== undefined);
                
                // sort transaction array by date
                const sortedTransactionArray = filteredTransactionArray.sort((a,b) => {
                    return a.timestamp-b.timestamp;
                });
                
                sortedTransactionArray.forEach(t => {
                    let found = false;
                    if (payerArray.includes(t.payer)) {
                        found = true;
                    } else {
                        payerArray.push(t.payer)
                    }
    
                    if (pointsToSpend > 0) {
                        let pointsSpent;
                        if (pointsToSpend >= t.pointsAvailable) {
                            pointsToSpend -= t.pointsAvailable;
                            pointsSpent = t.pointsAvailable;
                            // mutate the original transaction object t
                            t.pointsAvailable = 0;
                        } else {
                            // mutate the original transaction object t
                            t.pointsAvailable -= pointsToSpend;
                            pointsSpent = pointsToSpend;
                            pointsToSpend = 0;
                        } 
    
                        // create new object with negative points so balance is updated
                        const spendTransaction = new Transaction(t.payer, (pointsSpent*-1));
                        // spendArray.push(spendTransaction);
                        
                        if (!found) {
                            spendArray.push(spendTransaction);
                            transactionArray.push(spendTransaction);
                        } else {
                            let index = spendArray.findIndex(x => x.payer === t.payer);
                            spendArray[index].points += spendTransaction.points;
                        }
                    }
                });
    
                // format return object
                return res.status(200).send(spendArray);
            } else {
                return res.status(200).send('Points must be a number value');
            }
        } else {
            res.status(200).json('Request body must contain points data');
        }
    } catch (err) {
        return res.status(404).send(err);
    }
});

// Return all payer point balances
app.get('/balance', (req, res) => {
    // calculate balance based on transaction, group by payer
    try {
        const accountSummary = getBalance();

        if (accountSummary.length > 0) {
            return res.status(200).send(accountSummary);
        } else {
            return res.status(200).send("Account empty. Use /add endpoint to add transactions")
        }
    } catch(err) {
        return res.status(404).send(err);
    }
});


// Initialize the app and create a port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));