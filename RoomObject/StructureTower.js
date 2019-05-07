StructureTower.prototype.work = function() {
  if (this.room.memory.defcon < 4) {
    this.attack(this.room.find(FIND_HOSTILE_CREEPS)[0]);
    return;
  }
  if (OK === this.attack(this.room.find(FIND_HOSTILE_CREEPS, {
      filter: c => c.getActiveBodyparts(HEAL)
    })[0])) return;
  if (OK === this.attack(this.room.find(FIND_HOSTILE_CREEPS, {
      filter: c => c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK)
    })[0])) return;
  this.heal(this.room.find(FIND_MY_CREEPS, {
    filter: c => c.hits < c.hitsMax,
    random: true
  })[0]);
  if (this.energy > this.energyCapacity / Math.sqrt(this.room.memory.defcon) && !this.room.find(FIND_MY_CREEPS, {
      filter: c => c.memory.role === "repairer"
    })
    .length) {
    this.repair(this.room.find(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax - 800 && s.hits < 250000,
      cache: true,
      min: s => s && s.hits
    })[0]);
  }
};
