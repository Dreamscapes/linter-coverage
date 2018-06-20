/* eslint-disable no-unused-vars */

function unused() {}

function used() {}
used()

function uncoveredArgument(defaults = {}) {}
uncoveredArgument({})

function uncoveredDefault(defaults = {}) {}
uncoveredDefault()

function usedBranch(defaults = {}) {}
usedBranch()
usedBranch({})

function unusedIf(use = true) {
  if (use) {
    return void true
  }
}

function unusedElse(use = false) {
  if (use) {
    return true
  }

  return false
}

unusedIf()
unusedElse()

function uncoveredSwitchCase() {
  switch (true) {
    case true:
      break
    case false:
      break
    default:
      break
  }
}

uncoveredSwitchCase()
