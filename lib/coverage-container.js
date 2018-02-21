'use babel'

import lcov from './lcov'

class CoverageContainer {
  /**
   * A Map of arrays
   * @type    {Map}
   */
  sources = new Map()

  async parseSource(file) {
    this.sources.set(file, await lcov(file))
  }

  removeSource(file) {
    this.sources.delete(file)
  }

  *[Symbol.iterator]() {
    for (const source of this.sources.values()) {
      yield* source
    }
  }
}

export default CoverageContainer
