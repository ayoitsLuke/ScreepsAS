export const Helper = {
  // extend prototype via class
  define(main: any, extend: any, isPrototype?: boolean): void {
    if (!isPrototype) {
      Object.defineProperties(
        main.prototype,
        Object.getOwnPropertyDescriptors(extend.prototype),
      );
    } else {
      Object.defineProperties(
        main,
        Object.getOwnPropertyDescriptors(extend.prototype),
      );
    }
  },
  calcBodyEffectiveness(
    body: BodyPartDefinition[],
    bodyPartType: BodyPartConstant | string,
    methodName: string,
    basePower = 1,
  ) {
    var power = 0;
    body.forEach((i: any) => {
      if (!i.hits || i.type != bodyPartType) {
        return;
      }
      var iPower = basePower;
      if (
        i.boost &&
        BOOSTS[bodyPartType][i.boost] &&
        BOOSTS[bodyPartType][i.boost][methodName]
      ) {
        iPower *= BOOSTS[bodyPartType][i.boost][methodName];
      }
      power += iPower;
    });
    return power;
  },
};
