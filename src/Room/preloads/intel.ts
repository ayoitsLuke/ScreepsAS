Room.prototype.intel = function () {
    if (this.type === "hostile")
        this.memory.avoid = ture; // Traveler
    /** structures: Object[] Format as [_.groupBy]{@link https://lodash.com/docs/3.10.1#groupBy} */
    const structures = _.groupBy([...this.find(FIND_STRUCTURES),].map(({ id, pos, structureType }) => ({
        id,
        pos,
        structureType /* Trim off other properties */
    })), "structureType"); /* Group by property "structureType" */
    const sources = this.find(FIND_SOURCES)
        .map(s => s.simplify);
    const mineral = this.find(FIND_MINERALS)
        .map(({ id, pos, resourceType, }) => ({
        id,
        pos,
        resourceType /* Trim off other properties */
    }));
    this.memory.intel = {
        mineral,
        sources,
        structures,
    };
};
