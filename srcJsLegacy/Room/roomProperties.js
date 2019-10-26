"use strict";
Object.defineProperties(Room.prototype, {
  global: {
    configurable: true,
    get: function() {
      if (_.isUndefined(global.rooms) || global.rooms === "undefined") {
        global.rooms = {};
      }
      if (!_.isObject(global.rooms)) {
        return undefined;
      }
      return global.rooms[this.name] = global.rooms[this.name] || {};
    },
    set: function(value) {
      if (_.isUndefined(global.rooms) || global.rooms === "undefined") {
        global.rooms = {};
      }
      if (!_.isObject(global.rooms)) {
        throw new Error("Could not set room global");
      }
      global.rooms[this.name] = value;
    }
  },
  /**
   * Defines a .mineral property for rooms that caches and gives you the mineral object for a room
   * @author Helam (ID: U1PCE23QF)
   * @see https://screeps.slack.com/files/U1PCE23QF/F3ZUNES6A/Room_mineral.js
   */
  mineral: {
    get: function() {
      if (this == Room.prototype || this == undefined)
        return undefined;
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
    },
    enumerable: false,
    configurable: true
  },
  /**
   * @see https://docs.screeps.com/contributed/modifying-prototypes.html#Memory-caching
   */
  source: {
    get: function() {
      // If we dont have the value stored locally
      if (!this._sources) {
        // If we dont have the value stored in memory
        if (!this.memory.sourceIds) {
          // Find the sources and store their id's in memory,
          // NOT the full objects
          this.memory.sourceIds = this.find(FIND_SOURCES)
            .map(source => source.id);
        }
        // Get the source objects from the id's in memory and store them locally
        this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id));
      }
      // return the locally stored value
      return this._sources;
    },
    set: function(newValue) {
      // when storing in memory you will want to change the setter
      // to set the memory value as well as the local value
      this.memory.sources = newValue.map(source => source.id);
      this._sources = newValue;
    },
    enumerable: false,
    configurable: true
  },
  type: {
    configurable: true,
    get: function() {
      if (!this.global.type) {
        this.global.type = roomName2Type(this.name);
      }
      return this.global.type;
    }
  },
  /**
   *
   */
  rcl: {
    configurable: true,
    get: function() {
      return (this.controller && this.controller.my) ? this.controller.level : 0
    }
  },
  /**
   * @return  {boolean}  Whether this room is my or reserved by me.
   */
  my: {
    configurable: true,
    get: function() {
      return this.type === "my" || this.type === "reserved"
    }
  },
  /**
   * Assign which OWNED room it belongs to
   * @example remote source/container
   * @return {Room || undefined} the home room this object belong to
   */
  home: {
    configurable: true,
    get: function() {
      let home = {};
      if (!this.memory.homeName || !this.memory.distanceToHome) {
        let closest = Infinity;
        let route = [];
        const myRooms = Object.values(Game.rooms)
          .filter(r => r.type === "my");
        for (const room of myRooms) {
          route = Game.map.findRoute(room.name, this.name, {
            routeCallback: roomName => (Memory.rooms[roomName] && Memory.rooms[roomName].type === "hostile") ? Infinity : 1
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
  },
  sourceSpace: {
    configurable: true,
    get: function() {
      if (!this.memory.sourceSpace) {
        this.memory.sourceSpace = this.find(FIND_SOURCES)
          .reduce((totalSpace, s) => totalSpace + s.freeSpace, 0);
      }
      return this.memory.sourceSpace;
    }
  },
  productionPerTick: {
    configurable: true,
    get: function() {
      if (!this._productionPerTick) {
        this._productionPerTick = _.sum(this.find(FIND_SOURCES), s => s.productionPerTick);
      }
      return this._productionPerTick;
    }
  },
  productivity: {
    configurable: true,
    get: function() {
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
  },
  efficiency: {
    configurable: true,
    get: function() {
      // body...
    }
  },
  refillData: { // need to rename & fix this monkey coding
    // everytime energyAvailable decrease
    configurable: true,
    get: function() {
      if (!this.memory.refillData) this.memory.refillData = [];
      while (this.memory.refillData.length > 10) this.memory.refillData.shift();
      return this.memory.refillData;
    },
    set: function(energyAvailable, time) {
      energyAvailable = energyAvailable || this.energyAvailable;
      time = time || Game.time;
      if (!this.memory.refillData) this.memory.refillData = [];
      this.memory.refillData.push([time, energyAvailable]);
    }
  }
});

Room.prototype.work = function() {}

/**
 * [area description]
 *
 * @param   {RoomPosition}  structure  [structure description]
 * @return  {[type]}             [return description]
 */
Room.prototype.area = function(pos) {
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

  if (pos.findInRange(FIND_SOURCES, 2)[0]) return "source" //stub
};


/**
 * TODO
 * Part(s) needed in order to preform such task
 *
 * @param   {string}  task  [task description]
 *
 * @return  {string[]}      an array of creep body part
 */
Room.prototype.task2Parts = function(task) {
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
Room.prototype.task2CreepType = function(task) {
  const rcl = this.rcl;
  // if (rcl === 1) return "";
  let creepType;
  if (task.action !== "boostCreep" && RoomObject.active(task.target)
    .structureType === STRUCTURE_LAB) return "Creep_of_Science";
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
function roomName2Type(roomName) {
  const room = Game.rooms[roomName];
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
    else if (room.controller.level > 0) return "hostile";
  }
  if (isHighwayRoom) return "highway";
  if (isCoreRoom) return "core";
  if (isSourceKeeperRoom) return "sourceKeeper";
  return "netural";
};
