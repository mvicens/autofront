# Autofront

[Gulp](https://gulpjs.com) settings for front-end projects.

## Get started

### Install

```sh
npm install --save-dev autofront
```

### Folder structure

Here is the essential basic organization you must to put in your project:

```text
├─ src/
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

### Dependencies

These ones are automatically  built by [Gulp Useref](https://www.npmjs.com/package/gulp-useref), [Wiredep](https://www.npmjs.com/package/wiredep) and [Gulp Inject](https://www.npmjs.com/package/gulp-inject). Then, to reach this, `index.html` would have to look basically like:

```html
<!DOCTYPE html>
<html>
<head>
	<!-- build:css styles/vendor.css -->
	<!-- bower:css --><!-- endbower -->
	<!-- endbuild -->
</head>
<body>
<!-- build:js scripts/vendor.js -->
<!-- bower:js --><!-- endbower -->
<!-- endbuild -->
<!-- build:js scripts/app.js -->
<!-- inject:js -->
<!-- endinject -->
<!-- endbuild -->
</body>
</html>
```

### AngularJS modules

One of these should to be named "app", ideally the main one.

## Usage

### Tasks

Mainly the Gulp ones are the following:

* `gulp` or `gulp serve` are for running a test server and develop with live reload.
* `gulp build` only builds the distributable version.
* With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs this version but without reload.

### Domains

Running Gulp command, an additional parameter can be included (e.g.: `gulp --dev` or `gulp build --pro`) to indicate the domain of connection path. Defaults to `--local`.

These domain URLs would be searched in `package.json` listed in the property `domains` (optionally also `domainAliases`, to assign domain name for each alias).

And, to capture the selected URL, put `{{AUTOFRONT_DOMAIN}}` where it would be located in your source code.

## Support

The main supported packages/languages/libraries are:

* [Bower](https://bower.io).
* Preprocessors:
  * HTML: [Pug](https://pugjs.org).
  * CSS:
    * [Less](https://lesscss.org).
    * [Sass](https://sass-lang.com).
* [AngularJS](https://angularjs.org).

## Pending

Improves to do:

* Once the server waits for changes, synchronize also the deletion of files (from `src`).
* Sass errors must not break the Gulp process (like Less).
* Bower should be replaced as a dependency manager. It is currently [under maintenance](https://bower.io/blog/2017/how-to-migrate-away-from-bower/) and, therefore, its use is not recommended.