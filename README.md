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

In `src` directory, place `index.html` whose content would have to look basically like:

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

### Run

Finally initiate your project development:

```sh
gulp
```

A browser tab will be opened. Then, try editing the HTML to view the web refresh.

Other command options, that appear immediately below, are available. And to use another programming languages, see [the proper section](#support).

## Usage

### Tasks

Mainly the Gulp ones are the following:

* `gulp` or `gulp serve` are for running a test server and develop with live reload.
* `gulp build` only builds production code, the distributable application (`dist` folder).
* With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs that last version but without reload.

### Domains

On executing Gulp command, an additional parameter can be included (e.g.: `gulp --dev` or `gulp build --pro`) to indicate the domain of connection path. Defaults to `--local`.

These domain URLs would be searched in `package.json` listed in the property `domains` (optionally also `domainAliases`, to assign domain name for each alias).

And, to capture the selected URL string, put `{{AUTOFRONT_DOMAIN}}` where it would be located in your source code.

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

Fixes and improvements to do:

* Once the server watch for changes:
  * Synchronize also the deletion of source files.
  * Resolve overwriting bug between pure CSS and preprocessors (Less/Sass).
* Replace Bower as dependency manager.
* Migrate AngularJS to new [Angular](https://angular.io).