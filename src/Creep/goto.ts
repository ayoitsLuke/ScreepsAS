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
