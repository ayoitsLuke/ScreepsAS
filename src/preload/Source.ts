export class SourceExtend extends Source {
  get freeSpace(): number {
    if (!this.memory.freeSpace) {
      let freeSpace = 0;
      const roomTerrain = Game.map.getRoomTerrain(this.room.name);
      [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
        [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
          if (
            roomTerrain.get(x, y) !== TERRAIN_MASK_WALL ||
            new RoomPosition(x, y, this.room.name).lookFor(LOOK_STRUCTURES)[0]
          )
            freeSpace++;
        }, this);
      }, this);
      this.memory.freeSpace = freeSpace;
    }
    return this.memory.freeSpace;
  }

  get productionPerTick(): number {
    if (!this.global.productionPerTick) {
      this._productionPerTick =
        (this.energyCapacity - this.energy) /
        (ENERGY_REGEN_TIME - (this.ticksToRegeneration ? this.ticksToRegeneration : 0));
    }
    return this.global.productionPerTick;
  }

  get productivity(): number {
    if (!this.global.productivity) {
      this.global.productivity = this.productionPerTick / (this.energyCapacity / ENERGY_REGEN_TIME);
    }
    return this.global.productivity;
  }

  get container(): StructureContainer {
    if (!this.global.container) {
      const container =
        this.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_CONTAINER,
        })[0] ||
        this.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
          filter: c => c.structureType === STRUCTURE_CONTAINER,
        })[0];
      if (container) {
        this.global.container = container.simplify;
      } else {
        // FIXME Room.planRoad(this.pos, this.home.controller,{range:3});
        const path = this.pos.findPathTo(this.room.controller, {
          range: 3,
          ignoreCreeps: true,
          ignoreDestructibleStructures: true,
          ignoreRoads: true,
          swampCost: 1,
        });
        if (path[0]) this.room.createConstructionSite(path[0].x, path[0].y, STRUCTURE_CONTAINER);
        return;
      }
    }
    return RoomObject.active(this.global.container);
  }

  get link(): StructureLink {
    if (this.room.controller && this.room.controller.my && this.room.controller.level < 5) return;
    if (!this.memory.link) {
      const link =
        this.pos.findInRange(FIND_MY_STRUCTURES, 2, {
          filter: s => s.structureType === STRUCTURE_LINK,
        })[0] ||
        this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2, {
          filter: c => c.structureType === STRUCTURE_LINK,
        })[0];
      if (link) {
        this.memory.link = link.simplify;
      } else {
        const path = this.pos.findPathTo(this.room.controller, {
          range: 3,
          ignoreCreeps: true,
          ignoreDestructibleStructures: true,
          ignoreRoads: true,
          maxRooms: 1,
          swampCost: 1,
        });
        if (path[1]) this.room.createConstructionSite(path[1].x, path[1].y, STRUCTURE_LINK);
        return;
      }
    }
    return RoomObject.active(this.memory.link);
  }

  get warehouse(): StructureLink | StructureContainer {
    return this.link || this.container;
  }
}
