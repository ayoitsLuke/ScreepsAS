"use strict";
/**
 * Check current room's defcon. Update or send to home room if needed
 *
 * DEFCON level - {Trigger condition}: [Defense protocol]
 * 5 - Peace: No action
 * 4 - Civilian hostile creeps spotted: No action.
 * 3 - Armed hostile creeps spotted: Military creeps spawning, grouping, & sending to corresponding location.
 * 2 - Armed hostile creeps entering reserved rooms: Add owner to Memory.enemyList, prepare for nuke.
 * 1 - Nuke incoming: Build ramparts to cover high-priority sturctures in landing location. Creeps evacuate before nuke lands.
 *
 * @return  {Object}  current defcon
 */
Room.prototype.updateDefcon = function() {
  if (!this.memory.defcon) this.memory.defcon = {
    level: 5,
    issued: Game.time
  };
  const hostileCreeps = this.find(FIND_HOSTILE_CREEPS);
  const level = this.find(FIND_NUKES)[0] ? 1 :
    (this.controller && this.controller.reservation && this.controller.reservation.username === global.MY_USERNAME && this.find(FIND_HOSTILE_CREEPS)[0]) ? 2 :
    hostileCreeps.some(c => c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK)) ? 3 :
    hostileCreeps[0] ? 4 :
    5;
  if (level < this.memory.defcon.level || !(this.memory.defcon.issued > Game.time - TIMER.defconDowngrade)) {
    // current defcon level is more servere, or timer expired
    this.memory.defcon = {
      level,
      issued: Game.time
    };
  }
  return this.memory.defcon;
}
