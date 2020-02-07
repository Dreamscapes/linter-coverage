'use babel'

import path from 'path'
import lcov from './lcov'

class CoverageContainer {
  /**
   * A Map of arrays
   * @type    {Map}
   */
  sources = new Map()

  async parseSource(file) {
    const [project] = atom.project.relativizePath(file)
    const coverage = await lcov(file)

    for (const fileCoverage of coverage) {
      fileCoverage.file = path.resolve(project, fileCoverage.file)
    }

    this.sources.set(file, coverage)
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
