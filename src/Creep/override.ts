"use strict";
const utils = require("lib_EngineUtils");
if (!Creep.prototype._moveTo) {
    Creep.prototype._moveTo = Creep.prototype.moveTo;
    /**
     * Wrap .moveTo to .travelTo if it's in different room.
     *
     * @param   {number | Object}  firstArg   [firstArg description]
     * @param   {number | Object}  secondArg  [secondArg description]
     * @param   {Object}  opts       [opts description]
     *
     * @return  {ERR_*}             [return description]
     */
    Creep.prototype.moveTo = function (firstArg, secondArg, opts = {}) {
        if (firstArg.pos)
            firstArg = firstArg.pos;
        if (!(firstArg instanceof RoomPosition))
            firstArg = RoomPosition.fromObject(firstArg);
        const road = this.pos.lookFor(LOOK_STRUCTURES)[0];
        if (road && !this.room.rcl && this.carry.energy && !this.memory.urgent && (road.hits <= ROAD_DECAY_AMOUNT || road.hitsMax - road.hits > utils.calcBodyEffectiveness(this.body, WORK, "repair", REPAIR_POWER)))
            this.repair(road);
        const moveablity = utils.calcBodyEffectiveness(this.body, MOVE, "fatigue", 1) / (utils.calcResourcesWeight(this) + this.body.filter(p => p.type !== MOVE && p.type !== CARRY)
            .length);
        if (moveablity >= 10) {
            // offroad if 10 * move parts == fatGenParts
            opts.offRoad = true;
        }
        else if (moveablity >= 1) {
            // ignore road if 2 * move parts == fatGenParts
            opts.ignoreRoad = true;
        }
        return this.travelTo(firstArg, secondArg, opts);
    };
}
;
if (!Creep.prototype._say) {
    Creep.prototype._say = Creep.prototype.say;
    /**
     * Default Creep.say() as public
     * @override
     * @param  {string} message The message to be displayed. Maximum length is 10 characters
     * @param  {boolean} [visibleToPublic=true]
     * @return {number}
     * @see https://docs.screeps.com/api/#Creep.say
     */
    Creep.prototype.say = function (message, visibleToPublic = true) {
        return this._say(message, visibleToPublic);
    };
}
;
if (!Creep.prototype._attack) {
    const trashTalk = ["Omae wa mou shindeiru", "?", "Your end is near", "See ya in hell", "You need a healer", "RIP"];
    Creep.prototype._attack = Creep.prototype.attack;
    /**
     * trash talk
     *
     * @param   {[type]}  target  [target description]
     *
     * @return  {[type]}          [return description]
     */
    Creep.prototype.attack = function (target) {
        if (target.hits < utils.calcBodyEffectiveness(this.body, ATTACK, "attack", ATTACK_POWER)) {
            this.say(trashTalk[~~(Math.random() * trashTalk.length)], true);
        }
        this._attack(target);
    };
}
/**
 * TODO understand this
 * [getAllOrders description]
 *
 * @param   {[type]}  filter  [filter description]
 *
 * @return  {[type]}          [return description]
 */
function getAllOrders(filter) {
    let originalP = JSON.parse;
    let originalS = JSON.stringify;
    changePrase();
    changeStringify();
    let result = Game.market.getAllOrders(filter);
    JSON.parse = originalP;
    JSON.stringify = originalS;
    return result;
    function changePrase() {
        const original = JSON.parse;
        function changedPrase(s) {
            return s;
        }
        JSON.parse = changedPrase;
    }
    function changeStringify() {
        const original = JSON.stringify;
        function changedStringify(s) {
            for (const orderId in s) {
                const order = s[orderId];
                order.price *= 1000;
            }
            return s;
        }
        JSON.stringify = changedStringify;
    }
}
