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

- `gulp` or `gulp serve` are for running a test server and develop with live reload.
- `gulp build` only builds production code, the distributable application (`dist` folder).
- With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs that last version but without reload.

### Domains

On executing Gulp command, a flag argument can be accepted (e.g.: `gulp --domain production` or `gulp build -d development`) to indicate the domain of connection path. Defaults to "development" with tasks `serve` and `serve:dist`; and to "production" with `build`".

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
<tr><td rowspan="2"><code>css</code></td><td colspan="2"><code>folder</code></td><td>String</td><td>Directory that contains CSS files[^1]. Only one level allowed.</td><td><code>'styles/'</code></td></tr>
<tr><td colspan="2"><code>filename</code></td><td>String</td><td>Filename of root files.</td><td><code>'index'</code></td></tr>
<tr><td rowspan="4"><code>js</code></td><td rowspan="3"><code>angularjs</code>[^2]</td><td><code>module</code></td><td>String</td><td>Name of main module.</td><td><code>'app'</code></td></tr>
<tr><td><code>html5Mode</code></td><td>Boolean</td><td><a href="https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode">HTML5 mode</a> enabled?[^3]</td><td><code>false</code></td></tr>
<tr><td><code>template</code></td><td>Boolean</td><td>Templates loaded by <code><a href="https://docs.angularjs.org/api/ng/service/$templateCache">$templateCache</a></code>?[^4]</td><td><code>true</code></td></tr>
<tr><td colspan="2"><code>domains</code></td><td>Object</td><td>List with domains of connection path.</td><td><code>{}</code></td></tr>
</table>

[^1]: URLs from the current directory must to start with `./`. And `@import`s are not permitted.

[^2]: Mechanisms related to [AngularJS](https://angularjs.org) can be disabled assigning `false` (instead of the subproperties object).

[^3]: Automatically, it will be setted by [$locationProvider](https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode) and a `<base>` injected.

[^4]: During the production building.

## Support

Positioning in source folder (`src`), you can utilize:

### HTML

Besides of required `index.html`, it is possible to add more files. In this case, they will be treated as [templates](https://docs.angularjs.org/api/ng/directive/ngInclude) and, to work properly with `dist`, AngularJS must to be [appropriately](#angularjs) on.

#### [Pug](https://pugjs.org)

Turn any hypertext file into Pug's one, except the mentioned untouchable index page.

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