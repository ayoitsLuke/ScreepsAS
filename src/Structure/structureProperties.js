Object.defineProperties(Structure.prototype, {
  area: {
    configurable: true,
    get: function() { // TODO redirect to room.memory.intel
      //stub
      if (this.pos.inRangeToRoomObject(this.room.controller, 4)) return "controller";
      if (this.pos.findInRange(FIND_SOURCES, 2)[0]) return "source";
      if (this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_EXTENSION
        })[0]) return "outpost";
      if (this.pos.findInRange(FIND_MINERALS, 1)[0]) return "mineral";
    }
  }
});
/**
 * Check sturcuture's status and generate a list of requestss
 *
 * @return {Object[]}
 */
Structure.prototype.generateRequests = function() {
  if (this.memory.requestsSent) return [];
  let requests = [];
  switch (this.structureType) {
    case STRUCTURE_CONTROLLER:
      if (this.sign && this.sign.username !== MY_USERNAME) {
        requests.push({
          action: "signController",
          resource: {
            resourceType: _.sample(sign)
          }
        })
      }
      if (this.room.type === "my" && (this.level < 8 || this.ticksToDowngrade < CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD)) requests.push({
        action: "upgradeController",
        resource: {
          resourceType: RESOURCE_ENERGY,
        },
        urgent: this.ticksToDowngrade < CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD
      });
      if (this.room.type === "netural" && this.home.distance <= ROOM_EXPAND_FACTOR[this.home.rcl]) {
        requests.push(newRequest("reserveController"));
      }
      break;

    case STRUCTURE_SPAWN:
    case STRUCTURE_EXTENSION:
    case STRUCTURE_TOWER:
      if (this.energyCapacity - this.energy) requests.push({
        action: "transfer",
        resource: {
          resourceType: RESOURCE_ENERGY,
          amount: this.energyCapacity - this.energy
        },
        target: this.simplify,
        time: Game.time,
        urgent: true
      });
      break;

    case STRUCTURE_LINK: // No need unless war time
      if (this.area !== "source" && this.area !== "controller" && this.energyCapacity - this.energy) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_ENERGY,
        // amount: this.energyCapacity - this.energy
      }));
      break;
    case STRUCTURE_STORAGE:
    case STRUCTURE_TERMINAL:
      // TODO secondary requests, excess resource goes here
      if (this.store.energy < 10000) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_ENERGY
      }))
      break;

    case STRUCTURE_RAMPART:
    case STRUCTURE_WALL:
      if (this.hits < ATTACK_POWER * MAX_CREEP_SIZE
        /* this.hitsMax - this.hits > this.home.spawns[0].getBodyFor("Constructor_m_hc")
               .reduce((t, p) => t + (p === WORK), 0)*/
      ) {
        requests.push({
          action: "repair",
          resource: {
            resourceType: RESOURCE_ENERGY,
            // amount: (this.hitsMax - this.hits) * REPAIR_COST,
          },
          urgent: this.hits < ATTACK_POWER * MAX_CREEP_SIZE
        });
      }
      break;
      // TODO secondary requests, excess resource goes here

    case STRUCTURE_CONTAINER: // FIXME seems not able to push withdraw task to room.task
      if ((this.area === "source" || this.area === "mineral") && _.sum(this.store)) {
        this.memory.debug = this.store;
        Object.keys(this.store)
          .forEach(r => {
            requests.push(newRequest("withdraw", {
              resourceType: r,
              // amount: this.store[r],
            }))
          });
      } else if (this.area === "controller" && _.sum(this.store) < this.storeCapacity) {
        requests.push(newRequest("transfer", {
          resourceType: r,
          // amount: this.storeCapacity - _.sum(this.store),
        }))
      };
      if (this.hitsMax - this.hits > this.home.spawns[0].getBodyFor("Constructor_m_hc")
        .reduce((t, p) => t + (p === WORK), 0)) {
        requests.push({
          action: "repair",
          resource: {
            resourceType: RESOURCE_ENERGY,
            // amount: (this.hitsMax - this.hits) * REPAIR_COST,
          },
          urgent: (this.hits / this.hitsMax < 0.1)
        });
      }
      break;

      // case STRUCTURE_ROAD:
      if (this.hitsMax - this.hits > this.home.spawns[0].getBodyFor("Constructor_m_hc")
        .reduce((t, p) => t + (p === WORK), 0)) {
        requests.push({
          action: "repair",
          resource: {
            resourceType: RESOURCE_ENERGY,
            // amount: (this.hitsMax - this.hits) * REPAIR_COST,
          },
          urgent: (this.hits / this.hitsMax < 0.1)
        });
      }
      break;

    case STRUCTURE_KEEPER_LAIR:
      // TODO Spawn military creep when it's about respawn
      break;
    case STRUCTURE_POWER_BANK:
      if (this.hits < (50 * this.home.distance + ATTACK_POWER * MAX_CREEP_SIZE)) {}
      // TODO Let military do this instead of civillian creeps
      break;

    case STRUCTURE_POWER_SPAWN:
      if (this.energyCapacity - this.energy) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_ENERGY,
        amount: this.energyCapacity - this.energy
      }));
      if (this.powerCapacity - this.power) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_POWER,
        amount: this.powerCapacity - this.power
      }));
      break;
    case STRUCTURE_NUKER:
      if (this.energyCapacity - this.energy) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_ENERGY,
        amount: this.energyCapacity - this.energy
      }));
      if (this.ghodiumCapacity - this.ghodium) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_GHODIUM,
        amount: this.ghodiumCapacity - this.ghodium
      }));
      break;
    case STRUCTURE_LAB:
      // TODO let creepOfScience handle this
      if (this.energyCapacity - this.energy) requests.push(newRequest("transfer", {
        resourceType: RESOURCE_ENERGY,
        amount: this.energyCapacity - this.energy
      }));
      break;

    case STRUCTURE_EXTRACTOR:
      const mineral = this.pos.lookFor(LOOK_MINERALS)[0];
      if (mineral && mineral.freeSpace < this.pos.findInRange(FIND_MY_CREEPS, 1)
        .length) {
        requests.push({
          action: "harvest",
          target: mineral.simplify,
          resource: {
            resourceType: mineral.mineralType
          }
        });
      }
      break;

    case STRUCTURE_OBSERVER: // No need
      break;
    case STRUCTURE_PORTAL: // No need
      break;
    default:
      break;
  }
  requests.forEach(r => {
    if (!r.target) r.target = this.simplify;
    if (!r.time) r.time = Game.time
  }); // ! DEGUG
  return requests;
};
/**
 * A helper function for Structure.prototype.generateRequest(). It convert creep's method to an object.
 *
 * @param   {string}  action
 * @param   {object}  [resource={}]
 * @param   {string}  [resource.resourceType]
 * @param   {number}  [resource.amount]
 */
function newRequest(action, resource) {
  return {
    action,
    resource: resource || {},
    time: Game.time,
  };
}
/**
 * A helper function to feed the `routeCallback` option of [Game.map.findRoute()]{@link https://github.com/screeps/engine/blob/212ca299d6f24f2bcc88f1dcf1861b958fc32645/src/game/map.js#L64}
 * @see https://docs.screeps.com/api/#Game.map.findRoute
 *
 * @param   {string}  roomName      [roomName description]
 * @param   {string}  [fromRoomName]  [fromRoomName description]
 *
 * @return  {number}                The cost of each tile
 */
function preferHighwayAndOwned(roomName, fromRoomName) {
  let roomMemory = Memory.rooms[roomName];
  if (!roomMemory) return 1;
  switch (roomMemory.type) {
    case "hostile":
      return Infinity;
    case "highway":
    case "my":
      return 1;
    default:
      return 1.5;
  }
};
