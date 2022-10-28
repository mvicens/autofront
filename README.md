# Autofront

Automation of front-end by [Gulp](https://gulpjs.com) and [Bower](https://bower.io).

## Get started

### Gulp

Install its CLI, following [the official manual](https://gulpjs.com/docs/en/getting-started/quick-start/) but skipping [the local package](https://gulpjs.com/docs/en/getting-started/quick-start/#install-the-gulp-package-in-your-devdependencies) and the next steps.

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

In `src` directory, place `index.html` without embedding tags (`<link>`s and `<script>`s).

### Run

Finally initiate your project development:

```sh
gulp
```

A browser tab will be opened. Then, try editing the source code to view a web refresh.

Other command options, that appear immediately below, are available. And to use another programming languages, see [the proper section](#support).

## Usage

### Tasks

The Gulp ones are the following:

- `gulp` (default) or `gulp serve` are for running a server and develop with live reload.
- `gulp build` builds production code (folder `dist`).
- Using `gulp serve:dist`, this distributable application is served but without reloading.

### Domains

On executing Gulp command, a flag argument can be accepted (e.g.: `gulp --domain production` or `gulp build -d development`) to indicate the domain of connection path. Defaults to "development" with server tasks (`serve` and `serve:dist`) and to "production" with `build`.

To define them, look at [the next section](#settings).

And, to capture the selected URL string, put `${AUTOFRONT_DOMAIN}` where it would be located in your JS source code.

## Settings

You can configure it typing into Gulp file in this way:

```js
let autofront = require('autofront');
autofront.property = {
	subproperty: value,
	// ...
};
autofront.property2.subproperty2 = value2;
```

Defining with:

<table>
<tr><th colspan="3">(Sub)property</th><th>Type</th><th>Details</th><th>Default</th></tr>
<tr><td><code>html</code></td><td colspan="2"><code>pug</code></td><td>Boolean</td><td><a href="https://pugjs.org">Pug</a> activated?</td><td><code>false</code></td></tr>
<tr><td rowspan="4"><code>css</code></td><td colspan="2"><code>folder</code></td><td>String</td><td>Directory that contains CSS files<a href="#ref1"><sup>[1]</sup></a>. Only one level allowed.</td><td><code>'styles/'</code></td></tr>
<tr><td colspan="2"><code>filename</code></td><td>String</td><td>Filename of root files.</td><td><code>'index'</code></td></tr>
<tr><td rowspan="2"><code>fonts</code></td><td><code>folder</code></td><td>String</td><td>Location (folder path) of font files from Bower.</td><td><code>'fonts/'</code></td></tr>
<tr><td><code>extensions</code></td><td>Array</td><td>File extensions to catch.</td><td><code>['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']</code></td></tr>
<tr><td rowspan="4"><code>js</code></td><td rowspan="3"><code>angularjs</code><a href="#ref2"><sup>[2]</sup></a></td><td><code>module</code></td><td>String</td><td>Name of main module.</td><td><code>'app'</code></td></tr>
<tr><td><code>html5Mode</code></td><td>Boolean</td><td><a href="https://docs.angularjs.org/guide/$location#html5-mode">HTML5 mode</a> enabled?<a href="#ref3"><sup>[3]</sup></a></td><td><code>false</code></td></tr>
<tr><td><code>template</code></td><td>Boolean</td><td>Templates loaded by <a href="https://docs.angularjs.org/api/ng/service/$templateCache"><code>$templateCache</code></a>?<a href="#ref4"><sup>[4]</sup></a></td><td><code>true</code></td></tr>
<tr><td colspan="2"><code>domains</code></td><td>Object</td><td>Domains list with names as keys and URLs as values.</td><td><code>{}</code></td></tr>
</table>

<p name="ref1">1. URLs from the current directory must to start with <code>./</code>. And CSS <code>@import</code>s are not permitted.</p>

<p name="ref2">2. Mechanisms related to <a href="https://angularjs.org">AngularJS</a> can be disabled assigning <code>false</code> (instead of the subproperties object).</p>

<p name="ref3">3. Automatically, <a href="https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode"><code>$locationProvider</code></a> will be used and a <code>&lt;base&gt;</code> injected.</p>

<p name="ref4">4. During the production building.</p>

## Support

Positioning in source folder (`src`), you can utilize:

### CSS

#### [Less](https://lesscss.org)

The same as before (but with its own file extension). The rest of optional files will be ignored if they are not [imported](https://lesscss.org/features/#import-atrules-feature).

#### [Sass (SCSS)](https://sass-lang.com)

Idem, but it is also obligatory an extra jointly: `_variables.scss`.

### Others

Any asset (e.g. a PDF document) will keep the location path and, particularly at production, will take place an images optimization.

## Pending

Improvements to do:

- Replace Bower as dependency manager.
- Migrate AngularJS to new [Angular](https://angular.io).