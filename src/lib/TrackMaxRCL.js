let isActive = OwnedStructure.prototype.isActive;
/**
 * Track your room maxRCL and never have to pay insane costs for isActive again
 * @author Tigga
 * @link https://screeps.slack.com/files/U46AY6Q83/F9F50DRE2/Track_your_room_maxRCL_and_never_have_to_pay_insane_costs_for_isActive_again_.js
 */
OwnedStructure.prototype.isActive = function () {
    if (this.room.memory && this.room.memory.maxRCL && this.room.memory.maxRCL == (this.room.controller.level || 0)) {
        return true;
    }
    return isActive.call(this);
};
