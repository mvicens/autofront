# Autofront

Automatisation of front-end by [Gulp](https://gulpjs.com) and [Bower](https://bower.io).

## Get started

### Gulp

Install its CLI, following [the official manual](https://gulpjs.com/docs/en/getting-started/quick-start/) but skipping [the local package](https://gulpjs.com/docs/en/getting-started/quick-start/#install-the-gulp-package-in-your-devdependencies) and the next steps.

And put `gulpfile.js` simply with:

```js
require('autofront');
```

### Bower

[Install it](https://bower.io/#install-bower), [initialize it and save dependencies](https://bower.io/#save-packages).

### Install

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

A browser tab will be opened. Then, try editing the HTML to view the web refresh.

Other command options, that appear immediately below, are available. And to use another programming languages, see [the proper section](#support).

## Usage

### Tasks

The Gulp ones are the following:

- `gulp` or `gulp serve` are for running a test server and develop with live reload.
- `gulp build` only builds production code, the distributable application (`dist` folder).
- With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs that last version but without reload.

### Domains

On executing Gulp command, a flag argument can be accepted (e.g.: `gulp --domain production` or `gulp build -d development`) to indicate the domain of connection path. Defaults to "development" with tasks `serve` and `serve:dist`; and to "production" with `build`".

To define them, list it like:

```js
let autofront = require('autofront');
autofront.domains = {
	development: 'http://localhost:3001/',
	// ...
};
```

And, to capture the selected URL string, put `${AUTOFRONT_DOMAIN}` where it would be located in your JS source code.

## Support

Positioning in source folder (`src`), you can utilize:

### HTML

Besides of required `index.html`, it is possible to add more files. In this case, they will be treated as [templates](https://docs.angularjs.org/api/ng/directive/ngInclude) and, to work properly with `dist`, AngularJS must to be [appropriately](#angularjs) on.

#### [Pug](https://pugjs.org)

Turn any hypertext file into Pug's one, except the mentioned untouchable index page.

### CSS

Collocated in `styles` directory, type over lonely `index.css`.

#### [Less](https://lesscss.org)

The same as before (but with its own file extension). The rest of optional files will be ignored if they are not [imported](https://lesscss.org/features/#import-atrules-feature).

#### [Sass](https://sass-lang.com)

Idem, but it is also obligatory an extra jointly: `_variables.scss`.

### JavaScript

Wherever you want.

#### [AngularJS](https://angularjs.org)

One of modules should to be named "app", ideally the main one.

Optionally, to work with [HTML5 mode](https://docs.angularjs.org/api/ng/provider/$locationProvider#html5Mode), invoke it:

```js
let autofront = require('autofront');
autofront.html5Mode();
```

### Others

Any asset (e.g. a PDF document) will keep the location path and, particularly at production, will take place an images optimization.

## Pending

Improvements to do:

- Replace Bower as dependency manager.
- Migrate AngularJS to new [Angular](https://angular.io).