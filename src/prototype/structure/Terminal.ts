/**
 * [description]
 *
 * @method
 * @return {[type]} [description]
 */
StructureTerminal.prototype.work = function () {
    // for (const mineral of Object.values(this.store)) {
    const mineral = Object.keys(this.store)[~~(Math.random() * (Object.keys(this.store)
        .length - 1)) + 1];
    if (!this.global.buyOrders)
        this.global.buyOrders = {};
    if (!this.global.sellOrders)
        this.global.sellOrders = {};
    if (!this.global.buyOrders[mineral] || !(Game.time % 50))
        this.global.buyOrders[mineral] = Game.market.getAllOrders({
            type: ORDER_BUY,
            type: mineral
        });
    if (!this.global.sellOrders[mineral] || !(Game.time % 50))
        this.global.sellOrders[mineral] = Game.market.getAllOrders({
            type: ORDER_SELL,
            type: mineral
        });
    let buyOrders = this.global.buyOrders[mineral];
    let maxBuyOrder = _.max(buyOrders, o => o.price > 0.01 && o.price - 0.01 / o.price * Game.market.calcTransactionCost(Math.min(this.room.terminal.store[mineral], o.amount), this.room.name, o.roomName));
    if (!this.global.maxPrice)
        this.global.maxPrice = {};
    if (!this.global.maxPrice[mineral])
        Object.assign(this.global.maxPrice, {
            mineral: maxBuyOrder.price
        });
    let amount = Math.min(this.room.terminal.store[mineral], maxBuyOrder.remainingAmount);
    console.log("mO", JSON.stringify(maxBuyOrder));
    if (this.global.maxPrice[mineral] < maxBuyOrder.price && this.store[mineral] > 1000) {
        console.log("DEALING", maxBuyOrder.id, amount, this.room.name);
        this.global.maxPrice[mineral] = maxBuyOrder.price;
        // const errMsg = Game.market.deal(maxBuyOrder.id, amount, this.room.name);
        console.log("Deal = ", errMsg);
        // break;
    }
    // }
};
