/**
 * [![npm version](https://img.shields.io/npm/v/tonal-distance.svg)](https://www.npmjs.com/package/tonal-distance)
 * [![tonal](https://img.shields.io/badge/tonal-distance-yellow.svg)](https://github.com/danigb/tonal/tree/master/packages/tonal/distance)
 *
 * Transpose notes by intervals and find distances between notes
 *
 * @example
 * // es6
 * import * as Distance from "tonal-distance"
 * Distance.interval("C3", "C4") // => "1P"
 *
 * @example
 * // es6 import selected functions
 * import { interval, semitones, transpose } from "tonal-distance"
 *
 * semitones("C" ,"D") // => 2
 * interval("C4", "G4") // => "5P"
 * transpose("C4", "P5") // => "G4"
 *
 * @example
 * // included in tonal facade
 * const Tonal = require("tonal");
 * Tonal.Distance.transpose("C4", "P5")
 * Tonal.Distance.transposeBy("P5", "C4")
 *
 * @module Distance
 */
import {
    props as noteProps,
    build as fromNote
} from "tonal-note";
import {
    props as iprops,
    build as ibuild
} from "tonal-interval";

// Map from letter step to number of fifths starting from "C":
// { C: 0, D: 2, E: 4, F: -1, G: 1, A: 3, B: 5 }
var FIFTHS = [0, 2, 4, -1, 1, 3, 5];

// Given a number of fifths, return the octaves they span
var fOcts = function(f) {
    return Math.floor(f * 7 / 12);
};

// Get the number of octaves it span each step
var FIFTH_OCTS = FIFTHS.map(fOcts);

var encode = function(ref) {
    var step = ref.step;
    var alt = ref.alt;
    var oct = ref.oct;
    var dir = ref.dir;
    if (dir === void 0) dir = 1;

    var f = FIFTHS[step] + 7 * alt;
    if (oct === null) {
        return [dir * f];
    }
    var o = oct - FIFTH_OCTS[step] - 4 * alt;
    return [dir * f, dir * o];
};

// We need to get the steps from fifths
// Fifths for CDEFGAB are [ 0, 2, 4, -1, 1, 3, 5 ]
// We add 1 to fifths to avoid negative numbers, so:
// for ["F", "C", "G", "D", "A", "E", "B"] we have:
var STEPS = [3, 0, 4, 1, 5, 2, 6];

// Return the number of fifths as if it were unaltered
function unaltered(f) {
    var i = (f + 1) % 7;
    return i < 0 ? 7 + i : i;
}

var decode = function(f, o, dir) {
    var step = STEPS[unaltered(f)];
    var alt = Math.floor((f + 1) / 7);
    if (o === undefined) {
        return {
            step: step,
            alt: alt,
            dir: dir
        };
    }
    var oct = o + 4 * alt + FIFTH_OCTS[step];
    return {
        step: step,
        alt: alt,
        oct: oct,
        dir: dir
    };
};

var memo = function(fn, cache) {
    if (cache === void 0) cache = {};

    return function(str) {
        return cache[str] || (cache[str] = fn(str));
    };
};

var encoder = function(props) {
    return memo(function(str) {
        var p = props(str);
        return p.name === null ? null : encode(p);
    });
};

var encodeNote = encoder(noteProps);
var encodeIvl = encoder(iprops);

/**
 * Transpose a note by an interval. The note can be a pitch class.
 *
 * This function can be partially applied.
 *
 * @param {String} note
 * @param {String} interval
 * @return {String} the transposed note
 * @example
 * import { tranpose } from "tonal-distance"
 * transpose("d3", "3M") // => "F#3"
 * // it works with pitch classes
 * transpose("D", "3M") // => "F#"
 * // can be partially applied
 * ["C", "D", "E", "F", "G"].map(transpose("M3)) // => ["E", "F#", "G#", "A", "B"]
 */
export function transpose(note, interval) {
    if (arguments.length === 1) {
        return function(i) {
            return transpose(note, i);
        };
    }
    var n = encodeNote(note);
    var i = encodeIvl(interval);
    if (n === null || i === null) {
        return null;
    }
    var tr = n.length === 1 ? [n[0] + i[0]] : [n[0] + i[0], n[1] + i[1]];
    return fromNote(decode(tr[0], tr[1]));
}

/**
 * Transpose a pitch class by a number of perfect fifths.
 *
 * It can be partially applied.
 *
 * @function
 * @param {String} pitchClass - the pitch class
 * @param {Integer} fifhts - the number of fifths
 * @return {String} the transposed pitch class
 *
 * @example
 * import { trFifths } from "tonal-transpose"
 * [0, 1, 2, 3, 4].map(trFifths("C")) // => ["C", "G", "D", "A", "E"]
 * // or using tonal
 * Distance.trFifths("G4", 1) // => "D"
 */

export function trFifths(note, fifths) {
    if (arguments.length === 1) {
        return function(f) {
            return trFifths(note, f);
        };
    }
    var n = encodeNote(note);
    if (n === null) {
        return null;
    }
    return fromNote(decode(n[0] + fifths));
}

/**
 * Get the distance in fifths between pitch classes
 *
 * Can be partially applied.
 *
 * @param {String} to - note or pitch class
 * @param {String} from - note or pitch class
 */
export function fifths(from, to) {
    if (arguments.length === 1) {
        return function(to) {
            return fifths(from, to);
        };
    }
    var f = encodeNote(from);
    var t = encodeNote(to);
    if (t === null || f === null) {
        return null;
    }
    return t[0] - f[0];
}

/**
 * The same as transpose with the arguments inverted.
 *
 * Can be partially applied.
 *
 * @param {String} note
 * @param {String} interval
 * @return {String} the transposed note
 * @example
 * import { tranposeBy } from "tonal-distance"
 * transposeBy("3m", "5P") // => "7m"
 */
export function transposeBy(interval, note) {
    if (arguments.length === 1) {
        return function(n) {
            return transpose(n, interval);
        };
    }
    return transpose(note, interval);
}

var isDescending = function(e) {
    return e[0] * 7 + e[1] * 12 < 0;
};
var decodeIvl = function(i) {
    return isDescending(i) ? decode(-i[0], -i[1], -1) : decode(i[0], i[1], 1);
};

export function addIntervals(ivl1, ivl2, dir) {
    var i1 = encodeIvl(ivl1);
    var i2 = encodeIvl(ivl2);
    if (i1 === null || i2 === null) {
        return null;
    }
    var i = [i1[0] + dir * i2[0], i1[1] + dir * i2[1]];
    return ibuild(decodeIvl(i));
}

/**
 * Add two intervals
 *
 * Can be partially applied.
 *
 * @param {String} interval1
 * @param {String} interval2
 * @return {String} the resulting interval
 * @example
 * import { add } from "tonal-distance"
 * add("3m", "5P") // => "7m"
 */
export function add(ivl1, ivl2) {
    if (arguments.length === 1) {
        return function(i2) {
            return add(ivl1, i2);
        };
    }
    return addIntervals(ivl1, ivl2, 1);
}

/**
 * Subtract two intervals
 *
 * Can be partially applied
 *
 * @param {String} minuend
 * @param {String} subtrahend
 * @return {String} interval diference
 */
export function subtract(ivl1, ivl2) {
    if (arguments.length === 1) {
        return function(i2) {
            return add(ivl1, i2);
        };
    }
    return addIntervals(ivl1, ivl2, -1);
}

/**
 * Find the interval between two pitches. It works with pitch classes
 * (both must be pitch classes and the interval is always ascending)
 *
 * Can be partially applied
 *
 * @param {String} from - distance from
 * @param {String} to - distance to
 * @return {String} the interval distance
 *
 * @example
 * import { interval } from "tonal-distance"
 * interval("C2", "C3") // => "P8"
 * interval("G", "B") // => "M3"
 *
 * @example
 * import * as Distance from "tonal-distance"
 * Distance.interval("M2", "P5") // => "P4"
 */
export function interval(from, to) {
    if (arguments.length === 1) {
        return function(t) {
            return interval(from, t);
        };
    }
    var f = encodeNote(from);
    var t = encodeNote(to);
    if (f === null || t === null || f.length !== t.length) {
        return null;
    }
    var d =
        f.length === 1 ?
        [t[0] - f[0], -Math.floor((t[0] - f[0]) * 7 / 12)] :
        [t[0] - f[0], t[1] - f[1]];
    return ibuild(decodeIvl(d));
}

/**
 * Get the distance between two notes in semitones
 *
 * @param {String|Pitch} from - first note
 * @param {String|Pitch} to - last note
 * @return {Integer} the distance in semitones or null if not valid notes
 * @example
 * import { semitones } from "tonal-distance"
 * semitones("C3", "A2") // => -3
 * // or use tonal
 * Tonal.Distance.semitones("C3", "G3") // => 7
 */
export function semitones(from, to) {
    if (arguments.length === 1) {
        return function(t) {
            return semitones(from, t);
        };
    }
    var f = noteProps(from);
    var t = noteProps(to);
    return f.midi !== null && t.midi !== null ?
        t.midi - f.midi :
        f.chroma !== null && t.chroma !== null ?
        (t.chroma - f.chroma + 12) % 12 :
        null;
}