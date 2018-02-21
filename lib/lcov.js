'use babel'

import lcovparse from 'lcov-parse'

function lcov(...args) {
  return new Promise(resolve =>
    lcovparse(...args, (err, data) =>
      err ? resolve([]) : resolve(data)))
}

export default lcov
