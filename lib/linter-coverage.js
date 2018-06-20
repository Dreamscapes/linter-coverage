'use babel'

import {
  CompositeDisposable,
} from 'atom'
import path from 'path'
import pkg from '../package'
import CoverageContainer from './coverage-container'

class LinterCoverage {
  /**
   * Static values used throughout the codebase
   * @type    {Object}
   */
  static strings = {
    messages: {
      uncoveredLine: 'Line not covered by your test suite.',
      uncoveredBranch(branch) {
        return `${branch.branch === 0 ? 'If' : 'Else'} branch not covered by your test suite.`
      },
    },
  }

  /**
   * Atom configuration schema
   * @type    {Object}
   */
  config = {
    severity: {
      title: 'Severity of uncovered code paths',
      description: 'This will affect the severity at which uncovered parts of your code will be '
        + 'reported in the Linter/Diagnostics pane.',
      type: 'string',
      enum: [
        'info',
        'warning',
        'error',
      ],
      default: 'warning',
    },

    coverageFile: {
      title: 'Default location of the LCOV report',
      type: 'string',
      default: path.join('coverage', 'lcov.info'),
    },

    enableBranchCoverage: {
      title: 'Enable experimental branch coverage reporting',
      description: 'Branch reporting may not yield accurate or intuitive results.',
      type: 'boolean',
      default: false,
    },
  }

  /**
   * Actual settings pulled from Atom's config
   * @type    {Object}
   */
  settings = null

  /**
   * Atom subscriptions
   * @type    {CompositeDisposable}
   */
  subscriptions = null

  /**
   * Parsed coverage data for each open folder in the project
   * @type    {CoverageContainer}
   */
  coverage = null

  /**
   * Linter v2 reporter instance
   * @type    {Object}
   */
  linter = null

  /**
   * Activate this Atom package
   *
   * @return    {Promise}
   */
  async activate() {
    this.subscriptions = new CompositeDisposable()
    this.coverage = new CoverageContainer()
    this.settings = {}

    // Pull current configuration
    this.settings = atom.config.get(pkg.name)

    // Get the currently opened folders in the workspace and add them as sources for possible
    // coverage data
    await Promise.all(atom.project.getPaths().map(directory =>
      this.coverage.parseSource(path.resolve(directory, this.settings.coverageFile))))

    // If a new folder is added or removed,
    this.subscriptions.add(atom.project.onDidChangePaths(paths =>
      this.didChangePaths(paths)))

    // Watch for file changes inside the current workspace and if a coverage report is
    // created/modified, parse it and when it is deleted remove it from the sources
    this.subscriptions.add(atom.project.onDidChangeFiles(events =>
      this.didChangeFiles(events)))

    this.subscriptions.add(atom.config.onDidChange(pkg.name, change =>
      this.didChangeConfig(change)))

    this.generateMessages()
  }

  /**
   * Deactivate this Atom package
   *
   * @return    {void}
   */
  deactivate() {
    this.subscriptions.dispose()
    this.coverage = null
    this.linter = null
    this.settings = null
  }

  /**
   * Receive the Linter/Diagnostics-compatible linter constructor
   *
   * @param     {Function}      linter      A function to create custom linter interface
   * @return    {void}
   */
  consumeLinter(linter) {
    this.linter = linter({
      name: 'Coverage',
    })
    this.subscriptions.add(this.linter)
  }


  /**
   * Listen for changes to the folders in the current project's workspace and parse any LCOV reports
   * found therein
   *
   * @param     {Array.<String>}      paths     All the paths currently in the project's workspace
   * @return    {Promise}
   */
  async didChangePaths(paths) {
    const tasks = []

    // Remove sources for folder removed from workspace
    for (const existing of this.coverage.sources.keys()) {
      const [projectDir] = atom.project.relativizePath(existing)

      if (!paths.includes(projectDir)) {
        this.coverage.removeSource(existing)
      }
    }

    // Add sources for folders added to workspace
    for (const projectDir of paths) {
      const source = path.resolve(projectDir, this.settings.coverageFile)

      tasks.push(this.coverage.parseSource(source))
    }

    await Promise.all(tasks)

    // If we updated anything, re-generate linter messages
    if (tasks.length) {
      this.generateMessages()
    }
  }

  /**
   * Listen for filesystem changes to any file within the project, and if that file is an LCOV
   * report, re-generate messages
   *
   * @param     {Array}       [events=[]]     An array of filesystem events
   * @return    {Promise}
   */
  async didChangeFiles(events = []) {
    const tasks = []

    for (const event of events) {
      const filename = atom.project.relativizePath(event.path).pop()

      // We don't care about changes to other files within the project
      if (filename !== this.settings.coverageFile) {
        continue
      }

      switch (event.action) {
        case 'created':
        case 'modified':
        case 'renamed':
          tasks.push(this.coverage.parseSource(event.path))
          break
        case 'deleted':
          tasks.push(this.coverage.removeSource(event.path))
          break
        // no default
      }
    }

    await Promise.all(tasks)

    // If we updated anything, re-generate linter messages
    if (tasks.length) {
      this.generateMessages()
    }
  }

  /**
   * Listen for configuration changes and re-generate messages with new settings
   *
   * @param     {Object}      change      The configuration object describing the changes
   * @return    {Promise}
   */
  async didChangeConfig(change) {
    // Update the settings first
    this.settings = change.newValue

    const tasks = []

    // See if we need to do something special when some of the config values change, like re-parsing
    // LCOV reports etc.
    switch (true) {
      case change.oldValue.coverageFile !== change.newValue.coverageFile:
        tasks.push(this.didChangePaths(atom.project.getPaths()))
        break
      // no default
    }

    await Promise.all(tasks)

    // Changing the config currently always results in the current messages to be outdated, so
    // re-generate them!
    return this.generateMessages()
  }

  /**
   * Walk the LCOV data and generate a Linter v2 message for each missed line
   *
   * @return    {void}
   */
  generateMessages() {
    const messages = []

    for (const record of this.coverage) {
      for (const line of record.lines.details) {
        if (line.hit) {
          continue
        }

        messages.push({
          severity: this.settings.severity,
          location: {
            file: record.file,
            // LCOV line numbers are start at index 1, Linter's positions start at index 0
            position: [[line.line - 1, 0], [line.line - 1, 0]],
          },
          excerpt: LinterCoverage.strings.messages.uncoveredLine,
        })
      }

      if (!this.settings.enableBranchCoverage) {
        continue
      }

      // Let's generate branch coverage report!
      for (const branch of record.branches.details) {
        if (branch.taken) {
          continue
        }

        messages.push({
          severity: this.settings.severity,
          location: {
            file: record.file,
            // LCOV line numbers are start at index 1, Linter's positions start at index 0
            position: [[branch.line - 1, 0], [branch.line - 1, 0]],
          },
          excerpt: LinterCoverage.strings.messages.uncoveredBranch(branch),
        })
      }
    }

    this.linter.setAllMessages(messages)
  }
}


export default LinterCoverage
