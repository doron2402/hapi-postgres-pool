'use strict';

const filterUnderscoreAttr = (x) => x.indexOf('_') === -1;

const intersectArrayWithObjectKeys = (obj, arr) => {
  const tmp = Object.keys(obj)
    .map((val) => arr.indexOf(val) !== -1)
    .filter((x) => x === true);
  return tmp.length === 0 ? false : true;
};

const _get = function (item) {
  // Look for connection
  if (this[item]) {
    return this[item];
  }
  // Get default
  if (this._options.default && this[this._options.default]) {
    return this[this._options.default];
  }
  // get first connection you find
  return this[Object.keys(this).filter(filterUnderscoreAttr)[0]];
};

module.exports = {
  filterUnderscoreAttr,
  intersectArrayWithObjectKeys,
  _get
};
