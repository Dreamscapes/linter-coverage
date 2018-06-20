# Defining shell is necessary in order to modify PATH
SHELL := bash
export PATH := node_modules/.bin/:$(PATH)

# Modify these variables in local.mk to add flags to the commands, ie.
# lintflags += --reporter nyan
lintflags :=
installflags :=

# Do this when make is invoked without targets
all: lint

# Note about `touch`:
# npm does not update the timestamp of the node_modules folder itself. This confuses Make as it
# thinks node_modules is not up to date and tries to constantly install pacakges. Touching
# node_modules after installation fixes that.
node_modules: package.json
	npm install $(installflags) && touch node_modules

install: node_modules

lint: force install
	eslint --report-unused-disable-directives $(lintflags) .
	remark --quiet .

report: install
	nyc --reporter lcov node report

clean: force
	rm -rf {.nyc_output,coverage,docs}

pristine: force clean
	rm -rf node_modules

.PHONY: force

-include local.mk
