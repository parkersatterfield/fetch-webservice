class Transaction {
    constructor(payer, points, timestamp, pointsAvailable) {
        this.payer = payer;
        this.points = points;
        this.timestamp = timestamp;
        this.pointsAvailable = pointsAvailable;
    }
}

module.exports = Transaction;
