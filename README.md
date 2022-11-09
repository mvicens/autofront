# Autofront

Automation of front-end by [Gulp](https://gulpjs.com) and [Bower](https://bower.io).

## Get started

### Gulp

Install its CLI (following [the official manual](https://gulpjs.com/docs/en/getting-started/quick-start/) but skipping [the local package](https://gulpjs.com/docs/en/getting-started/quick-start/#install-the-gulp-package-in-your-devdependencies) and the next steps).

And put `gulpfile.js` simply with:

```js
require('autofront');
```

### Bower

[Install it](https://bower.io/#install-bower), [initialize it and save dependencies](https://bower.io/#save-packages).

### Installation

```sh
npm install --save-dev autofront
```

### Main page

In directory `src`, place your `index.html` without embedding tags (`<link>`s and `<script>`s).

### Run

Finally, initiate the project, commanding:

```sh
gulp
```

A browser tab is opened. Now you are ready to develop!

To reach further, see below.

## Usage

### Tasks

The Gulp ones are the following:

- `gulp` (default) or `gulp serve` are for running a server and develop with live reload.
- `gulp build` builds production code (folder `dist`).
- Using `gulp serve:dist`, this distributable application is served but without the refreshing.

### Environments

On executing Gulp command, flag argument `env` can be accepted to indicate the current environment variable. Defaults to "development" with server tasks (`serve` and `serve:dist`) and to "production" with `build`.

To define them, look at [the next section](#settings).

And, to inject it, put `${AUTOFRONT_ENV}` in your JS source code where it would be located.

## Settings

You can configure it typing into Gulp file in this way:

```js
let autofront = require('autofront');

autofront.property = {
	subproperty: value,
	subproperty2: {
		subproperty3: value2,
		// ...
	},
	// ...
};
autofront.property2.subproperty4 = value3;
// ...
```

Defining with:

| Property | Subprop. | | Type | Details | Default |
| --- | --- | --- | --- | --- | --- |
| `html` | `pug` | | Boolean | [Pug](https://pugjs.org) activated? | `false` |
| `css` | `folder` | | String | Directory that contains CSS files[^1]. Only one level allowed. | `'styles/'` |
| | `filename` | | String | Filename of root files. | `'index'` |
| | `order` | | Number | Index of order to include content in stylesheet. | `0` |
| | `less`[^2] | `order` | Number | Idem for [Less](https://lesscss.org). | `1` |
| | `scss`[^2] | `order` | Number | Idem for [SCSS (Sass)](https://sass-lang.com/documentation/syntax#scss). | `2` |
| | | `variables` | Boolean | File of variables used? | `true` |
| | `fonts` | `folder` | String | Location (folder path) of font files from Bower. | `'fonts/'` |
| | | `extensions` | Array | File extensions to catch. | `['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']` |
| `js` | `angularjs`[^2] | `module` | String | Name of [AngularJS](https://angularjs.org) main module. | `'app'` |
| | | `html5Mode` | Boolean | [HTML5 mode](https://docs.angularjs.org/guide/$location#html5-mode) enabled?[^3] | `false` |
| | | `template` | Boolean | Templates loaded by [`$templateCache`](https://docs.angularjs.org/api/ng/service/$templateCache)?[^4] | `true` |
| | `envs` | | Object | Environment variables list with names as keys and content as values. | `{}` |

[^1]: URLs from the current directory must to start with `./`. And CSS `@import`s are not permitted.
[^2]: It can be disabled assigning a falsy value.
[^3]: Automatically, [`$locationProvider`](https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode) will be used and a `<base>` injected.
[^4]: During the production building.