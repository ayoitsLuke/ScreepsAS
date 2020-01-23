function getCostMatrix(room) {
    const cost = new PathFinder.CostMatrix()
    const terrain = Game.map.getRoomTerrain(room.name)

    for(let x = 0 ; x <= 50 ; x++) {
        for(let y = 0 ; y <= 50 ; y++) {
            const t = terrain.get(x, y)
            if(t == TERRAIN_MASK_WALL) {
                cost.set(x, y, 0xff)
            }else if(t == TERRAIN_MASK_SWAMP) {
                cost.set(x, y, 10)
            }else {
                cost.set(x, y, 2)
            }
        }
    }

    const impassibleStructures = [];
    for (const structure of room.find(FIND_STRUCTURES)) {
        if (structure instanceof StructureRampart) {
            if (!structure.my && !structure.isPublic) {
                impassibleStructures.push(structure);
            }
        }else if (structure instanceof StructureRoad) {
            cost.set(structure.pos.x, structure.pos.y, 1);
        }else if (structure instanceof StructureContainer) {
            cost.set(structure.pos.x, structure.pos.y, 5);
        } else {
            impassibleStructures.push(structure);
        }
    }
    for (const site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
        if (site.structureType === STRUCTURE_CONTAINER || site.structureType === STRUCTURE_ROAD
            || site.structureType === STRUCTURE_RAMPART) {
            continue;
        }
        cost.set(site.pos.x, site.pos.y, 0xff);
    }
    for (let structure of impassibleStructures) {
        cost.set(structure.pos.x, structure.pos.y, 0xff);
    }

    return cost
}

/**
 * Generates a direction matrix to the target RoomPosition
 * @param {RoomPosition} target
 * @param {Object} opts
 * @param {int} [opts.range]
 * @returns {PathFinder.CostMatrix}
 */
global.generateDirectionMatrix = function(target, opts) {
    _.defaults(opts, {
        range: 1,
    })
    const room = Game.rooms[target.roomName]
    const costMatrix = getCostMatrix(room)
    const matrix = new PathFinder.CostMatrix()
    const getNeighbors = function(tile) {
        const cost = tile.cost + costMatrix.get(tile.x, tile.y)
        const neighbors = [
            {x: tile.x  , y: tile.y+1, cost, dir: 1},
            {x: tile.x-1, y: tile.y+1, cost, dir: 2},
            {x: tile.x-1, y: tile.y  , cost, dir: 3},
            {x: tile.x-1, y: tile.y-1, cost, dir: 4},
            {x: tile.x  , y: tile.y-1, cost, dir: 5},
            {x: tile.x+1, y: tile.y-1, cost, dir: 6},
            {x: tile.x+1, y: tile.y  , cost, dir: 7},
            {x: tile.x+1, y: tile.y+1, cost, dir: 8},
        ]
        return _.filter(neighbors, tile => tile.x >= 0 && tile.x <= 50 &&
            tile.y >= 0 && tile.y <= 50)
    }

    //fill with 255
    for(let x=0 ; x<=50 ; x++) {
        for(let y=0 ; y<=50 ; y++) {
            matrix.set(x, y, 0xff)
        }
    }

    const queue = []

    for(let x=target.x-opts.range ; x<=target.x+opts.range ; x++) {
        for(let y=target.y-opts.range ; y<=target.y+opts.range ; y++) {
            queue.push({x, y, cost: 0, dir: 0})
        }
    }

    while(queue.length > 0) {
        const tile = _.min(queue, 'cost')
        _.pull(queue, tile)
        if(tile.cost > 200 || matrix.get(tile.x, tile.y) != 0xff || costMatrix.get(tile.x, tile.y) >= 100) {
            continue
        }
        matrix.set(tile.x, tile.y, tile.dir)
        getNeighbors(tile).forEach(neighborTile => {
            queue.push(neighborTile)
        })
    }

    return matrix
}

const DIR_TEXT = {
    0: '0',
    1: '↑',
    2: '↗',
    3: '→',
    4: '↘',
    5: '↓',
    6: '↙',
    7: '←',
    8: '↖',
}

function visualizeDirectionMatrix(room, matrix) {
    const visual = room.visual
    for(let x=0 ; x<=50 ; x++) {
        for(let y=0 ; y<=50 ; y++) {
            const dir = matrix.get(x, y)
            if(dir <= 8) {
                const text = DIR_TEXT[matrix.get(x, y)]
                visual.text(text, x, y)
            }
        }
    }
}