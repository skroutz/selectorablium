# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased

## [2.0.0-alpha.1] - 2015-07-23

### Changed

* Operations `add(value, text)` and `set(value, text)` have new behavior and now `text` has the role of key and thus must be unique. Similary the response from XHR must ensure that all `name` are unique. This was needed to support `<select>` elements where many `<option>` have the same value but different text.
