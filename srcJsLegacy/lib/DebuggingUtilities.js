"use strict";

/**
 * Computes formatted and intented string representation of any value. Similar to toSource(), but is specialized for
 * Screeps and does not recursively stringify Screeps objects deeper than 1 level.
 * @param x The stringified value.
 * @param maxDepth {number} Optional. Maximum depth of the object that will be stringified. Default 8.
 * @returns {string} Stringified value.
 */
global.toStringRec = function(x, maxDepth) {
    if (maxDepth === undefined) {
        maxDepth = 8;
    }
    switch (typeof x) {
        case 'number':
            return x.toString();

        case 'boolean':
            return x.toString();

        case 'string':
            return '"' + x + '"';

        case 'undefined':
            return 'undefined';

        case 'function':
            return '(function)';

        case 'object':
            if (x === null) {
                return 'null';
            } else if (maxDepth <= 0) {
                return '...';
            } else if (Array.isArray(x)) {
                if (x.length === 0) {
                    return '[]';
                } else {
                    return '[\n  ' + x.map(y => toStringRec(y, maxDepth - 1)).join(',\n')
                        .replaceAll('\n', '\n  ') + '\n]';
                }
            } else {
                if (x instanceof RoomObject) {
                    maxDepth = 1;
                } else if (x instanceof RoomPosition) {
                    return '(' + x.x + ', ' + x.y + ', ' + x.roomName + ')';
                }
                let attrs = [];
                for (let k in x) {
                    attrs.push(k + ': ' + toStringRec(x[k], maxDepth - 1));
                }
                if (attrs.length === 0) {
                    return '{}';
                } else {
                    return '{\n  ' + attrs.join(',\n').replaceAll('\n', '\n  ') + '\n}';
                }
            }
    }
};

/**
 * Prints stringified value.
 * @param x The printed value.
 * @param maxDepth {number} Maximum depth parameter passed to toStringRec.
 */
global.dump = function(x, maxDepth) {
    console.log(toStringRec(x, maxDepth));
};

/**
 * Throws an exception if condition is false.
 * @param condition The condition that is supposed to evaluate to a true value.
 * @returns The function's argument.
 */
global.assert = function(condition) {
    if (!condition) {
        throw new Error('Assertion failed');
    }
    return condition;
};

/**
 * Prints string in console in light red using HTML.
 * @param message {string} The string printed.
 */
global.displayError = function(message) {
    console.log('<span style="color: #ff9999">' + message + '</span>');
};

/**
 * Executes the function and prints how much time it took in milliseconds.
 * @param desc {string} Description of what is being measured.
 * @param f {function} The function whose execution time is to be measured.
 * @returns The function's result.
 */
global.measureTime = function(desc, f) {
    let startCpu = Game.cpu.getUsed();
    let res = f();
    let endCpu = Game.cpu.getUsed();
    if (PROFILE) {
        console.log(desc + ' completed in ' + (endCpu - startCpu) + 'ms.');
    }
    return res;
};