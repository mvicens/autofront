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

### Source code

Place inside directory `src`; at least including the main page (`index.html`), without embedding tags (`<link>`s and `<script>`s).

### Run

Finally, initiate the project, commanding:

```sh
gulp
```

A browser tab is opened. Now you are ready to develop!

To reach further, see below.

## Usage

### Tasks

The Gulp ones are:

| Name | Details | Processes |
| --- | --- | --- |
| `serve` (default) | Source code runs in a server with live reload. | <ul><li>Bower entry-point files catching.</li><li>Notification and injection of [environment](#environment-variables).</li><li>Compilation (Less, SCSS and Pug)[^1].</li><li>Set up[^2] of HTML5 mode.[^1]</li><li>Insertion of file with app info (`about.json`).</li></ul> |
| `build` | Production code is built (in folder `dist`). | The above and: <ul><li>Templates caching.[^1]</li><li>Concatenation to one hashed file (CSS and JS).</li><li>CSS purging.</li><li>Transform to compatible CSS (Autoprefixer) and JS (Babel).</li><li>Minification (HTML, CSS, JS, images and JSON).</li><li>Console display of files size.</li></ul> |
| `serve:dist` | This distributable application is served but without the refreshing. | The same with the folder hidden. |

[^1]: [If it is on](#settings).
[^2]: Invocation of [`$locationProvider`](https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode) and a `<base>` injected.

### Environment variables

They can be used in this way:

1. Define them. Look at [the next section](#settings).
2. Put `AUTOFRONT_ENV` in your JS source code where it would be injected.
3. On executing Gulp command, indicate the name of the current one to the flag argument `env`. Defaults to "development" with server tasks and to "production" with `build`.

## Settings

You can configure it typing into Gulp file like this:

```js
const autofront = require('autofront');

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
| `css` | `folder` | | String | Directory that contains CSS files. | `'styles/'` |
| <!-- ??? --> | `filename` | | String | Filename of root files. | `'index'` |
| <!-- ??? --> | `order` | | Number | Index of order to include content in stylesheet. | `0` |
| <!-- ??? --> | `less`[^3] | `order` | Number | Idem for [Less](https://lesscss.org). | `1` |
| <!-- ??? --> | `scss`[^3] | `order` | Number | Idem for [SCSS (Sass)](https://sass-lang.com/documentation/syntax#scss). | `2` |
| <!-- ??? --> | <!-- ??? --> | `variables` | String | Filename of variables file. | `_variables` |
| <!-- ??? --> | `fonts` | `folder` | String | Location (folder path) of font files from Bower. | `'fonts/'` |
| <!-- ??? --> | <!-- ??? --> | `extensions` | String or array of strings | File extensions to catch. | `['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']` |
| `js` | `ng`[^3] | `module` | String | Name of [AngularJS](https://angularjs.org) main module. | `'app'` |
| <!-- ??? --> | <!-- ??? --> | `html5Mode` | Boolean | [HTML5 mode](https://docs.angularjs.org/guide/$location#html5-mode) enabled? | `false` |
| <!-- ??? --> | <!-- ??? --> | `template` | Boolean | Templates loaded by [`$templateCache`](https://docs.angularjs.org/api/ng/service/$templateCache)? | `true` |
| <!-- ??? --> | `envs` | | Object | Environment variables list, with names as keys and data (whatever can be JSON parsed) as values. | `{}` |

[^3]: It can be disabled assigning a falsy value.

## Pending

Fixes and improvements to do:

- Achieve detection of unnamed files (like `.gitkeep`, `.nomedia`...).
- Implement new settings, such as:
  - `js`:
    - Folder (`scripts/`) where to locate source code from Bower (`.tmp`), to avoid conflicts with own files in `src`.
    - Indication about when Babel compilation (during serve or build?).
    - List of CDNs to load.
  - Exclusion folder(s) (whose any files will be forcely treated as "others").
- Settings changes (major releases):
  - All "extra" (not HTML, CSS or JS) languages/libraries defaultly disabled?
  - No CSS preprocessors configured? To activate one, pass info: extension file, Gulp plugin...
- Use [Gulp If](https://www.npmjs.com/package/gulp-if), [Gulp Plumber](https://www.npmjs.com/package/gulp-plumber), [Gulp Newer](https://www.npmjs.com/package/gulp-newer), [Gulp Changed](https://www.npmjs.com/package/gulp-changed), [Gulp Count](https://www.npmjs.com/package/gulp-count)...?
- Support:
  - Markdown (compilation to HTML).
  - [React](https://reactjs.org) (JSX), [Vue](https://vuejs.org)...?
  - [Stylus](https://stylus-lang.com) and other CSS preprocessors?
- Avoid to build distributable CSS if no content?
- Create Gulp task to add new folder with files of template, AngularJS controller and styles in directory `app/`?
- Use [Typrod](https://github.com/mvicens/typrod) as Bower dependency in demo.