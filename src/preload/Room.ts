export class RoomExtend extends Room {
  private _mineral: Mineral | undefined;
  private _productionPerTick: number | undefined;
  private _sources: Source[];
  private _productivity: number | undefined;

  get global(): Object {
    if (!global.rooms) global.rooms = {};
    if (!global.rooms[this.name]) global.rooms[this.name] = {};
    return global.rooms[this.name];
  }

  /**
   * Assign which OWNED room it belongs to
   * @example remote source/container
   * @return {Room} the home room this object belong to
   */
  get home(): Room {
    let home: Room;
    if (!this.memory.homeName || !this.memory.distanceToHome) {
      let closest = Infinity;
      let route: any;
      const myRooms = Object.values(Game.rooms).filter(r => r.owner === MY_USERNAME);
      for (const room of myRooms) {
        route = Game.map.findRoute(room.name, this.name, {
          routeCallback: roomName => (Memory.rooms[roomName] && Memory.rooms[roomName].avoid ? Infinity : 1),
        });
        if (route.length < closest) {
          closest = route.length;
          home = room;
        }
      }
      this.memory.homeName = home.name;
      this.memory.distanceToHome = route.reduce(
        (t, r) => t + /(^[WE]\d*[1-9]+[NS]\d*[1-3|7-9]+$)|(^[WE]\d*[1-3|7-9]+[NS]\d*[1-9]+$)/.test(r.room),
        0,
      ); // count only controller rooms
    }
    home = Game.rooms[this.memory.homeName];
    if (home) {
      return Object.assign(home, {
        distance: this.memory.distanceToHome,
      });
    } else {
      return (this.memory.homeName = undefined);
    }
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
          return (this.memory.mineralId = null);
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
        this.memory.sourceIds = this.find(FIND_SOURCES).map((source: Source): string => source.id);
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
    return this.controller && this.controller.my ? this.controller.level : 0;
  }

  /**
   * @return  {boolean}  Whether this room is my or reserved by me.
   */
  get my(): boolean {
    return this.type === "my" || this.type === "reserved";
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
      this.find(FIND_SOURCES).forEach(s => {
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
  get area(pos: RoomPosition | { pos: RoomPosition }) {
    if (pos.pos) pos = pos.pos;
    // TODO get area via room planner
    /*
     1. room init: design layout & save to memory.roomPlan
     2. generate area via memory.roomPlan and save as polygon
     3. use a check inside function for such polygon
     IDEA: check inside of simple polygon: inside point always stay in the same side of each edge
     */
    // TODO Redirect room object area to here!!!
    // Info
    if (pos.findInRange(FIND_SOURCES, 2)[0]) return "source"; //stub
  }

  /**
   * TODO
   * Part(s) needed in order to preform such task
   *
   * @param   {string}  task  [task description]
   *
   * @return  {string[]}      an array of creep body part
   */
  task2Parts(task: Task): string {
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
  }

  /**
   * TODO change creepType to "parts Needed for task"
   * Define which types of creep is responsible for which action
   *
   * @param   {[type]}  action  [action description]
   *
   * @return  {string}          [return description]
   */
  task2CreepType(task: Task): string {
    const rcl = this.rcl;
    // if (rcl === 1) return "";
    let creepType;
    if (task.action !== "boostCreep" && RoomObject.active(task.target).structureType === STRUCTURE_LAB)
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
  }

  /**
   * [roomType description]
   *
   * @param   {string}  [roomName]  The name of the room you want to know
   * @return  {string}  The type of this room
   */
  roomName2Type(roomName: string): string {
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
      if (room.controller.my) return "my";
      // else if (room.controller.reservation && this.controller.reservation.username === "ayoitsLuke") return "reserved";
      else if (room.controller.level > 0) return room.controller.owner.username;
    }
    if (isHighwayRoom) return "highway";
    if (isCoreRoom) return "core";
    if (isSourceKeeperRoom) return "sourceKeeper";
    return "netural";
  }

  /**
   * Create a list of tasks by checking each structures & constructure sites {@link src/RoomObject/Structure/structure.js}
   *
   * @param  {Object[]}  homeTasks current task, repeat push task prevention
   * @return  {Object[]}  A list of tasks
   */
  gatherRequests(homeTasks: task): {} {
    let tasks = [];
    // find tombstone
    this.find(FIND_TOMBSTONES).forEach(tombstone => {
      // TODO remove tasks in tombstone
      if (tombstone.memory.taskSent) return;
      Object.keys(tombstone.store).forEach(r =>
        tasks.push({
          action: "withdraw",
          target: tombstone.simplify,
          resource: {
            resourceType: r,
            amount: tombstone.store[r],
          },
          urgent: true,
        }),
      );
      tombstone.memory.taskSent = Game.time;
    });
    // Find dropped resources
    this.find(FIND_DROPPED_RESOURCES).forEach(resource => {
      if (resource.memory.taskSent /* || resource.amount < 50 */) return;
      tasks.push({
        action: "pickup",
        resource: {
          resourceType: resource.resourceType,
          amount: resource.amount,
        },
        target: resource.simplify,
        urgent: true,
      });
      resource.memory.taskSent = Game.time;
    });
    // Find each structures & generate a "transfer" request
    this.find(FIND_STRUCTURES) // FIXME task leak
      .forEach(structure => {
        if (structure.memory.taskSent) return;
        const request = structure.generateRequests();
        if (request.length) {
          tasks.push(...request);
          structure.memory.taskSent = Game.time;
        }
      });
    // Find each sources & generate a "harvest" request
    this.find(FIND_SOURCES_ACTIVE).forEach(source => {
      if (source.memory.taskSent) return;
      const creeps = source.pos.findInRange(FIND_MY_CREEPS, 1);
      // const creepCount = creeps.length;
      // const workCount = creeps.reduce((t, c) => t + c.getActiveBodyparts(WORK), 0);
      if (
        creeps.length < source.freeSpace &&
        creeps.reduce((t, c) => t + utils.calcBodyEffectiveness(c.body, WORK, "harvest", HARVEST_POWER), 0) <
          source.energy / (source.ticksToRegeneration || ENERGY_REGEN_TIME)
      ) {
        // FIXME use util.calcEffectiveness here
        tasks.push({
          action: "harvest",
          resource: {
            resourceType: RESOURCE_ENERGY,
          },
          target: source.simplify,
          time: Game.time,
          urgent: this.rcl && !creeps.length,
        });
        source.memory.taskSent = Game.time;
      }
    });
    //Find each construction site & generate a "build" request
    if (this.home.rcl > 1) {
      this.find(FIND_MY_CONSTRUCTION_SITES).forEach(site => {
        if (site.memory.taskSent) return;
        tasks.push({
          action: "build",
          resource: {
            resourceType: RESOURCE_ENERGY,
          },
          target: site.simplify,
          time: Game.time,
          urgent: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].some(c => c === site.structureType),
        });
        site.memory.taskSent = Game.time;
      });
    }
    for (let t of tasks) {
      if (!t.creepType) t.creepType = this.home.task2CreepType(t);
    }
    return tasks;
  }
  /**
   *
   *
   * @return  {[type]}  [return description]
   */
  selfDestruct() {
    if (!this.find(FIND_MY_SPAWNS).length) {
      Memory.BURN = this.name + Game.time;
      this.terminal.destroy();
      this.storage.destroy();
      this.find(FIND_MY_CREEPS).forEach(c => c.say("Congrates! U win!"));
    }
  }
}
