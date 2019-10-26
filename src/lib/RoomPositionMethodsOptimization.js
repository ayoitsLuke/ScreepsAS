RoomPosition.prototype.isEqualToXY = function (x, y) {
    return x === this.x && y === this.y;
};
RoomPosition.prototype.isEqualToPos = function (obj) {
    return obj.x === this.x && obj.y === this.y && obj.roomName === this.roomName;
};
RoomPosition.prototype.isEqualToRoomObject = function (obj) {
    return obj.pos.x == this.x && obj.pos.y == this.y && obj.pos.roomName == this.roomName;
};
RoomPosition.prototype.inRangeToXY = function (x, y, range) {
    return ((x - this.x) < 0 ? (this.x - x) : (x - this.x)) <= range && ((y - this.y) < 0 ? (this.y - y) : (y - this.y)) <= range;
};
RoomPosition.prototype.inRangeToPos = function (obj, range) {
    return ((obj.x - this.x) < 0 ? (this.x - obj.x) : (obj.x - this.x)) <= range && ((obj.y - this.y) < 0 ? (this.y - obj.y) : (obj.y - this.y)) <= range && obj.roomName === this.roomName;
};
RoomPosition.prototype.inRangeToRoomObject = function (obj, range) {
    return ((obj.pos.x - this.x) < 0 ? (this.x - obj.pos.x) : (obj.pos.x - this.x)) <= range && ((obj.pos.y - this.y) < 0 ? (this.y - obj.pos.y) : (obj.pos.y - this.y)) <= range && obj.pos.roomName === this.roomName;
};
RoomPosition.prototype.isNearToXY = function (x, y) {
    return ((x - this.x) < 0 ? (this.x - x) : (x - this.x)) <= 1 && ((y - this.y) < 0 ? (this.y - y) : (y - this.y)) <= 1;
};
RoomPosition.prototype.isNearToPos = function (obj) {
    return ((obj.x - this.x) < 0 ? (this.x - obj.x) : (obj.x - this.x)) <= 1 && ((obj.y - this.y) < 0 ? (this.y - obj.y) : (obj.y - this.y)) <= 1 && obj.roomName === this.roomName;
};
RoomPosition.prototype.isNearToRoomObject = function (obj) {
    return ((obj.pos.x - this.x) < 0 ? (this.x - obj.pos.x) : (obj.pos.x - this.x)) <= 1 && ((obj.pos.y - this.y) < 0 ? (this.y - obj.pos.y) : (obj.pos.y - this.y)) <= 1 && obj.pos.roomName === this.roomName;
};
