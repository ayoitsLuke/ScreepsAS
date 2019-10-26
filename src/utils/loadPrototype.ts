export const Utils = {
    // set default
    setDefault(memory: object, path: string | string[], defaultValue: any): void {
        if (_.isUndefined(_.get(memory, path))) _.set(memory, path, defaultValue);
    },

    // extend prototype via class
    define(main: any, extend: any, isPrototype?: boolean): void {
        if (!isPrototype) {
            // @ts-ignore
            Object.defineProperties(main.prototype, Object.getOwnPropertyDescriptors(extend.prototype));
        } else {
            // @ts-ignore
            Object.defineProperties(main, Object.getOwnPropertyDescriptors(extend.prototype));
        }
    },
}
