class ControllerExtend extends StructureController {
  get link() {
    if (this.room.controller && this.room.controller.my && this.room.controller.level < 5) return;
    if (!this.global.link) {
      const link =
        this.pos.findInRange(FIND_MY_STRUCTURES, 2, {
          filter: s => s.structureType === STRUCTURE_LINK,
        })[0] ||
        this.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2, {
          filter: c => c.structureType === STRUCTURE_LINK,
        })[0];
      if (link) {
        this.global.link = link.simplify;
      } else {
        const pos = this.pos.findPathTo(_.sample(this.room.sources).link, {
          range: 1,
          ignoreCreeps: true,
          ignoreDestructibleStructures: true,
          ignoreRoads: true,
          maxRooms: 1,
          swampCost: 1,
        })[2];
        if (pos) this.room.createConstructionSite(pos.x, pos.y, STRUCTURE_LINK);
        return;
      }
    }
    return RoomObject.active(this.global.link);
  }
}
