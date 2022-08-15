# Autofront

[Gulp](https://gulpjs.com) settings for front-end projects.

## Requirements

It is compatible with version [8.17.0](https://nodejs.org/dist/v8.17.0/) of [Node.js](https://nodejs.org).

## Behaviour

### Tasks

The Gulp ones are the following:

- `gulp` or `gulp serve` are for running a test server and develop with live reload.
- `gulp build` only builds the distributable version.
- With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs this version but without reload.

### Support

The main supported packages/languages/libraries are:

- [Bower](https://bower.io).
- Preprocessors:
  - HTML: [Pug](https://pugjs.org).
  - CSS:
    - [Less](https://lesscss.org).
    - [Sass](https://sass-lang.com).
- [AngularJS](https://angularjs.org).

## Usage

### Gulp file

`gulpfile.js` simply would look like:

```js
require('autofront');
```

Optionally, to work with [HTML5 mode](https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode), invoke `html5Mode` to prefix path of assets.

```js
var autofront = require('autofront');
autofront.html5Mode();
```

### Folder structure

Here is the essential basic organization you must to put in your project:

```text
├─ src/
│  ├─ fonts/
│  ├─ styles/
│  │  ├─ _variables.scss
│  │  ├─ index.less
│  │  └─ index.scss
│  └─ index.html
├─ bower.json
├─ gulpfile.js
└─ package.json
```

In `src`, only `index.html` is required. However, if Sass is used, both files must to exist.

### Domains

Running Gulp command, an additional parameter can be included (e.g.: `gulp --dev` o `gulp build --pro`) to indicate the domain of connection path. Defaults to local.

These domain URLs must to appear listed in `package.json` with the property `domains` (optionally also `domainsAliases`, to assign domain name for each alias).

And, to capture the selected URL, put `{{AUTOFRONT_DOMAIN}}` where it would be located in your source code.

## Pending

- Once the server waits for changes, synchronize also the deletion of files (from `src`).
- Sass errors must not break the Gulp process (like Less).
- Bower should be replaced as a dependency manager. It is currently [under maintenance](https://bower.io/blog/2017/how-to-migrate-away-from-bower/) and, therefore, its use is not recommended.