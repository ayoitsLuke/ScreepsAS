"use strict";
const utils = require("lib_EngineUtils");
/**
 * [fromObject description]
 * @param   {Object}
 * @return  {RoomPosition}  [return description]
 */
RoomPosition.fromObject = ({ x, y, roomName } = {}) => (isNaN(x) || isNaN(y) || typeof roomName !== "string") ? undefined : new RoomPosition(x, y, roomName);
/**
 * @param {string} roomName1
 * @param {string} roomName2
 * @param {boolean} [continuous=false]
 *
 */
Room.getRoomTaxicabDistance = function (roomName1, roomName2, continuous) {
    const [xR1, yR1] = utils.roomNameToXY(roomName1);
    const [xR2, yR2] = utils.roomNameToXY(roomName2);
    let dx = Math.abs(xR2 - xR1);
    let dy = Math.abs(yR2 - yR1);
    if (continuous) {
        const worldSize = Game.map.getWorldSize();
        dx = Math.min(worldSize - dx, dx);
        dy = Math.min(worldSize - dy, dy);
    }
    return dx + dy;
};
/**
 * [getTaxicabDistance description]
 *
 * @param   {RoomObject|RoomPosition|number}  firstArg  [firstArg description]
 * @param   {number}  [secondArg]  [secondArg description]
 *
 * @return  {number}  The number of square to the given position in [taxicab metric]{@link http://mathworld.wolfram.com/TaxicabMetric.html}
 */
RoomPosition.prototype.getTaxicabDistanceTo = function (firstArg, secondArg) {
    if (firstArg.pos)
        firstArg = firstArg.pos;
    if (!isNaN(firstArg) || firstArg.roomName === this.roomName) {
        return Math.abs(this.x - firstArg + this.y - secondArg);
    }
    else {
        const [xR1, yR1] = utils.roomNameToXY(this.roomName);
        const [xR2, yR2] = utils.roomNameToXY(firstArg.roomName);
        const dx = 50 * (xR2 - xR1) + firstArg.x - this.x;
        const dy = 50 * (yR2 - yR1) + firstArg.y - this.y;
        return Math.abs(dx) + Math.abs(dy);
    }
};
/**
 * [getRangeTo description]
 * @override
 * @see     https://docs.screeps.com/api/#RoomPosition.getRangeTo
 * @param   {RoomObject|RoomPosition|number}  firstArg
 * @param   {number}  [secondArg]  [secondArg description]
 *
 * @return  {number}             [return description]
 */
RoomPosition.prototype.getRangeTo = function (firstArg, secondArg) {
    if (isNaN(firstArg)) {
        if (firstArg.pos)
            firstArg = firstArg.pos;
        const [xR1, yR1] = utils.roomNameToXY(this.roomName);
        const [xR2, yR2] = utils.roomNameToXY(firstArg.roomName);
        if ([xR1, yR1, xR2, yR2, firstArg.x, this.x, firstArg.y, this.y].some(n => isNaN(n))) {
            throw new Error("getRangeTo");
        }
        const dx = 50 * (xR2 - xR1) + firstArg.x - this.x;
        const dy = 50 * (yR2 - yR1) + firstArg.y - this.y;
        return Math.max(Math.abs(dx), Math.abs(dy));
    }
    else {
        return Math.max(Math.abs(this.x - firstArg), Math.abs(this.y - secondArg));
    }
};
