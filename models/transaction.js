class Transaction {
    constructor(payer, points, timestamp) {
        this.payer = payer;
        this.points = points;
        this.timestamp = timestamp;
    }
}

module.exports = Transaction;
