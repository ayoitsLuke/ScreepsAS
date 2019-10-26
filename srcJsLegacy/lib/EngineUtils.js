/**
 * @link
 */


const offsetsByDirection = {
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [RIGHT]: [1, 0],
  [BOTTOM_RIGHT]: [1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_LEFT]: [-1, 1],
  [LEFT]: [-1, 0],
  [TOP_LEFT]: [-1, -1]
};






exports.fetchXYArguments = function(firstArg, secondArg, globals) {
  var x, y, roomName;
  if (_.isUndefined(secondArg) || !_.isNumber(secondArg)) {
    if (!_.isObject(firstArg)) {
      return [undefined, undefined, undefined];
    }

    if (firstArg instanceof globals.RoomPosition) {
      x = firstArg.x;
      y = firstArg.y;
      roomName = firstArg.roomName;
    }
    if (firstArg.pos && (firstArg.pos instanceof globals.RoomPosition)) {
      x = firstArg.pos.x;
      y = firstArg.pos.y;
      roomName = firstArg.pos.roomName;
    }
  } else {
    x = firstArg;
    y = secondArg;
  }
  if (_.isNaN(x)) {
    x = undefined;
  }
  if (_.isNaN(y)) {
    y = undefined;
  }
  return [x, y, roomName];
};

exports.getDirection = function(dx, dy) {

  var adx = Math.abs(dx),
    ady = Math.abs(dy);

  if (adx > ady * 2) {
    if (dx > 0) {
      return RIGHT;
    } else {
      return LEFT;
    }
  } else if (ady > adx * 2) {
    if (dy > 0) {
      return BOTTOM;
    } else {
      return TOP;
    }
  } else {
    if (dx > 0 && dy > 0) {
      return BOTTOM_RIGHT;
    }
    if (dx > 0 && dy < 0) {
      return TOP_RIGHT;
    }
    if (dx < 0 && dy > 0) {
      return BOTTOM_LEFT;
    }
    if (dx < 0 && dy < 0) {
      return TOP_LEFT;
    }
  }
};

exports.getOffsetsByDirection = function(direction) {
  if (!offsetsByDirection[direction]) {
    try {
      throw new Error();
    } catch (e) {
      console.error('Wrong move direction', JSON.stringify(direction), JSON.stringify(offsetsByDirection), e.stack);
    }

  }
  return offsetsByDirection[direction];
};

exports.calcCreepCost = function(body) {
  let result = 0;
  body.forEach((i) => result += BODYPART_COST[i.type || i]);
  return result;
};

exports.checkConstructionSite = function(objects, structureType, x, y) {

  var borderTiles;
  if (structureType != 'road' && structureType != 'container' && (x == 1 || x == 48 || y == 1 || y == 48)) {
    if (x == 1) borderTiles = [
      [0, y - 1],
      [0, y],
      [0, y + 1]
    ];
    if (x == 48) borderTiles = [
      [49, y - 1],
      [49, y],
      [49, y + 1]
    ];
    if (y == 1) borderTiles = [
      [x - 1, 0],
      [x, 0],
      [x + 1, 0]
    ];
    if (y == 48) borderTiles = [
      [x - 1, 49],
      [x, 49],
      [x + 1, 49]
    ];
  }

  if (_.isString(objects) || objects instanceof Uint8Array) {
    if (borderTiles) {
      for (var i in borderTiles) {
        if (!exports.checkTerrain(objects, borderTiles[i][0], borderTiles[i][1], TERRAIN_MASK_WALL)) {
          return false;
        }
      }
    }
    if (structureType == 'extractor') {
      return true;
    }
    if (structureType != 'road' && exports.checkTerrain(objects, x, y, TERRAIN_MASK_WALL)) {
      return false;
    }
    return true;
  }

  if (objects && _.isArray(objects[0]) && _.isString(objects[0][0])) {
    if (borderTiles) {
      for (var i in borderTiles) {
        if (!(objects[borderTiles[i][1]][borderTiles[i][0]] & TERRAIN_MASK_WALL)) {
          return false;
        }
      }
    }
    if (structureType == 'extractor') {
      return true;
    }
    if (structureType != 'road' && objects[y][x] & TERRAIN_MASK_WALL) {
      return false;
    }
    return true;
  }

  if (_.any(objects, {
      x,
      y,
      type: structureType
    })) {
    return false;
  }
  if (_.any(objects, {
      x,
      y,
      type: 'constructionSite'
    })) {
    return false;
  }
  if (structureType == 'extractor') {
    return _.any(objects, {
      x,
      y,
      type: 'mineral'
    }) && !_.any(objects, {
      x,
      y,
      type: 'extractor'
    });
  }
  if (structureType != 'rampart' && structureType != 'road' &&
    _.any(objects, (i) => i.x == x && i.y == y && i.type != 'rampart' && i.type != 'road' && CONSTRUCTION_COST[i.type])) {
    return false;
  }
  if (x <= 0 || y <= 0 || x >= 49 || y >= 49) {
    return false;
  }
  return true;
};

exports.getDiff = function(oldData, newData) {

  function getIndex(data) {
    var index = {};
    _.forEach(data, (obj) => index[obj._id] = obj);
    return index;
  }


  var result = {},
    oldIndex = getIndex(oldData),
    newIndex = getIndex(newData);

  _.forEach(oldData, (obj) => {
    if (newIndex[obj._id]) {
      var newObj = newIndex[obj._id];
      var objDiff = result[obj._id] = {};
      for (var key in obj) {
        if (key == '_id') {
          continue;
        }
        if (_.isUndefined(newObj[key])) {
          objDiff[key] = null;
        } else if ((typeof obj[key]) != (typeof newObj[key]) || obj[key] && !newObj[key]) {
          objDiff[key] = newObj[key];
        } else if (_.isObject(obj[key])) {
          objDiff[key] = {};

          for (var subkey in obj[key]) {
            if (!_.isEqual(obj[key][subkey], newObj[key][subkey])) {
              objDiff[key][subkey] = newObj[key][subkey];
            }
          }
          for (var subkey in newObj[key]) {
            if (_.isUndefined(obj[key][subkey])) {
              objDiff[key][subkey] = newObj[key][subkey];
            }
          }
          if (!_.size(objDiff[key])) {
            delete result[obj._id][key];
          }
        } else if (!_.isEqual(obj[key], newObj[key])) {
          objDiff[key] = newObj[key];
        }
      }
      for (var key in newObj) {
        if (_.isUndefined(obj[key])) {
          objDiff[key] = newObj[key];
        }
      }
      if (!_.size(objDiff)) {
        delete result[obj._id];
      }
    } else {
      result[obj._id] = null;
    }
  });

  _.forEach(newData, (obj) => {
    if (!oldIndex[obj._id]) {
      result[obj._id] = obj;
    }
  });

  return result;
};

exports.encodeTerrain = function(terrain) {
  var result = '';
  for (var y = 0; y < 50; y++) {
    for (var x = 0; x < 50; x++) {
      var objects = _.filter(terrain, {
          x,
          y
        }),
        code = 0;
      if (_.any(objects, {
          type: 'wall'
        })) {
        code = code | TERRAIN_MASK_WALL;
      }
      if (_.any(objects, {
          type: 'swamp'
        })) {
        code = code | TERRAIN_MASK_SWAMP;
      }
      result = result + code;
    }
  }
  return result;
};

exports.decodeTerrain = function(items) {
  var result = [];

  for (var i in items) {
    if (items[i].type != 'terrain') {
      continue;
    }

    for (var y = 0; y < 50; y++) {
      for (var x = 0; x < 50; x++) {
        var code = items[i].terrain.charAt(y * 50 + x);
        if (code & TERRAIN_MASK_WALL) {
          result.push({
            room: items[i].room,
            x,
            y,
            type: 'wall'
          });
        }
        if (code & TERRAIN_MASK_SWAMP) {
          result.push({
            room: items[i].room,
            x,
            y,
            type: 'swamp'
          });
        }
      }
    }
  }

  return result;
};

exports.decodeTerrainByRoom = function(items) {
  var result = {
    spatial: {}
  };

  for (var i in items) {
    if (items[i].type != 'terrain') {
      continue;
    }
    result[items[i].room] = result[items[i].room] || [];
    result.spatial[items[i].room] = new Array(50);
    for (var y = 0; y < 50; y++) {
      result.spatial[items[i].room][y] = new Array(50);
      for (var x = 0; x < 50; x++) {
        var code = items[i].terrain.charAt(y * 50 + x);
        /*if (code & TERRAIN_MASK_WALL) {
            result[items[i].room].push({x, y, type: 'wall'});
        }
        if (code & TERRAIN_MASK_SWAMP) {
            result[items[i].room].push({x, y, type: 'swamp'});
        }*/
        result.spatial[items[i].room][y][x] = code;
      }
    }
  }

  return result;
};

exports.checkTerrain = function(terrain, x, y, mask) {
  var code = terrain instanceof Uint8Array ? terrain[y * 50 + x] : Number(terrain.charAt(y * 50 + x));
  return (code & mask) > 0;
};

exports.checkControllerAvailability = function(type, roomObjects, roomController, offset) {
  var rcl = 0;

  if (_.isObject(roomController) && roomController.level && (roomController.user || roomController.owner)) {
    rcl = roomController.level;
  }
  if (_.isNumber(roomController)) {
    rcl = roomController;
  }

  offset = offset || 0;

  var structuresCnt = _(roomObjects)
    .filter((i) => i.type == type || i.type == 'constructionSite' && i.structureType == type)
    .size();
  var availableCnt = CONTROLLER_STRUCTURES[type][rcl] + offset;

  return structuresCnt < availableCnt;
};

// Note that game/rooms.js will swap this function out for a faster version, but may call back to this function.
exports.getRoomNameFromXY = function(x, y) {
  if (x < 0) {
    x = 'W' + (-x - 1);
  } else {
    x = 'E' + (x);
  }
  if (y < 0) {
    y = 'N' + (-y - 1);
  } else {
    y = 'S' + (y);
  }
  return "" + x + y;
};

exports.roomNameToXY = function(name) {
  const chars = name.toUpperCase()
    .split(/(\d+)/); // "W99N99" -> ["W", "99", "N", "99", ""]
  return [chars[0] === "W" ? -chars[1] - 1 : chars[1], chars[2] === "N" ? -chars[3] - 1 : chars[3]];
};

exports.comparatorDistance = function(target) {
  if (target.pos) target = target.pos;
  return function(a, b) {
    if (a.pos) a = a.pos;
    if (b.pos) b = b.pos;
    var da = Math.max(Math.abs(a.x - target.x), Math.abs(a.y - target.y));
    var db = Math.max(Math.abs(b.x - target.x), Math.abs(b.y - target.y));
    return da - db;
  }
};

exports.storeIntents = function(userId, userIntents, userRuntimeData) {
  var intents = {};

  for (var i in userIntents) {

    if (i == 'notify') {
      intents.notify = [];
      if (_.isArray(userIntents.notify)) {
        userIntents.notify.forEach((notifyItem) => {
          intents.notify.push({
            message: ("" + notifyItem.message)
              .substring(0, 1000),
            groupInterval: +notifyItem.groupInterval
          })
        })
      }
      continue;
    }

    if (i == 'room') {
      var roomIntentsResult = userIntents.room;

      if (roomIntentsResult.createFlag) {
        _.forEach(roomIntentsResult.createFlag, (iCreateFlag) => {

          intents[iCreateFlag.roomName] =
            intents[iCreateFlag.roomName] || {};

          var roomIntents = intents[iCreateFlag.roomName].room =
            intents[iCreateFlag.roomName].room || {};

          roomIntents.createFlag = roomIntents.createFlag || [];

          roomIntents.createFlag.push({
            x: parseInt(iCreateFlag.x),
            y: parseInt(iCreateFlag.y),
            name: "" + iCreateFlag.name,
            color: +iCreateFlag.color,
            secondaryColor: +iCreateFlag.secondaryColor,
            roomName: iCreateFlag.roomName
          })
        });
      }
      if (roomIntentsResult.createConstructionSite) {
        _.forEach(roomIntentsResult.createConstructionSite, (iCreateConstructionSite) => {

          intents[iCreateConstructionSite.roomName] =
            intents[iCreateConstructionSite.roomName] || {};

          var roomIntents = intents[iCreateConstructionSite.roomName].room =
            intents[iCreateConstructionSite.roomName].room || {};

          roomIntents.createConstructionSite = roomIntents.createConstructionSite || [];

          roomIntents.createConstructionSite.push({
            x: parseInt(iCreateConstructionSite.x),
            y: parseInt(iCreateConstructionSite.y),
            structureType: "" + iCreateConstructionSite.structureType,
            name: "" + iCreateConstructionSite.name,
            roomName: "" + iCreateConstructionSite.roomName
          });
        });
      }
      if (roomIntentsResult.removeConstructionSite) {
        _.forEach(roomIntentsResult.removeConstructionSite, (iRemoveConstructionSite) => {

          intents[iRemoveConstructionSite.roomName] =
            intents[iRemoveConstructionSite.roomName] || {};

          var roomIntents = intents[iRemoveConstructionSite.roomName].room =
            intents[iRemoveConstructionSite.roomName].room || {};

          roomIntents.removeConstructionSite = roomIntents.removeConstructionSite || [];

          roomIntents.removeConstructionSite.push({
            roomName: "" + iRemoveConstructionSite.roomName,
            id: "" + iRemoveConstructionSite.id
          });
        });
      }
      if (roomIntentsResult.destroyStructure) {
        _.forEach(roomIntentsResult.destroyStructure, (iDestroyStructure) => {

          intents[iDestroyStructure.roomName] =
            intents[iDestroyStructure.roomName] || {};

          var roomIntents = intents[iDestroyStructure.roomName].room =
            intents[iDestroyStructure.roomName].room || {};

          roomIntents.destroyStructure = roomIntents.destroyStructure || [];

          roomIntents.destroyStructure.push({
            roomName: "" + iDestroyStructure.roomName,
            id: "" + iDestroyStructure.id
          });
        });
      }

      if (roomIntentsResult.removeFlag) {
        _.forEach(roomIntentsResult.removeFlag, (iRemoveFlag) => {

          intents[iRemoveFlag.roomName] =
            intents[iRemoveFlag.roomName] || {};

          var roomIntents = intents[iRemoveFlag.roomName].room =
            intents[iRemoveFlag.roomName].room || {};

          roomIntents.removeFlag = roomIntents.removeFlag || [];

          roomIntents.removeFlag.push({
            roomName: "" + iRemoveFlag.roomName,
            name: "" + iRemoveFlag.name
          });
        });
      }

      continue;
    }

    if (i == 'global') {
      var globalIntentsResult = userIntents.global;

      if (globalIntentsResult.createOrder) {
        _.forEach(globalIntentsResult.createOrder, (iCreateOrder) => {
          intents.global = intents.global || {};
          intents.global.createOrder = intents.global.createOrder || [];
          intents.global.createOrder.push({
            type: "" + iCreateOrder.type,
            resourceType: "" + iCreateOrder.resourceType,
            price: parseInt(iCreateOrder.price * 1000),
            totalAmount: parseInt(iCreateOrder.totalAmount),
            roomName: iCreateOrder.roomName ? "" + iCreateOrder.roomName : undefined
          })
        });
      }
      if (globalIntentsResult.cancelOrder) {
        _.forEach(globalIntentsResult.cancelOrder, (iCancelOrder) => {
          intents.global = intents.global || {};
          intents.global.cancelOrder = intents.global.cancelOrder || [];
          intents.global.cancelOrder.push({
            orderId: "" + iCancelOrder.orderId
          });
        });
      }
      if (globalIntentsResult.changeOrderPrice) {
        _.forEach(globalIntentsResult.changeOrderPrice, (iChangeOrderPrice) => {
          intents.global = intents.global || {};
          intents.global.changeOrderPrice = intents.global.changeOrderPrice || [];
          intents.global.changeOrderPrice.push({
            orderId: "" + iChangeOrderPrice.orderId,
            newPrice: parseInt(iChangeOrderPrice.newPrice * 1000),
          });
        });
      }
      if (globalIntentsResult.extendOrder) {
        _.forEach(globalIntentsResult.extendOrder, (iExtendOrder) => {
          intents.global = intents.global || {};
          intents.global.extendOrder = intents.global.extendOrder || [];
          intents.global.extendOrder.push({
            orderId: "" + iExtendOrder.orderId,
            addAmount: parseInt(iExtendOrder.addAmount),
          });
        });
      }
      if (globalIntentsResult.deal) {
        _.forEach(globalIntentsResult.deal, (iDeal) => {
          intents.global = intents.global || {};
          intents.global.deal = intents.global.deal || [];
          intents.global.deal.push({
            orderId: "" + iDeal.orderId,
            amount: parseInt(iDeal.amount),
            targetRoomName: "" + iDeal.targetRoomName
          });
        });
      }
      if (globalIntentsResult.spawnPowerCreep) {
        _.forEach(globalIntentsResult.spawnPowerCreep, (iSpawnPowerCreep) => {
          intents.global = intents.global || {};
          intents.global.spawnPowerCreep = intents.global.spawnPowerCreep || [];
          intents.global.spawnPowerCreep.push({
            id: "" + iSpawnPowerCreep.id,
            name: "" + iSpawnPowerCreep.name,
          });
        });
      }
      if (globalIntentsResult.suicidePowerCreep) {
        _.forEach(globalIntentsResult.suicidePowerCreep, (iSuicidePowerCreep) => {
          intents.global = intents.global || {};
          intents.global.suicidePowerCreep = intents.global.suicidePowerCreep || [];
          intents.global.suicidePowerCreep.push({
            id: "" + iSuicidePowerCreep.id,
          });
        });
      }
      if (globalIntentsResult.deletePowerCreep) {
        _.forEach(globalIntentsResult.deletePowerCreep, (iDeletePowerCreep) => {
          intents.global = intents.global || {};
          intents.global.deletePowerCreep = intents.global.deletePowerCreep || [];
          intents.global.deletePowerCreep.push({
            id: "" + iDeletePowerCreep.id,
            cancel: !!iDeletePowerCreep.cancel
          });
        });
      }
      if (globalIntentsResult.upgradePowerCreep) {
        _.forEach(globalIntentsResult.upgradePowerCreep, (iUpgradePowerCreep) => {
          intents.global = intents.global || {};
          intents.global.upgradePowerCreep = intents.global.upgradePowerCreep || [];
          intents.global.upgradePowerCreep.push({
            id: "" + iUpgradePowerCreep.id,
            power: +iUpgradePowerCreep.power
          });
        });
      }
      if (globalIntentsResult.createPowerCreep) {
        _.forEach(globalIntentsResult.createPowerCreep, (iCreatePowerCreep) => {
          intents.global = intents.global || {};
          intents.global.createPowerCreep = intents.global.createPowerCreep || [];
          intents.global.createPowerCreep.push({
            name: "" + iCreatePowerCreep.name,
            className: "" + iCreatePowerCreep.className,
          });
        });
      }
      if (globalIntentsResult.renamePowerCreep) {
        _.forEach(globalIntentsResult.renamePowerCreep, (iRenamePowerCreep) => {
          intents.global = intents.global || {};
          intents.global.renamePowerCreep = intents.global.renamePowerCreep || [];
          intents.global.renamePowerCreep.push({
            id: "" + iRenamePowerCreep.id,
            name: "" + iRenamePowerCreep.name
          });
        });
      }
      continue;
    }

    var object = userRuntimeData.userObjects[i] || userRuntimeData.roomObjects[i]

    if (!object) {
      continue;
    }

    var objectIntentsResult = userIntents[i];

    intents[object.room] = intents[object.room] || {};

    var objectIntents = intents[object.room][i] = {};

    // transfer can be invoked by another player

    if (objectIntentsResult.transfer) {
      objectIntents.transfer = {
        id: "" + objectIntentsResult.transfer.id,
        amount: parseInt(objectIntentsResult.transfer.amount),
        resourceType: "" + objectIntentsResult.transfer.resourceType
      };
    }

    if (objectIntentsResult.move) {
      objectIntents.move = objectIntentsResult.move.id ? {
        id: "" + objectIntentsResult.move.id
      } : {
        direction: parseInt(objectIntentsResult.move.direction)
      };
    }
    if (objectIntentsResult.pull) {
      objectIntents.pull = {
        id: "" + objectIntentsResult.pull.id
      };
    }
    if (objectIntentsResult.harvest) {
      objectIntents.harvest = {
        id: "" + objectIntentsResult.harvest.id
      };
    }
    if (objectIntentsResult.attack) {
      objectIntents.attack = {
        id: "" + objectIntentsResult.attack.id,
        x: parseInt(objectIntentsResult.attack.x),
        y: parseInt(objectIntentsResult.attack.y)
      };
    }
    if (objectIntentsResult.rangedAttack) {
      objectIntents.rangedAttack = {
        id: "" + objectIntentsResult.rangedAttack.id
      };
    }
    if (objectIntentsResult.rangedMassAttack) {
      objectIntents.rangedMassAttack = {};
    }
    if (objectIntentsResult.heal) {
      objectIntents.heal = {
        id: "" + objectIntentsResult.heal.id,
        x: parseInt(objectIntentsResult.heal.x),
        y: parseInt(objectIntentsResult.heal.y)
      };
    }
    if (objectIntentsResult.rangedHeal) {
      objectIntents.rangedHeal = {
        id: "" + objectIntentsResult.rangedHeal.id
      };
    }
    if (objectIntentsResult.repair) {
      objectIntents.repair = {
        id: "" + objectIntentsResult.repair.id,
        x: parseInt(objectIntentsResult.repair.x),
        y: parseInt(objectIntentsResult.repair.y)
      };
    }
    if (objectIntentsResult.build) {
      objectIntents.build = {
        id: "" + objectIntentsResult.build.id,
        x: parseInt(objectIntentsResult.build.x),
        y: parseInt(objectIntentsResult.build.y)
      };
    }
    if (objectIntentsResult.transferEnergy) {
      objectIntents.transferEnergy = {
        id: "" + objectIntentsResult.transferEnergy.id,
        amount: parseInt(objectIntentsResult.transferEnergy.amount)
      };
    }
    if (objectIntentsResult.drop) {
      objectIntents.drop = {
        amount: parseInt(objectIntentsResult.drop.amount),
        resourceType: "" + objectIntentsResult.drop.resourceType
      };
    }
    if (objectIntentsResult.pickup) {
      objectIntents.pickup = {
        id: "" + objectIntentsResult.pickup.id
      };
    }
    if (objectIntentsResult.createCreep) {
      objectIntents.createCreep = {
        name: "" + objectIntentsResult.createCreep.name,
        body: _.filter(objectIntentsResult.createCreep.body, (i) => _.contains(BODYPARTS_ALL, i)),
        energyStructures: objectIntentsResult.createCreep.energyStructures,
        directions: objectIntentsResult.createCreep.directions
      };
    }
    if (objectIntentsResult.renewCreep) {
      objectIntents.renewCreep = {
        id: "" + objectIntentsResult.renewCreep.id
      };
    }
    if (objectIntentsResult.recycleCreep) {
      objectIntents.recycleCreep = {
        id: "" + objectIntentsResult.recycleCreep.id
      };
    }
    if (objectIntentsResult.suicide) {
      objectIntents.suicide = {};
    }
    if (objectIntentsResult.remove) {
      objectIntents.remove = {};
    }
    if (objectIntentsResult.unclaim) {
      objectIntents.unclaim = {};
    }
    if (objectIntentsResult.say) {
      objectIntents.say = {
        message: objectIntentsResult.say.message.substring(0, 10),
        isPublic: !!objectIntentsResult.say.isPublic
      };
    }
    if (objectIntentsResult.claimController) {
      objectIntents.claimController = {
        id: "" + objectIntentsResult.claimController.id
      };
    }
    if (objectIntentsResult.attackController) {
      objectIntents.attackController = {
        id: "" + objectIntentsResult.attackController.id
      };
    }
    if (objectIntentsResult.unclaimController) {
      objectIntents.unclaimController = {
        id: "" + objectIntentsResult.unclaimController.id
      };
    }
    if (objectIntentsResult.upgradeController) {
      objectIntents.upgradeController = {
        id: "" + objectIntentsResult.upgradeController.id
      };
    }
    if (objectIntentsResult.reserveController) {
      objectIntents.reserveController = {
        id: "" + objectIntentsResult.reserveController.id
      };
    }
    if (objectIntentsResult.notifyWhenAttacked) {
      objectIntents.notifyWhenAttacked = {
        enabled: !!objectIntentsResult.notifyWhenAttacked.enabled
      };
    }
    if (objectIntentsResult.setPosition) {
      objectIntents.setPosition = {
        x: parseInt(objectIntentsResult.setPosition.x),
        y: parseInt(objectIntentsResult.setPosition.y),
        roomName: "" + objectIntentsResult.setPosition.roomName
      };
    }
    if (objectIntentsResult.setColor) {
      objectIntents.setColor = {
        color: "" + objectIntentsResult.setColor.color,
        secondaryColor: "" + objectIntentsResult.setColor.secondaryColor
      };
    }
    if (objectIntentsResult.destroy) {
      objectIntents.destroy = {};
    }
    if (objectIntentsResult.observeRoom) {
      objectIntents.observeRoom = {
        roomName: "" + objectIntentsResult.observeRoom.roomName
      };
    }
    if (objectIntentsResult.processPower) {
      objectIntents.processPower = {};
    }
    if (objectIntentsResult.dismantle) {
      objectIntents.dismantle = {
        id: "" + objectIntentsResult.dismantle.id
      };
    }
    if (objectIntentsResult.runReaction) {
      objectIntents.runReaction = {
        lab1: "" + objectIntentsResult.runReaction.lab1,
        lab2: "" + objectIntentsResult.runReaction.lab2
      };
    }
    if (objectIntentsResult.boostCreep) {
      objectIntents.boostCreep = {
        id: "" + objectIntentsResult.boostCreep.id,
        bodyPartsCount: parseInt(objectIntentsResult.boostCreep.bodyPartsCount)
      };
    }
    if (objectIntentsResult.unboostCreep) {
      objectIntents.unboostCreep = {
        id: "" + objectIntentsResult.unboostCreep.id
      }
    }
    if (objectIntentsResult.send) {
      objectIntents.send = {
        targetRoomName: "" + objectIntentsResult.send.targetRoomName,
        resourceType: "" + objectIntentsResult.send.resourceType,
        amount: parseInt(objectIntentsResult.send.amount),
        description: ("" + (objectIntentsResult.send.description || ""))
          .substring(0, 100)
      };
    }
    if (objectIntentsResult.launchNuke) {
      objectIntents.launchNuke = {
        roomName: "" + objectIntentsResult.launchNuke.roomName,
        x: parseInt(objectIntentsResult.launchNuke.x),
        y: parseInt(objectIntentsResult.launchNuke.y)
      };
    }
    if (objectIntentsResult.setPublic) {
      objectIntents.setPublic = {
        isPublic: !!objectIntentsResult.setPublic.isPublic
      };
    }
    if (objectIntentsResult.withdraw) {
      objectIntents.withdraw = {
        id: "" + objectIntentsResult.withdraw.id,
        amount: parseInt(objectIntentsResult.withdraw.amount),
        resourceType: "" + objectIntentsResult.withdraw.resourceType
      };
    }
    if (objectIntentsResult.activateSafeMode) {
      objectIntents.activateSafeMode = {};
    }
    if (objectIntentsResult.generateSafeMode) {
      objectIntents.generateSafeMode = {
        id: "" + objectIntentsResult.generateSafeMode.id,
      };
    }
    if (objectIntentsResult.signController) {
      objectIntents.signController = {
        id: "" + objectIntentsResult.signController.id,
        sign: ("" + objectIntentsResult.signController.sign)
          .substring(0, 100)
      };
    }
    if (objectIntentsResult.setSpawnDirections) {
      objectIntents.setSpawnDirections = {
        directions: objectIntentsResult.setSpawnDirections.directions
      };
    }
    if (objectIntentsResult.cancelSpawning) {
      objectIntents.cancelSpawning = {};
    }
    if (objectIntentsResult.usePower) {
      objectIntents.usePower = {
        power: +objectIntentsResult.usePower.power,
        id: "" + objectIntentsResult.usePower.id
      };
    }
    if (objectIntentsResult.enableRoom) {
      objectIntents.enableRoom = {
        id: "" + objectIntentsResult.enableRoom.id
      };
    }
    if (objectIntentsResult.renew) {
      objectIntents.renew = {
        id: "" + objectIntentsResult.renew.id
      };
    }

    // for(var iCustomType in driver.config.customIntentTypes) {
    //     if(objectIntentsResult[iCustomType]) {
    //         objectIntents[iCustomType] = {};
    //         for(var prop in driver.config.customIntentTypes[iCustomType]) {
    //             switch(driver.config.customIntentTypes[iCustomType][prop]) {
    //                 case 'string': {
    //                     objectIntents[iCustomType][prop] = "" + objectIntentsResult[iCustomType][prop];
    //                     break;
    //                 }
    //                 case 'number': {
    //                     objectIntents[iCustomType][prop] = +objectIntentsResult[iCustomType][prop];
    //                     break;
    //                 }
    //                 case 'boolean': {
    //                     objectIntents[iCustomType][prop] = !!objectIntentsResult[iCustomType][prop];
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    // }

  }

  return intents;
}


exports.checkStructureAgainstController = function(object, roomObjects, roomController) {
  // owner-less objects are always active
  if (!object.user) {
    return true;
  }

  // eliminate some other easy cases
  if (!roomController || roomController.level < 1 || roomController.user !== object.user) {
    return false;
  }

  let allowedRemaining = CONTROLLER_STRUCTURES[object.type][roomController.level];

  if (allowedRemaining === 0) {
    return false;
  }

  // if only one object ever allowed, this is it
  if (CONTROLLER_STRUCTURES[object.type][8] === 1) {
    return allowedRemaining !== 0;
  }

  // Scan through the room objects of the same type and count how many are closer.
  let foundSelf = false;
  let objectDist = Math.max(Math.abs(object.x - roomController.x), Math.abs(object.y - roomController.y));
  let objectIds = _.keys(roomObjects);
  for (let i = 0; i < objectIds.length; i++) {
    let compareObj = roomObjects[objectIds[i]];
    if (compareObj.type === object.type && compareObj.user === object.user) {
      let compareDist = Math.max(Math.abs(compareObj.x - roomController.x), Math.abs(compareObj.y - roomController.y));

      if (compareDist < objectDist) {
        allowedRemaining--;
        if (allowedRemaining === 0) {
          return false;
        }
      } else if (!foundSelf && compareDist === objectDist) {
        // Objects of equal distance that are discovered before we scan over the selected object are considered closer
        if (object === compareObj) {
          foundSelf = true;
        } else {
          allowedRemaining--;
          if (allowedRemaining === 0) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

exports.defineGameObjectProperties = function(obj, dataFn, properties) {
  var propertiesInfo = {};

  for (var name in properties) {
    eval(`
            propertiesInfo['${name}'] = {
                enumerable: true,
                get() {
                    if(!this['_${name}']) {
                        this['_${name}'] = properties['${name}'](dataFn(this.id), this.id);
                    }
                    return this['_${name}'];
                }
            }`);
  }
  Object.defineProperties(obj, propertiesInfo);

  obj.toJSON = function() {
    var result = {};
    for (var i in this) {
      if (i[0] == '_' || _.contains(['toJSON', 'toString'], i)) {
        continue;
      }
      result[i] = this[i];
    }
    return result;
  }
};

exports.isAtEdge = function(object) {
  if (object.pos) {
    object = object.pos;
  }

  return object.x == 0 || object.x == 49 || object.y == 0 || object.y == 49
}

exports.serializePath = function(path) {
  if (!_.isArray(path)) {
    throw new Error('path is not an array');
  }
  var result = '';
  if (!path.length) {
    return result;
  }
  if (path[0].x < 0 || path[0].y < 0) {
    throw new Error('path coordinates cannot be negative');
  }
  result += path[0].x > 9 ? path[0].x : '0' + path[0].x;
  result += path[0].y > 9 ? path[0].y : '0' + path[0].y;

  for (var i = 0; i < path.length; i++) {
    result += path[i].direction;
  }

  return result;
};

exports.deserializePath = function(path) {
  if (!_.isString(path)) {
    throw new Error('`path` is not a string');
  }

  var result = [];
  if (!path.length) {
    return result;
  }
  var x, y, direction, dx, dy;

  x = parseInt(path.substring(0, 2));
  y = parseInt(path.substring(2, 4));
  if (_.isNaN(x) || _.isNaN(y)) {
    throw new Error('`path` is not a valid serialized path string');
  }

  for (var i = 4; i < path.length; i++) {
    direction = parseInt(path.charAt(i));
    if (!offsetsByDirection[direction]) {
      throw new Error('`path` is not a valid serialized path string');
    }
    dx = offsetsByDirection[direction][0];
    dy = offsetsByDirection[direction][1];
    if (i > 4) {
      x += dx;
      y += dy;
    }
    result.push({
      x,
      y,
      dx,
      dy,
      direction
    });
  }


  return result;
};

exports.calcResources = function(object) {
  return _.sum(RESOURCES_ALL, i => typeof object[i] == 'object' ? object[i].amount : (object[i] || 0));
};

/**
 * [calcResourcesWeight description]
 * @see https://github.com/screeps/engine/blob/020ba168a1fde9a8072f9f1c329d5c0be8b440d7/src/processor/intents/movement.js#L41
 * @param   {Creep}  creep  [creep description]
 *
 * @return  {number}         [return description]
 */
exports.calcResourcesWeight = function(creep) {
  var totalCarry = 0,
    weight = 0;
  RESOURCES_ALL.forEach(resourceType => {
    totalCarry += creep[resourceType] || 0;
  });
  for (var i = creep.body.length - 1; i >= 0; i--) {
    if (!totalCarry) {
      break;
    }
    var part = creep.body[i];
    if (part.type != CARRY || !part.hits) {
      continue;
    }
    var boost = 1;
    if (part.boost) {
      boost = BOOSTS[CARRY][part.boost].capacity || 1;
    }
    totalCarry -= Math.min(totalCarry, CARRY_CAPACITY * boost);
    weight++;
  }
  return weight;
}

/**
 * [calcBodyEffectiveness description]
 *
 * @example utils.calcBodyEffectiveness(object.body, WORK, 'harvest', C.HARVEST_MINERAL_POWER)
 * @param   {Creep.body}  body            [body description]
 * @param   {string}  bodyPartType    [bodyPartType description]
 * @param   {string}  methodName      [methodName description]
 * @param   {number}  basePower       [basePower description]
 * @param   {boolean}  withoutOldHits  [withoutOldHits description]
 *
 * @return  {number}                  [return description]
 */
exports.calcBodyEffectiveness = function(body, bodyPartType, methodName, basePower, withoutOldHits) {
  let power = 0;
  body.forEach(i => {
    if (!(i.hits || !withoutOldHits && i._oldHits) || i.type != bodyPartType) {
      return;
    }
    var iPower = basePower;
    if (i.boost && BOOSTS[bodyPartType][i.boost] && BOOSTS[bodyPartType][i.boost][methodName]) {
      iPower *= BOOSTS[bodyPartType][i.boost][methodName];
    }
    power += iPower;
  });
  return power;
};

exports.dist = function(a, b) {
  if (a.pos) a = a.pos;
  if (b.pos) b = b.pos;
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

exports.calcRoomsDistance = function(room1, room2, continuous) {
  var [x1, y1] = exports.roomNameToXY(room1);
  var [x2, y2] = exports.roomNameToXY(room2);
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  if (continuous) {
    var worldSize = Game.map.getWorldSize();
    dx = Math.min(worldSize - dx, dx);
    dy = Math.min(worldSize - dy, dy);
  }
  return Math.max(dx, dy);
};

exports.calcTerminalEnergyCost = function(amount, range) {
  return Math.ceil(amount * (1 - Math.exp(-range / 30)))
};

exports.calcNeededGcl = function(gclLevel) {
  return GCL_MULTIPLY * Math.pow(gclLevel - 1, GCL_POW);
};

exports.calcTotalReactionsTime = function(mineral) {
  const reagents = _.reduce(REACTIONS, (a, n, j) => {
    _.forEach(n, (k, v) => a[k] = [v, j]);
    return a;
  }, {});
  const calcStep = m => !!REACTION_TIME[m] ? REACTION_TIME[m] + calcStep(reagents[m][0]) + calcStep(reagents[m][1]) : 0;
  return calcStep(mineral);
};





/**
 * TODO understand this!!
 *
 * @param   {[type]}  fromRoom  [fromRoom description]
 * @param   {[type]}  toRoom    [toRoom description]
 * @param   {[type]}  opts      [opts description]
 *
 * @return  {[type]}            [return description]
 */
makeMap = function(runtimeData, register, globals) {

  var heap, openClosed, parents;
  var originX, originY;
  var toX, toY;

  function describeExits(roomName) {
    if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
      return null;
    }
    var [x, y] = utils.roomNameToXY(roomName);
    var gridItem = runtimeData.mapGrid.gridData[`${x},${y}`];
    if (!gridItem) {
      return null;
    }

    var exits = {};

    if (gridItem.t) {
      exits[C.TOP] = utils.getRoomNameFromXY(x, y - 1);
    }
    if (gridItem.b) {
      exits[C.BOTTOM] = utils.getRoomNameFromXY(x, y + 1);
    }
    if (gridItem.l) {
      exits[C.LEFT] = utils.getRoomNameFromXY(x - 1, y);
    }
    if (gridItem.r) {
      exits[C.RIGHT] = utils.getRoomNameFromXY(x + 1, y);
    }

    return exits;
  }

  function xyToIndex(xx, yy) {
    let ox = originX - xx;
    let oy = originY - yy;
    if (ox < 0 || ox >= kRouteGrid * 2 || oy < 0 || oy >= kRouteGrid * 2) {
      return;
    }
    return ox * kRouteGrid * 2 + oy;
  }

  function indexToXY(index) {
    return [originX - Math.floor(index / (kRouteGrid * 2)), originY - index % (kRouteGrid * 2)];
  }

  function heuristic(xx, yy) {
    return Math.abs(xx - toX) + Math.abs(yy - toY);
  }

  return {

    findRoute(fromRoom, toRoom, opts) {
      if (_.isObject(fromRoom)) {
        fromRoom = fromRoom.name;
      }
      if (_.isObject(toRoom)) {
        toRoom = toRoom.name;
      }
      if (fromRoom == toRoom) {
        return [];
      }

      if (!/(W|E)\d+(N|S)\d+$/.test(fromRoom) || !/(W|E)\d+(N|S)\d+$/.test(toRoom)) {
        return C.ERR_NO_PATH;
      }

      var [fromX, fromY] = utils.roomNameToXY(fromRoom);
      [toX, toY] = utils.roomNameToXY(toRoom);

      if (fromX == toX && fromY == toY) {
        return [];
      }

      originX = fromX + kRouteGrid;
      originY = fromY + kRouteGrid;

      // Init path finding structures
      if (heap) {
        heap.clear();
        openClosed.clear();
      } else {
        heap = new Heap(Math.pow(kRouteGrid * 2, 2), Float64Array);
        openClosed = new OpenClosed(Math.pow(kRouteGrid * 2, 2));
      }
      if (!parents) {
        parents = new Uint16Array(Math.pow(kRouteGrid * 2, 2));
      }
      var fromIndex = xyToIndex(fromX, fromY);
      heap.push(fromIndex, heuristic(fromX, fromY));
      var routeCallback = (opts && opts.routeCallback) || function() {
        return 1;
      };

      // Astar
      while (heap.size()) {

        // Pull node off heap
        let index = heap.min();
        let fcost = heap.minPriority();

        // Close this node
        heap.pop();
        openClosed.close(index);

        // Calculate costs
        let [xx, yy] = indexToXY(index);
        let hcost = heuristic(xx, yy);
        let gcost = fcost - hcost;

        // Reached destination?
        if (hcost === 0) {
          let route = [];
          while (index !== fromIndex) {
            let [xx, yy] = indexToXY(index);
            index = parents[index];
            let [nx, ny] = indexToXY(index);
            let dir;
            if (nx < xx) {
              dir = C.FIND_EXIT_RIGHT;
            } else if (nx > xx) {
              dir = C.FIND_EXIT_LEFT;
            } else if (ny < yy) {
              dir = C.FIND_EXIT_BOTTOM;
            } else {
              dir = C.FIND_EXIT_TOP;
            }
            route.push({
              exit: dir,
              room: utils.getRoomNameFromXY(xx, yy),
            });
          }
          route.reverse();
          return route;
        }

        // Add neighbors
        let fromRoomName = utils.getRoomNameFromXY(xx, yy);
        let exits = describeExits(fromRoomName);
        for (let dir in exits) {

          // Calculate costs and check if this node was already visited
          let roomName = exits[dir];
          let graphKey = fromRoomName + ':' + roomName;
          let [xx, yy] = utils.roomNameToXY(roomName);
          let neighborIndex = xyToIndex(xx, yy);
          if (neighborIndex === undefined || openClosed.isClosed(neighborIndex)) {
            continue;
          }
          let cost = Number(routeCallback(roomName, fromRoomName)) || 1;
          if (cost === Infinity) {
            continue;
          }

          let fcost = gcost + heuristic(xx, yy) + cost;

          // Add to or update heap
          if (openClosed.isOpen(neighborIndex)) {
            if (heap.priority(neighborIndex) > fcost) {
              heap.update(neighborIndex, fcost);
              parents[neighborIndex] = index;
            }
          } else {
            heap.push(neighborIndex, fcost);
            openClosed.open(neighborIndex);
            parents[neighborIndex] = index;
          }
        }
      }

      return C.ERR_NO_PATH;
    },

    findExit(fromRoom, toRoom, opts) {
      var route = this.findRoute(fromRoom, toRoom, opts);
      if (!_.isArray(route)) {
        return route;
      }
      if (!route.length) {
        return C.ERR_INVALID_ARGS;
      }
      return route[0].exit;
    },

    describeExits,

    isRoomProtected(roomName) {
      register.deprecated('Method `Game.map.isRoomProtected` is deprecated and will be removed. Please use `Game.map.isRoomAvailable` instead.');
      if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
        return null;
      }
      return !_.contains(runtimeData.accessibleRooms, roomName);
    },

    isRoomAvailable(roomName) {
      if (!/^(W|E)\d+(N|S)\d+$/.test(roomName)) {
        return false;
      }
      return _.contains(runtimeData.accessibleRooms, roomName);
    },

    getTerrainAt(x, y, roomName) {
      register.deprecated('Method `Game.map.getTerrainAt` is deprecated and will be removed. Please use a faster method `Game.map.getRoomTerrain` instead.');
      if (_.isObject(x)) {
        y = x.y;
        roomName = x.roomName;
        x = x.x;
      }

      // check if coordinates are out of bounds
      if (x < 0 || x > 49 || y < 0 || y > 49) {
        return undefined;
      }

      if (!runtimeData.staticTerrainData || !runtimeData.staticTerrainData[roomName]) {
        return undefined;
      }
      var terrain = runtimeData.staticTerrainData[roomName][y * 50 + x];
      if (terrain & C.TERRAIN_MASK_WALL) {
        return 'wall'
      }
      if (terrain & C.TERRAIN_MASK_SWAMP) {
        return 'swamp';
      }
      return 'plain';
    },

    getRoomTerrain(roomName) {
      return new globals.Room.Terrain(roomName);
    },

    getRoomLinearDistance(roomName1, roomName2, continuous) {
      return utils.calcRoomsDistance(roomName1, roomName2, continuous);
    },

    getWorldSize() {
      return driver.getWorldSize();
    }
  }
};
