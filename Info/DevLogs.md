# TODO

Covert code to ts

understand pathfinder for `findRoute`

# Ideas

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

## Task System

### Brief

1. Each room irettrate structures/sources/minerals/powerbank/hostileCreeps to generate tasks
2. Send tasks above to it's nearest home room
3. Classify each task to creep types
4. Store them as creep type
5. Look for free creeps & assign task to corresponding creep

### Exception handling

Creep die before task finished:

```js
creep.memory.task = _.some(home.memory.tasks)
home.memory.tasks.porcessing = {id: creep.id, time: Game.time}
```

Task repeated. (store strucuture's id)

Old task, no creep's getting (spawn) corresond creep

### Comments

# Reminder

```js
false === Object.values(Game.structures).some(s =>
    s.structureType === STRUCTURE_CONTAINER ||
    s.structureType === STRUCTURE_ROAD ||
    s.structureType === STRUCTURE_RAMPART ||
    s.structureType === STRUCTURE_WALL)
```

`Game.constructionSite` include construction sites without vision. Those sites has `.pos` (RoomPosition) but no `.room`

# Source code understanding

## Creep.moveTo

-> `RoomPosition.findPathTo()`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/creeps.js#L289

-> `Room.findPath()`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/rooms.js#L1364

-> local function `_findPath2()`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/rooms.js#L840

-> `globals.PathFinder.search()`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/rooms.js#L268

-> `_globals`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/rooms.js#L381

Because `driver = utils.getRuntimeDriver()`, globals might relate to `driver`. Goto "engine/src/utils" to see what is `getRuntimeDriver()`
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/game/rooms.js#L3

`utils.getRuntimeDriver()` redirect to "~runtime-driver", use this as keyword search in all screeps repo
https://github.com/screeps/engine/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/src/utils.js#L35

Found, alias for "./lib/runtime/runtime-driver"
https://github.com/screeps/driver/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/webpack.config.js#L13

"./lib/runtime/runtime-driver" redirects to `mod`. source code should be in the same repo
https://github.com/screeps/driver/blob/3b90d7f3f1318942298ce9d6f0cdee9ee30a9627/lib/path-finder.js#L133

Source code found:
https://github.com/screeps/driver/blob/master/native/src/main.cc

## etc

# Misc
