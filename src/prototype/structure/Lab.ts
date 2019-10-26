class LabExtend extends StructureLab {
  get type(): string {
    if (!this.memory.type) {
      if (this.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_LAB }).length >= 5) {
        this.memory.type = "input";
      } else {
        this.memory.type = "output";
      }
    }
    return this.memory.type;
  }

  work(): void {
    if (this.type === "input" || this.cooldown) {
      // TODO request reactants
    } else {
      if (!this.memory.targetMolecule) this.getTargetMolecule();
      const [reactant1, reactant2] = this.memory.targetMolecule;
      this.runReaction(this.room.labs);
    }
  }

  /**
   * [retrosyntheticAnalysis description]
   *
   * @param   {string}  tm  Target molecule
   *
   * @return  {string[]}  [return description]
   */

  retrosynthesis(tm: ResourceConstant): [ResourceConstant, ResourceConstant] {
    for (const reactant1 in REACTIONS) {
      for (const reactant2 in REACTIONS[reactant1]) {
        if (REACTIONS[reactant1][reactant2] === tm || REACTIONS[reactant2][reactant1] === tm)
          return [reactant1, reactant2];
      }
    }
  }
  /**
   * TODO get target molecule from room.memory
   *
   * @return  {[type]}  [return description]
   */
  getTargetMolecule() {
    //
  }
}
