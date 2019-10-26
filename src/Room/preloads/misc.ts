class RoomExtend extends Room {

     _mineral: Mineral | undefined
    private _productionPerTick: number
    private _sources
     _productivity: number | undefined

  get  global(): any {
        if (!global.rooms) global.rooms = {};
        if (!global.rooms[this.name]) global.rooms[this.name] = {};
        return global.rooms[this.name];
    }

    /**
     * Defines a .mineral property for rooms that caches and gives you the mineral object for a room
     * @author Helam (ID: U1PCE23QF)
     * @see https://screeps.slack.com/files/U1PCE23QF/F3ZUNES6A/Room_mineral.js
     */
    get mineral(): Mineral {
        if (!this._mineral) {
            if (this.memory.mineralId === undefined) {
                let [mineral] = this.find(FIND_MINERALS);
                if (!mineral) {
                    return this.memory.mineralId = null;
                }
                this._mineral = mineral;
                this.memory.mineralId = mineral.id;
            } else {
                this._mineral = Game.getObjectById(this.memory.mineralId);
            }
        }
        return this._mineral;
    }


    /**
     * @see https://docs.screeps.com/contributed/modifying-prototypes.html#Memory-caching
     */
    get source(): Source[] {
        // If we dont have the value stored locally
        if (!this._sources) {
            // If we dont have the value stored in memory
            if (!this.memory.sourceIds) {
                // Find the sources and store their id's in memory,
                // NOT the full objects
                this.memory.sourceIds = this.find(FIND_SOURCES)
                    .map((source: Source): string => source.id);
            }
            // Get the source objects from the id's in memory and store them locally
            this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id));
        }
        // return the locally stored value
        return this._sources;
    }


    type(): string {
        if (!this.global.type) this.global.type = roomName2Type(this.name);
        return this.global.type;

    }


    /**
     *
     */
    rcl(): number {
        return (this.controller && this.controller.my) ? this.controller.level : 0;
    }


    /**
     * @return  {boolean}  Whether this room is my or reserved by me.
     */
    my(): boolean {
        return this.type === "my" || this.type === "reserved";
    }


    /**
     * Assign which OWNED room it belongs to
     * @example remote source/container
     * @return {Room || undefined} the home room this object belong to
     */
    get home(): Room {

        let home: Room;
        if (!this.memory.homeName || !this.memory.distanceToHome) {
            let closest = Infinity;
            let route: any;
            const myRooms = Object.values(Game.rooms)
                .filter(r => r.type === "my");
            for (const room of myRooms) {
                route = Game.map.findRoute(room.name, this.name, {
                    routeCallback: roomName => (Memory.rooms[roomName] && Memory.rooms[roomName].avoid) ? Infinity : 1
                });
                if (route.length < closest) {
                    closest = route.length;
                    home = room;
                }
            }
            this.memory.homeName = home.name;
            this.memory.distanceToHome = route.reduce((t, r) => t + /(^[WE]\d*[1-9]+[NS]\d*[1-3|7-9]+$)|(^[WE]\d*[1-3|7-9]+[NS]\d*[1-9]+$)/.test(r.room), 0); // count oonly controller rooms
        }
        home = Game.rooms[this.memory.homeName];
        if (home) {
            return Object.assign(home, {
                distance: this.memory.distanceToHome
            });
        } else {
            return this.memory.homeName = undefined;
        }
    }

    get sourceSpace(): number {
        if (!this.memory.sourceSpace) {
            this.memory.sourceSpace = this.find(FIND_SOURCES).reduce((totalSpace, s) => totalSpace + s.freeSpace, 0);
        }
        return this.memory.sourceSpace;
    }

    get productionPerTick(): number {
        if (!this._productionPerTick) {
            this._productionPerTick = _.sum(this.find(FIND_SOURCES), (s: Source) => s.productionPerTick);
        }
        return this._productionPerTick;
    }

    get productivity(): number {

        if (!this._productivity) {
            let prod = 0; // Production per tick
            let sc = 0; // Source count
            this.find(FIND_SOURCES)
                .forEach(s => {
                    prod += s.productivity;
                    sc++;
                });
            this._productivity = prod / sc;
        }
        return this._productivity;
    }


    /*
    efficiency: {
        configurable: true,
        get: function () {
    // body...
}


refillData: {
    // everytime energyAvailable decrease
    configurable: true,
    get: function () {
        if (!this.memory.refillData)
            this.memory.refillData = [];
        while (this.memory.refillData.length > 10)
            this.memory.refillData.shift();
        return this.memory.refillData;
    },
    set: function (energyAvailable, time) {
        energyAvailable = energyAvailable || this.energyAvailable;
        time = time || Game.time;
        if (!this.memory.refillData)
            this.memory.refillData = [];
        this.memory.refillData.push([time, energyAvailable]);
    }
}
*/

    /**
     * [area description]
     *
     * @param   {RoomPosition}  structure  [structure description]
     * @return  {[type]}             [return description]
     */
    Room.prototype.area = function (pos) {
        if (pos.pos)
            pos = pos.pos;
        // TODO get area via room planner
        /*
        1. room init: design layout & save to memory.roomPlan
        2. generate area via memory.roomPlan and save as polygon
        3. use a check inside function for such polygon
        IDEA: check inside of simple polygon: inside point always stay in the same side of each edge
        */
        // TODO Redirect room object area to here!!!
        // Info
        if (pos.findInRange(FIND_SOURCES, 2)[0])
            return "source"; //stub
    };
    /**
     * TODO
     * Part(s) needed in order to preform such task
     *
     * @param   {string}  task  [task description]
     *
     * @return  {string[]}      an array of creep body part
     */
    Room.prototype.task2Parts = function (task: Task): BodyPartConstant[] {
        const rcl = this.rcl;
        // if (rcl === 1) return "";
        let creepType;
        switch (task.action) {
            case "boostCreep":
            case "renewCreep":
            case "recycleCreep":
                creepType = "";
                break;
            case "reserveController":
                creepType = "Reserver";
                break;
            case "pull":
                creepType = "Hauler";
                break;
            case "withdraw":
            case "drop":
            case "pickup":
                creepType = "";
                break;
            case "harvest":
                if (task.resource.resourceType !== RESOURCE_ENERGY) {
                    creepType = "Constructor_s_lc";
                } else {
                    if (rcl <= 4) {
                        creepType = "Constructor_s_lc";
                    } else {
                        creepType = "Constructor_m_lc";
                    }
                }
                break;
            case "transfer":
                creepType = "Logistician_hc";
                break;
            case "upgradeController":
                if (rcl <= 4) {
                    creepType = "Constructor_m_hc";
                } else {
                    creepType = "Constructor_s_hc";
                }
                break;
            default:
                creepType = "";
                break;
        }
        return creepType;
        return Array.isArray(creepType) ? creepType : [creepType];
    };
    /**
     * TODO change creepType to "parts Needed for task"
     * Define which types of creep is responsible for which action
     *
     * @param   {[type]}  action  [action description]
     *
     * @return  {string}          [return description]
     */
    Room.prototype.task2CreepType = function (task: Task): string {
        const rcl = this.rcl;
        // if (rcl === 1) return "";
        let creepType;
        if (task.action !== "boostCreep" && RoomObject.active(task.target)
            .structureType === STRUCTURE_LAB)
            return "Creep_of_Science";
        switch (task.action) {
            case "boostCreep":
            case "renewCreep":
            case "recycleCreep":
                creepType = "";
                break;
            case "reserveController":
                creepType = "Reserver";
                break;
            case "pull":
                creepType = "Hauler";
                break;
            case "withdraw":
            case "drop":
            case "pickup":
                creepType = "";
                break;
            case "harvest":
                if (task.resource.resourceType !== RESOURCE_ENERGY) {
                    creepType = "Constructor_s";
                } else {
                    if (rcl <= 4) {
                        creepType = "Constructor_s";
                    } else {
                        creepType = "Constructor";
                    }
                }
                break;
            case "transfer":
                creepType = "Logistician_c";
                break;
            case "upgradeController":
                if (rcl <= 4) {
                    creepType = "Constructor_c";
                } else {
                    creepType = "Constructor_s_c";
                }
                break;
            default:
                creepType = "";
                break;
        }
        return creepType;
    };
/**
 * [roomType description]
 *
 * @param   {string}  [roomName]  The name of the room you want to know
 * @return  {string}  The type of this room
 */
export function roomName2Type(roomName: string): string {
    const room: Room = Game.rooms[roomName];
    /**
     * Get room type without visibility (with regex)
     * @author enrico (SlackID: U1Y068C6L)
     * @see https://screeps.slack.com/files/U1Y068C6L/F4AD5JJN7/get_room_type_without_visibility__but_regex___.js
     * @param {string}  roomName  The name of the room you want to know
     * @var  {boolean}  isHighwayRoom
     * @var  {boolean}  isCoreRoom
     * @var  {boolean}  isCenterRoom
     * @var  {boolean}  isSourceKeeperRoom
     * @var  {boolean}  isControllerRoom
     * enrico's snippet starts
     */
    let isHighwayRoom = /^[WE]\d*0[NS]\d*0$/.test(roomName);
    let isCoreRoom = /(^[WE]\d*5[NS]\d*5$)|(^[WE]\d*5[NS]\d*5$)/.test(roomName);
    // let isCenterRoom = /^[WE]\d*[4-6]+[NS]\d*[4-6]+$/.test(roomName); // = core room + sk rooms
    let isSourceKeeperRoom = /(^[WE]\d*[4-6][NS]\d*[4|6]$)|(^[WE]\d*[4|6][NS]\d*[4-6]$)/.test(roomName);
    let isControllerRoom = /(^[WE]\d*[1-9]+[NS]\d*[1-3|7-9]+$)|(^[WE]\d*[1-3|7-9]+[NS]\d*[1-9]+$)/.test(roomName);
    // enrico's snippet ends
    if (isControllerRoom && room) {
        if (room.controller.my)
            return "my";
        // else if (room.controller.reservation && this.controller.reservation.username === "ayoitsLuke") return "reserved";
        else if (room.controller.level > 0)
            return room.controller.owner.username;
    }
    if (isHighwayRoom)
        return "highway";
    if (isCoreRoom)
        return "core";
    if (isSourceKeeperRoom)
        return "sourceKeeper";
    return "netural";
};
Game.time
/**
  * [roomWork description]
  *
  * @param   {Room}  room  [room description]
  * @param   {Creep[]}  [creeps]  all the creeps belong to this room
  */
Room.prototype.work = function (creeps: Creep[]): void {
    const room: Room = this;
    creeps = creeps || Object.values(Game.creeps)
        .filter(c => c.home.name === room.home.name);
    room.find(FIND_TOMBSTONES)
        .forEach(t => {
            const task = t.creep.memory.task;
            if (!task)
                return;
            const target = Game.getObjectById(_.get(task, "target.id"));
            if (target) {
                target.memory.taskSent = undefined;
            }
            else {
                Memory.roomObjects[target.id].taskSent = undefined;
            }
        });
    if (DEBUG) console.log("[Room]", room.name);
    if (room.memory.type === "archive")
        return room.archive(); // TODO
    if (!room.memory.lastUpdate)
        room.memory.lastUpdate = {};
    // layout planning
    if (!room.memory.lastUpdate.init && room.type === "my") {
        room.memory.lastUpdate.init = Game.time;
        room.init();
    }
    // update intel
    if (DEBUG || (room.memory.lastUpdate.intel || 0) < Game.time - TIMER.intel) {
        room.memory.lastUpdate.intel = Game.time;
        room.intel();
    }
    // scan room
    if (DEBUG || (room.memory.lastUpdate.scan || 0) < Game.time - TIMER.scan) {
        room.memory.lastUpdate.scan = Game.time;
        // only scan room within expansion factor
        if (room.home.distance < ROOM_EXPAND_FACTOR[room.home.rcl]) {
            /*
            if (!room.home.memory.nearbySources) room.home.memory.nearbySources = [];
            room.find(FIND_SOURCES)
              .forEach(source => {
                if (!room.home.memory.nearbySources.some(ns => ns.id === source.id)) room.home.memory.nearbySources.push(source.simplify);
              });
            */
            // check defcon & warn home room if needed
            if (room.updateDefcon()
                .level < room.home.memory.defcon.level) {
                room.home.memory.defcon = room.memory.defcon;
            }
            ;
            // Get tasks from structures, sources, mineral
            if (room.type !== "hostile") {
                if (!room.home.memory.tasks)
                    room.home.memory.tasks = {};
                let newTasks = room.gatherRequests(room.home.memory.tasks);
                if (DEBUG)
                    console.log('newRequests', JSON.stringify(newTasks));
                const tasksGroup = _.groupBy(newTasks, t => t.creepType);
                for (const creepType in tasksGroup) {
                    if (DEBUG)
                        console.log("tasksGroup", creepType, JSON.stringify(_.countBy(tasksGroup[creepType], t => t.action)));
                    if (!room.home.memory.tasks[creepType]) {
                        room.home.memory.tasks[creepType] = [];
                    }
                    room.home.memory.tasks[creepType].push(...tasksGroup[creepType]);
                }
            }
            // ? TODO use room to assign task so creeps don't need to iterate task multiple time.
            // set spawn Queue
            if (room.spawns.length) {
                if (!room.memory.spawnQueue)
                    room.memory.spawnQueue = [];
                const nextCreep = room.memory.spawnQueue[0];
                if (nextCreep) {
                    // emergency spawns
                    if (!creeps.some(c => c.type === nextCreep.creepType)) {
                        nextCreep.urgent = true;
                    }
                }
                else {
                    if (room.memory.defcon.level < 4) {
                        // room.memory.spawnQueue.unshift(...room.getMilitaryQueue(room.memory.defcon))
                    }
                    else {
                        // TODO restructure, output {logisitan: -1, constructor_s_hc: 0, etc}
                        room.memory.spawnQueue.push(...room.getCivilianQueue(room.memory.tasks, creeps));
                    }
                }
                if (DEBUG)
                    console.log("spawnQueue: ", room.memory.spawnQueue.map(q => q.type));
            }
        }
    }
    _.invoke(room.find(FIND_MY_STRUCTURES), "work");
    // visualize
    room.hud(room, creeps);
}
/**
 * Create a list of tasks by checking each structures & constructure sites {@link src/RoomObject/Structure/structure.js}
 *
 * @param  {Object[]}  homeTasks current task, repeat push task prevention
 * @return  {Object[]}  A list of tasks
 */
import utils from "./lib/EngineUtils";
import { strict } from "assert";
import { string } from "lodash";
Room.prototype.gatherRequests = function (homeTasks: task): {} {
    let tasks = [];
    // find tombstone
    this.find(FIND_TOMBSTONES)
        .forEach(tombstone => {
            // TODO remove tasks in tombstone
            if (tombstone.memory.taskSent)
                return;
            Object.keys(tombstone.store)
                .forEach(r => tasks.push({
                    action: "withdraw",
                    target: tombstone.simplify,
                    resource: {
                        resourceType: r,
                        amount: tombstone.store[r],
                    },
                    urgent: true,
                }));
            tombstone.memory.taskSent = Game.time;
        });
    // Find dropped resources
    this.find(FIND_DROPPED_RESOURCES)
        .forEach(resource => {
            if (resource.memory.taskSent /* || resource.amount < 50 */)
                return;
            tasks.push({
                action: "pickup",
                resource: {
                    resourceType: resource.resourceType,
                    amount: resource.amount
                },
                target: resource.simplify,
                urgent: true,
            });
            resource.memory.taskSent = Game.time;
        });
    // Find each structures & generate a "transfer" request
    this.find(FIND_STRUCTURES) // FIXME task leak
        .forEach(structure => {
            if (structure.memory.taskSent)
                return;
            const request = structure.generateRequests();
            if (request.length) {
                tasks.push(...request);
                structure.memory.taskSent = Game.time;
            }
        });
    // Find each sources & generate a "harvest" request
    this.find(FIND_SOURCES_ACTIVE)
        .forEach(source => {
            if (source.memory.taskSent)
                return;
            const creeps = source.pos.findInRange(FIND_MY_CREEPS, 1);
            // const creepCount = creeps.length;
            // const workCount = creeps.reduce((t, c) => t + c.getActiveBodyparts(WORK), 0);
            if (creeps.length < source.freeSpace && creeps.reduce((t, c) => t + utils.calcBodyEffectiveness(c.body, WORK, "harvest", HARVEST_POWER), 0) < source.energy / (source.ticksToRegeneration || ENERGY_REGEN_TIME)) { // FIXME use util.calcEffectiveness here
                tasks.push({
                    action: "harvest",
                    resource: {
                        resourceType: RESOURCE_ENERGY,
                    },
                    target: source.simplify,
                    time: Game.time,
                    urgent: (this.rcl && !creeps.length)
                });
                source.memory.taskSent = Game.time;
            }
        });
    //Find each construction site & generate a "build" request
    if (this.home.rcl > 1) {
        this.find(FIND_MY_CONSTRUCTION_SITES)
            .forEach(site => {
                if (site.memory.taskSent)
                    return;
                tasks.push({
                    action: "build",
                    resource: {
                        resourceType: RESOURCE_ENERGY,
                    },
                    target: site.simplify,
                    time: Game.time,
                    urgent: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].some(c => c === site.structureType)
                });
                site.memory.taskSent = Game.time;
            });
    }
    for (let t of tasks) {
        if (!t.creepType)
            t.creepType = this.home.task2CreepType(t);
    }
    return tasks;
};
/**
 *
 *
 * @return  {[type]}  [return description]
 */
function selfDestruct() {
    if (!this.find(FIND_MY_SPAWNS)
        .length) {
        Memory.BURN = this.name + Game.time;
        this.terminal.destroy();
        this.storage.destroy();
        this.find(FIND_MY_CREEPS)
            .forEach(c => c.say("Congrates! U win!"));
    }
}
    }
