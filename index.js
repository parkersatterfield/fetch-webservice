const express = require('express');
const app = express();

// middleware for json object parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// define db objects
const transactionArray = [];
const Transaction = require('./models/transaction.js');

// Add transactions for a specific payer and date
app.post('/add', (req, res) => {
    if (req.body.payer && req.body.points) {
        if ((typeof(req.body.payer) === 'string' && typeof(req.body.points) === 'number' && typeof(req.body.timestamp) === 'string')) {
            const t = new Transaction(req.body.payer, req.body.points, Date.parse(req.body.timestamp));

            // add transaction to transaction array
            transactionArray.push(t);
            
            return res.status(200).send(`Successfully added ${t.points} point transaction from ${t.payer}.`);
        } else {
            return res.status(400).send('Check data types on request body');
        }
    } else {
        res.status(400).json('Request body must contain Payer and Points data');
    }
});

// Spend points using the rules above and return a list of { "payer": <string>, "points": <integer> } for each call
app.post('/spend', (req, res) => {
    if (req.body.points) {
        if ((typeof(req.body.points)) === 'number') {
            // combine current transaction array by payer
            let pointsLeft = req.body.points;
            let spendArray = [];

            // sort transaction array by date
            const sortedTransactionArray = transactionArray.sort((a,b) => {
                return a.timestamp-b.timestamp;
            });

            // loop through transactions, clone to new object, update points, push spend object to spend array, return spend array
            for (const t in sortedTransactionArray) {
                const spendObject = {
                    payer: sortedTransactionArray[t].payer,
                    points: sortedTransactionArray[t].points,
                    timestamp: sortedTransactionArray[t].timestamp
                }

                if (pointsLeft > 0) {
                    if (pointsLeft > sortedTransactionArray[t].points) {
                        spendObject.points *= -1;
                        pointsLeft -= sortedTransactionArray[t].points;
                    } else {
                        spendObject.points = pointsLeft*-1;
                        pointsLeft = 0;
                    } 

                    // create new object with negative points so balance is updated
                    const spendTransaction = new Transaction(spendObject.payer, spendObject.points, spendObject.timestamp);
                    transactionArray.push(spendTransaction);
                    spendArray.push(spendObject);
                }
            }

            return res.status(200).send(spendArray);
        } else {
            return res.status(400).send('Points must be a number value');
        }
    } else {
        res.status(400).json('Request body must contain points data');
    }
});

// Return all payer point balances
app.get('/balance', (req, res) => {
    // calculate balance based on transaction, group by payer
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

        if (accountSummary.length > 0) {
            return res.status(200).send(accountSummary);
        } else {
            return res.status(200).send("Account empty. Use /add endpoint to add transactions")
        }
        return res.status(404).send(err)
});


// Initialize the app and create a port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Listening on PORT: ${PORT}`));
