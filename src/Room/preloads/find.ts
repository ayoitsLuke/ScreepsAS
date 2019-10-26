"use strict";
if (!Room.prototype._find) {
    Room.prototype._find = Room.prototype.find;
    /**
     * Find all visible objects and return as an array
     *
     * @param   {FIND_*}  type  One of the FIND_* constants.
     * @param   {Object}  [opts={}]  Same as [Room.prototype.find()]{@link https://docs.screeps.com/api/#Room.find}
     * @return  {RoomObject[]}  an array of all RoomObjects which is [visible]{@link https://docs.screeps.com/api/#Game.rooms} to player
     */
    Room.prototype.findInAllRooms = function (type, opts) {
        opts = opts || {};
        let result = [];
        if (opts.debug)
            console.log("-Room.prototype.findInAllRooms");
        filter = opts.filter;
        for (const room of Object.values(Game.rooms)) {
            result.push(...room._find(type, {
                filter
            }));
        }
        if (opts.debug)
            console.log("all=" + result);
        return result;
    };
    /**
     * Add caching (w/in ticks) and implement claim/random to Room.prototype.find()
     *
     * @method
     * @overwrite
     * @param   {number} type  One of the FIND_* constants.
     * @param   {Object} [opts={}]  An object for customize the serach result
     * @param   {boolean}  [opts.all=false]  Find in all [visible]{@link https://docs.screeps.com/api/#Game.rooms} rooms. More about "visible":
     * @param   {string}  [opts.cache]  "deep", "shallow", or undefined. Shallow only cache the results for current tick, deep cache last until [Global reset]{@link https://docs.screeps.com/contributed/caching-overview.html#Global}.
     * @param   {boolean}  [opts.claim=false]  Ruturn one object & make it unavailable to further searches. Setting claim=true will force cache="deep"
     * @param   {boolean}  [opts.random=false]  Return one random object, using Math.random()
     * @param   {Function|Object|string}  [opts.max=false]  Impelent of [_.max()]{@link https://lodash.com/docs/3.10.1#max}
     * @param   {Function|Object|string}  [opts.min=false]  Impelent of [_.min()]{@link https://lodash.com/docs/3.10.1#min}
  
     * @param   {Function|Object|string}  [opts.filter]  [Native]{@link https://docs.screeps.com/api/#Room.find} feature.
     * @return  {RoomObject[]} Same as Room.prototype.find(type, [opts])
     * @see https://docs.screeps.com/api/#Room.find
     */
    Room.prototype.find = function (type, opts) {
        // Arguments handling
        opts = opts || {};
        if (opts.debug)
            console.log("-Room.prototype.find", this.name);
        let result = [];
        let cacheName = type;
        if (typeof opts.cache === "string")
            opts.cache.toLowerCase();
        opts.cache = opts.claim ? "deep" : opts.cache;
        const methodFind = opts.all ? "findInAllRooms" : "_find";
        if (opts.debug)
            console.log("type=" + type + " opts" + JSON.stringify(opts));
        if (type === FIND_SOURCES || type === FIND_MINERALS) {
            // TODO Handle stationary harvest vs remote harvest
        }
        if (opts.debug)
            console.log("cache:" + opts.cache + " random:" + Boolean(opts.random) + " claim:" + Boolean(opts.claim) + " filter:" + JSON.stringify(opts.filter));
        if (!opts.cache) {
            result = this[methodFind](type, opts);
        }
        else {
            // Generate identifier for cache
            cacheName += opts.filter ? hashCode(opts.filter.toString()
                .replace(/\s+/g, "")) : 0;
            cacheName *= opts.cache === "deep" ? 1 : -1;
            cacheName = opts.all ? cacheName.toString() : this.name + cacheName;
            if (opts.debug)
                console.log("defining cacheName: ", cacheName);
            /*
            global.find[cacheName] temporary cache, reset each tick
            global.found[cacheName] long-term cache, reset when global reset
             */
            if (!global.found)
                global.found = {};
            if (!global.find || global.find.timestamp !== Game.time) { // Check the time of temp cache
                global.find = {
                    timestamp: Game.time
                };
            }
            ;
            if (!global.find[cacheName]) { // If there's no temp cache
                if (!global.found[cacheName] || !global.found[cacheName].length) { // If there's no long-term cache
                    global.found[cacheName] = this[methodFind](type, opts)
                        .map(o => {
                        return {
                            id: o.id,
                            pos: o.pos
                        };
                    });
                    if (opts.debug)
                        console.log("global.found[cacheName]", global.found[cacheName]);
                }
                global.find[cacheName] = global.found[cacheName].map(o => {
                    return Game.getObjectById(o.id) || {
                        id: o.id,
                        pos: new RoomPosition(o.pos.x, o.pos.y, o.pos.roomName)
                    };
                });
            }
            if (opts.claim) {
                global.found[cacheName].forEach(o => new RoomVisual(o.pos.roomName)
                    .circle(o.pos.x, o.pos.y, {
                    color: "#000000"
                }));
                // new RoomVisual(this.name).circle(this.pos.x, this.pos.y, {
                //     color: "#7CFC00"
                // });
            }
            result = global.find[cacheName];
        }
        if (opts.debug)
            console.log("result=" + result + " opts=" + JSON.stringify(opts));
        // Generate a random position & get the object of that position
        let i = 0;
        if (opts.random) {
            i = ~~(Math.random() * result.length);
            result = result[i];
            if (opts.debug)
                console.log("random: " + " i=" + i + " result=" + result);
        }
        // DEPRECATED
        if (opts.sort && result.length) {
            result = result.sort(opts.sort);
            if (opts.debug)
                console.log("resultID" + result.id);
            i = opts.cache ? global.find[cacheName].indexOf(result.id) : 0;
        }
        // Check for maximum or minimum
        if ((opts.max ? 1 : 0) ^ (opts.min ? 1 : 0) && result.length) {
            if (opts.max) {
                result = _.max(result, opts.max);
            }
            if (opts.min) {
                result = _.min(result, opts.min);
            }
            i = opts.cache ? global.find[cacheName].indexOf(result.id) : 0;
            if (i < 0)
                i = 0;
            if (opts.debug)
                console.log("Max/Min: " + opts.max ? "max" : "min" + result);
            if (typeof result === "number") {
                result = undefined;
                console.log("[ERROR] Room.find() opts.max=" + (opts.max ? opts.max.toString() : "") + " opts.min=" + (opts.min ? opts.min.toString() : "") + " filter=" + (opts.filter ? opts.filter.toString() : "" + " result-" + result));
            }
        }
        // Check for opts: {claim: true}
        if (opts.claim) {
            // Remove the object from cache
            result = global.find[cacheName].splice(i, 1);
            global.found[cacheName].splice(i, 1);
        }
        if (opts.find) {
            _.find(result, opts.find);
        }
        return Array.isArray(result) ? result : [result];
    };
}
/**
 * This is a method to return the closest object based on priority then distance, null otherwise
 *
 * @param   {number|RoomObject[]} type     One of the FIND_* constants OR An array of room's objects or RoomPosition objects.
 * @param   {Object}  [opts]  Inherited from Room.prototype.find(). See JSdoc above for detail
 * PROPERTY IMPLEMENTED (default FALSE):
 * @param   {boolean}  [opts.byPath=false]  Find closest object by path, otherwise by range
 * @param   {boolean}  [opts.strict=false]  Strict mode. If false, an random object will be return if no RoomObject matches
 * [More native feature]@link https://docs.screeps.com/api/#Room.find}
 * @param   {string[]}  [priority]  An array of STRUCTURE_* or RESOURCE_* constant.
 * e.g. [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, ...]
 * @return  {Object}  The closest object based on priority then range. Or a random object as if type, opts were passed into Room.find()
 */
RoomPosition.prototype.findClosestByPriority = function (type, opts, priority) {
    // Arguments handling
    if (opts.debug)
        console.log("-RoomPosition.prototype.findClosestByPriority");
    if (Array.isArray(opts) && !priority) {
        priority = opts;
        opts = {};
    }
    opts.claim = opts.random = opts.sort = false; // Idiot prevention (mostly me)
    const methodFindClosestBy = (opts.byPath || opts.all) ? "findClosestByPath" : "findClosestByRange";
    if (opts.debug)
        console.log("type=" + type + " opts" + JSON.stringify(opts) + " List=" + priority);
    const roomObjects = Game.rooms[this.roomName].find(type, opts);
    if (opts.debug)
        console.log("roomObjects=", roomObjects);
    if (!roomObjects.length)
        return;
    // Figuring out whether it's finding structures or resources
    const typeConst = roomObjects[0].resourceType ? "resourceType" : "structureType";
    if (opts.debug)
        console.log("typeConst=" + typeConst + " typeof=" + typeof typeConst);
    for (const element of priority) { // Loop through priority
        if (roomObjects.some(o => o[typeConst] === element)) {
            // Run filter only if it hit
            const oneType = roomObjects.filter(o => o[typeConst] === element);
            // Return the closest target
            const result = this[methodFindClosestBy](oneType) || this.findClosestByRange(oneType); // PROMLEMATIC
            if (opts.debug)
                console.log("oneType=" + oneType + " result=" + result);
            return result;
        }
    }
    return opts.strict ? undefined : roomObjects[~~(Math.random() * roomObjects.lengthS)];
};
/**
 * Generate a 32 bit hash from string. Used in Room.find()
 *
 * @see https://stackoverflow.com/a/7616484
 * @method hashCode
 * @param  {string} string The string to turn in hash code
 * @return {number} a hashcode, or 0 if the string is empty
 */
function hashCode(string) {
    let hash = 0, i, chr;
    if (string.length === 0)
        return hash;
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
;
