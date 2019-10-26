"use strict";
console.log("WTF");
/**
 * TODO handle exception where id or pos is missing
 * [description]
 *
 * @return  {RoomObject|Object}  [return description]
 */
RoomObject.active = ({ id, pos } = {}) => Game.getObjectById(id) || {
    id,
    pos: RoomPosition.fromObject(pos)
};
Object.defineProperties(RoomObject.prototype, {
    /**
     * Prepare an RoomObject by simplify it to {id, pos}
     * @return  {Object}  A simplified object
     */
    simplify: {
        configurable: true,
        get: function () {
            return (({ id, pos, resouceType, structureType, }) => ({
                id,
                pos,
                resouceType,
                structureType,
            }))(this);
        }
    },
    memory: {
        configurable: true,
        get: function () {
            if (_.isUndefined(Memory.roomObjects)) {
                Memory.roomObjects = {};
            }
            if (!_.isObject(Memory.roomObjects)) {
                return undefined;
            }
            return Memory.roomObjects[this.id] = Memory.roomObjects[this.id] || {};
        },
        set: function (value) {
            if (_.isUndefined(Memory.roomObjects)) {
                Memory.roomObjects = {};
            }
            if (!_.isObject(Memory.roomObjects)) {
                throw new Error("Could not set room object " + this.id + " memory");
            }
            Memory.roomObjects[this.id] = value;
            Memory.roomObjects[this.id].structureType = this.structureType;
        }
    },
    /**
     *
     */
    global: {
        configurable: true,
        get: function () {
            if (_.isUndefined(global.roomObjects)) {
                global.roomObjects = {};
            }
            if (!_.isObject(global.roomObjects)) {
                return undefined;
            }
            return (global.roomObjects[this.id] = global.roomObjects[this.id] || {});
        },
        set: function (value) {
            if (_.isUndefined(global.roomObjects)) {
                global.roomObjects = {};
            }
            if (!_.isObject(global.roomObjects)) {
                throw new Error("Could not set room global " + this.id + " memory");
            }
            global.roomObjects[this.id] = value;
            global.roomObjects[this.id].structureType = this.structureType;
        }
    },
    /**
     * Assign which OWNED room it belongs to
     * @example remote source/container
     * @return {Room} the home room this object belong to
     */
    home: {
        configurable: true,
        get: function () {
            return this.room.home;
        }
    },
});
