import {CreepExtend} from "preload/Creep";

/*
## Better path finding

### Brief

Use `Game.map.findRoute()` for interroom traveling and `Pathfinder.search()` for intraroom moving.

1. Each room store 6 shortest exits to exits path(length) in memory.
2. Pass the exits2exits above to `routeCallback` funtion in `Game.map.findRoute(fromRoom, toRoom, {routeCallback: function(roomName, fromRoomName)})`
3. use PathFinder (or simply `moveTo()`) after the creep enter the room.

### Pseudocode

1.

```pseudo
room.init() {
    Pathfinder(EXIT_NORTH, EXIST_WEST);
    Pathfinder(EXIT_NORTH, EXIST_SOUTH);
    ...(N->W, N->S, N->E, W->S, W->E, S->E)
    room.memory.storeAbove
```

2.

```pseudo
creep.moveTo() {
    check destination
    check fatigue
    check range2dest
    check stored path room: true -> use, false -> get new
}
```

3.

```pseudo

```

*/
export class Explorer {
  exitSuffering = true; //Debug will this exist between ticks?
  public static explore(
    creep: Creep,
    destination: RoomPosition,
    options: ExploreOptions = {},
  ): ScreepsReturnCode {
    // Update Intel
    let errorCode = this.checkIntel(creep);
    if (errorCode) return errorCode;

    if (!destination) {
      return ERR_INVALID_ARGS;
    }

    if (creep.fatigue > 0) {
      Explorer.circle(creep.pos, "aqua", 0.3);
      return ERR_TIRED;
    }

    // TODO pull the path data from room.memory.intel
    if (creep.pos.roomName === destination.roomName) {
      return creep.moveTo(destination); // ! stud
    }
    Game.map.findRoute(creep.room, destination.roomName),
      {routeCallback: this.routeCallback};
    return OK;
  }

  private static routeCallback(roomName: string, fromRoomName: string): number {
    const fromRoomIntel = Memory.rooms[fromRoomName]?.intel;
    const roomIntel = Memory.rooms[roomName]?.intel;
    Game.map.findExit(fromRoomName, roomName);
    // TODO eg. room1 -> room2:
  }
  /**
   * Check intel
   * @param creep
   */
  public static checkIntel(creep: Creep) {
    const room = creep.room;
    if (!room) return ERR_INVALID_TARGET;
    if (
      !room.memory.intel ||
      room.memory.intel.owner.username !== room.controller?.owner.username ||
      Game.time > (room.memory.intel.intelExpirationTime || 0)
    ) {
      room.memory.intel = this.gatherIntel(room);
      // Pushing luck here. Label "avoid" only being attacked
      room.memory.intel.avoid = Boolean(
        creep.hits < creep.hitsMax &&
          room
            .getEventLog()
            .some(
              event =>
                event.event === EVENT_ATTACK || event.objectId === creep.id,
            ) &&
          room.controller?.owner.username &&
          room.controller?.owner.username !== MY_USERNAME &&
          room.controller?.owner.username !== "Invader",
      );
    }

    return OK;
  }
  /**
   * Gather intel of the room
   * @param room
   */
  public static gatherIntel(room: Room) {
    /** @const intelExpirationTime equals to: time now + rampart degrade time + RNG (0~600) */
    const intelExpirationTime =
      Game.time +
      (RAMPART_HITS_MAX[room.controller?.level || 2] || 300000) / 3 +
      Math.random() * CREEP_CLAIM_LIFE_TIME;

    /* Trim off unnecessary properties from sources, minerals, and structures */
    const sources = room.find(FIND_SOURCES);
    const mineral = room.find(FIND_MINERALS);

    const structures = [
      ...room.find(FIND_STRUCTURES),
      ...room.find(FIND_CONSTRUCTION_SITES),
    ];

    // TODO store shortest exit to exit path
    // Front search followed by back search to obtain the shortest path. isolate search function. path look up system.
    let tracks: any = {};
    [
      [FIND_EXIT_TOP, FIND_EXIT_RIGHT],
      [FIND_EXIT_TOP, FIND_EXIT_BOTTOM],
      [FIND_EXIT_TOP, FIND_EXIT_LEFT],
      [FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM],
      [FIND_EXIT_RIGHT, FIND_EXIT_LEFT],
      [FIND_EXIT_BOTTOM, FIND_EXIT_LEFT],
    ].forEach(exit => {
      tracks["" + exit[0] + exit[1]] = this.findShortestPathBetweenExits(
        room,
        exit[0],
        exit[1],
        {structures: structures},
      );
    });

    return {
      owner: {
        username: room.controller?.owner.username,
        level: room.controller?.level,
      },

      intelExpirationTime: ~~intelExpirationTime,
      sources: sources.map(({id, pos}) => ({
        /* Trim off other properties */
        id,
        pos,
      })),

      mineral: mineral.map(({id, pos, mineralType}) => ({
        /* Trim off other properties */
        id,
        pos,
        mineralType,
      })),

      structures: _.groupBy(
        structures.map(({id, pos, structureType}) => ({
          /* Trim off other properties */
          id,
          pos,
          structureType,
        })),
        "structureType",
      ),
      tracks,
    };
  }

  /**
   *
   */
  public static getTrack(room: Room, from: ExitConstant, to: ExitConstant) {
    if (!Memory.rooms[room.name]) return undefined;
    if (from < to) {
      return Memory.rooms[room.name].intel?.tracks["" + from + to];
    } else {
      return Memory.rooms[room.name].intel?.tracks["" + to + from].reverse;
    }
  }
  /**
   *
   * @param room
   * @param from
   * @param to
   * @param opts
   */
  public static findShortestPathBetweenExits(
    room: Room,
    from: ExitConstant,
    to: ExitConstant,
    opts?: any,
  ): RoomPosition[] {
    const exits: {[key: number]: RoomPosition[]} = {};
    [from, to].forEach(e => (exits[e] = room.find(e)));
    const rcb = this.roomCallback(room, {structures: opts.structures});
    let backwardPath = PathFinder.search(exits[to][0], exits[from], {
      maxRooms: 1,
      roomCallback: () => rcb,
    }).path;
    return PathFinder.search(backwardPath[backwardPath.length - 1], exits[to], {
      maxRooms: 1,
      roomCallback: () => rcb,
    }).path;
  }

  /**
   * Helper function to return current room's costMatrix
   * @param room
   * @param opts
   */
  private static roomCallback(room: Room, opts?: any) {
    // TODO Is there a cleaner way?
    const roadCost = 1;
    const plainCost = 2;
    const swampCost = 10;
    const wallCost = 0xff;

    // change terrain cost
    const terrain = room.getTerrain();
    let costs = new PathFinder.CostMatrix();
    let y = 50;
    while (y--) {
      let x = 50;
      while (x--) {
        switch (terrain.get(x, y)) {
          case TERRAIN_MASK_WALL:
            costs.set(x, y, wallCost);
            break;
          case TERRAIN_MASK_SWAMP:
            costs.set(x, y, swampCost);
            break;
          default:
            if (x === 0 || x === 49 || y === 0 || y === 49) {
              // Edge surfing
              costs.set(x, y, roadCost);
            } else {
              costs.set(x, y, plainCost);
            }
            break;
        }
      }
    }
    // set all structure/constructionSite. First set all structure to unwalkable. Then set container as plain. Follow by set road as road. Finally, if any rampart tiles are unwalkable
    const struct: {[key: string]: any[]} = _.groupBy(
      opts.structures,
      (s: Structure) => {
        switch (s.structureType) {
          case STRUCTURE_CONTAINER:
            return STRUCTURE_CONTAINER;
          case STRUCTURE_ROAD:
            return STRUCTURE_ROAD;
          case STRUCTURE_RAMPART:
            return STRUCTURE_RAMPART;
          default:
            return "unwalkable";
        }
      },
    );
    struct[STRUCTURE_ROAD].forEach(({pos}): void =>
      costs.set(pos.x, pos.y, roadCost),
    );
    struct["unwalkable"].forEach(({pos}): void =>
      costs.set(pos.x, pos.y, wallCost),
    );
    struct[STRUCTURE_RAMPART].forEach((r: StructureRampart): void =>
      r.my ? undefined : costs.set(r.pos.x, r.pos.y, wallCost),
    );
    return costs;
  }

  /**
   * draw a circle at position
   * @param pos
   * @param color
   * @param opacity
   */
  public static circle(
    pos: RoomPosition,
    color: string,
    opacity?: number,
  ): void {
    new RoomVisual(pos.roomName).circle(pos, {
      radius: 0.45,
      fill: "transparent",
      stroke: color,
      strokeWidth: 0.15,
      opacity: opacity,
    });
  }
}
Creep.prototype.explore = function(
  destination: RoomPosition | {pos: RoomPosition; id?: Id<any>},
  options?: GoToOption,
) {
  return Explorer.explore(this, destination, options);
};
