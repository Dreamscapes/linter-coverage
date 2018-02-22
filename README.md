# Atom Linter - Coverage

> Show code coverage data in Atom's Linter/Diagnostics pane 👀

![Linter - Coverage][linter-coverage-screenshot]

## Installation

```sh
apm install linter-coverage
```

...or via the Atom's GUI.

## Usage

1. Install [atom-ide-ui][atom-ide-ui] or [Linter][linter]
1. Install this package
1. Generate LCOV code coverage report
1. Profit 🦄

Note that generating the code coverage data is not part of this package. This package merely looks for a _coverage/lcov.info_ file in your project directory and parses it to feed the coverage results to the Linter/Diagnostics pane. For generating JavaScript code coverage, have a look at [nyc][nyc].

## License

See the [LICENSE](LICENSE) file for more information.

[linter-coverage-screenshot]: https://user-images.githubusercontent.com/3058150/36543161-3b867412-17e3-11e8-985b-1dc9ee5355e7.png
[atom-ide-ui]: https://atom.io/packages/atom-ide-ui
[linter]: https://atom.io/packages/linter
[nyc]: https://github.com/istanbuljs/nyc
