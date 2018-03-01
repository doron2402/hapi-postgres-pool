'use strict';

const PoolStub = function (options) {
  return options;
};
PoolStub.prototype.connect = (cb) => {
  const err = null;
  const client = {
    query: () => {}
  };
  const done = () => {};
  return cb(err, client, done);
};

module.exports = {
  PoolStub
};
