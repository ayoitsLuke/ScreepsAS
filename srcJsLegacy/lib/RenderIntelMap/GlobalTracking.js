function globalInit() {
  Memory.GlobalID = Memory.GlobalID || 0
  let gid = (Memory.GlobalID++)
  Memory.globals = Memory.globals || {}
  Memory.globals[gid] = {
    id: gid,
    init: Date.now(),
    firstTick: Game.time
  }
  global.G = new Proxy({}, {
    get: (target, name) => Memory.globals[gid][name],
    set: (target, name, value) => Memory.globals[gid][name] = value
  })
  Object.keys(Memory.globals)
    .slice(0, -60)
    .forEach(k => delete Memory.globals[k])
}

function globalTick() {
  let now = Date.now()
  G.lastRun = now
  G.lastTick = Game.time
}
