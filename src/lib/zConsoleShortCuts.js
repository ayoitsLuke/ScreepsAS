if (Game.profiler) {
    global.p = Game.profiler;
    global.o = Game.profiler.output;
    global.rb = function () {
        Game.profiler.reset();
        Game.profiler.background();
    };
}
// credit due for next line to warinternal
global.ex = (x) => JSON.stringify(x, null, 2);
global.g = {
    c: global.gc = Game.creeps,
    f: global.gf = Game.flags,
    s: global.gs = Game.spawns,
    r: global.gr = Game.rooms,
    m: global.gm = Game.market,
};
global.goid = Game.getObjectById;
global.r = function r(rName) { return gr[rName]; };
global.total = function () {
    return Object.keys(Game.creeps).length;
};
global.LOGGING_ENABLED = true;
global.logging = function (bool) { global.LOGGING_ENABLED = bool; };
global.log = {
    log: function log(arg) { if (global.LOGGING_ENABLED)
        return console.log(arg); },
    warn: function warn(arg) { if (global.LOGGING_ENABLED)
        return console.log('<span style=color:#FFBF3F>' + arg + '</span>'); },
    err: function err(arg) { if (global.LOGGING_ENABLED)
        return console.log('<span style=color:#D18F98>' + arg + '</span>'); },
    error: function error(arg) { if (global.LOGGING_ENABLED)
        return console.log('<span style=color:#D18F98>' + arg + '</span>'); },
};
global.role = function (t) {
    for (var r2 in Game.rooms) {
        var r = Game.rooms[r2];
        console.log(r.name + ' ' + r.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role == t }));
    }
};
// to be used after you respawn into a new location
//   but before you spawn your first creep...
global.respawn = function () {
    for (let f in Game.flags) {
        Game.flags[f].remove();
    }
    Memory = {};
    RawMemory.set("");
};
global.errName = function (err) {
    switch (err) {
        case OK: return 'OK';
        case ERR_NOT_OWNER: return 'ERR_NOT_OWNER';
        case ERR_NO_PATH: return 'ERR_NO_PATH';
        case ERR_NAME_EXISTS: return 'ERR_NAME_EXISTS';
        case ERR_BUSY: return 'ERR_BUSY';
        case ERR_NOT_FOUND: return 'ERR_NOT_FOUND';
        case ERR_NOT_ENOUGH_RESOURCES: return 'ERR_NOT_ENOUGH_ENERGY/ERR_NOT_ENOUGH_RESOURCES/ERR_NOT_ENOUGH_EXTENSIONS';
        case ERR_INVALID_TARGET: return 'ERR_INVALID_TARGET';
        case ERR_FULL: return 'ERR_FULL';
        case ERR_NOT_IN_RANGE: return 'ERR_NOT_IN_RANGE';
        case ERR_INVALID_ARGS: return 'ERR_INVALID_ARGS';
        case ERR_TIRED: return 'ERR_TIRED';
        case ERR_NO_BODYPART: return 'ERR_NO_BODYPART';
        case ERR_RCL_NOT_ENOUGH: return 'ERR_RCL_NOT_ENOUGH';
        case ERR_GCL_NOT_ENOUGH: return 'ERR_GCL_NOT_ENOUGH';
        default: return '';
    }
};
// Courtesy of proximo, Dec 9 2016
global.REVERSE_DIR = {
    [TOP]: BOTTOM,
    [TOP_RIGHT]: BOTTOM_LEFT,
    [RIGHT]: LEFT,
    [BOTTOM_RIGHT]: TOP_LEFT,
    [BOTTOM]: TOP,
    [BOTTOM_LEFT]: TOP_RIGHT,
    [LEFT]: RIGHT,
    [TOP_LEFT]: BOTTOM_RIGHT
};
