"use strict";

class Market {
  // Objective calc energy cost & buy & sell same tick, sell room's stuff, buy lab reactant
  /**
   *
   *
   * @static
   * @memberof Market
   * @returns {Object}
   */
  static getGrounpedOrders() {
    // if memory no orders/orders timeout -> get new orders
    const allOrders = Game.market.getAllOrders();
    let sells = {},
      buys = {};
    RESOURCES_ALL.forEach(r => buys[r] = {}, sells[r] = {});
    for (o in allOrders) {
      switch (o.type) {
        case ORDER_BUY:
          buys[o.resourceType].push(o);
          // add stdev to each buys[o.resourceType]
          break;
        case ORDER_SELL:
          sells[o.resourceType].push(o);
          break;
        default:
          throw Error("Unknown type in market")
          break;
      }
    }
    return {buys,sells}
  }
}
