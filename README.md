# Autofront

Gulp settings for projects.

### Requirements

It is compatible with version [8.17.0](https://nodejs.org/dist/v8.17.0/) of [Node.js](https://nodejs.org).

## Tasks

- `gulp` or `gulp serve` are for running a test server and develop with live reload.
- `gulp build` only builds the distributable version.
- With `gulp serve:dist`, a combination of the above is achieved: Specifically, the server runs this version but without reload.

Additionally, a parameter can be included (e.g.: `gulp --dev` o `gulp build --pro`) to indicate the domain of connection path. Defaults to local. And these domain URLs must to appear listed in `package.json` with the property `domains` (optionally also `domainsAliases`).

## Folder structure

Here is the essential basic organization you must to put in your project:

```text
├─ bower_components/
├─ nodes_modules/
├─ src/
│  ├─ fonts/
│  ├─ styles/
│  │  ├─ _variables.scss
│  │  ├─ index.less
│  │  └─ index.scss
│  └─ index.html
├─ .gitignore
├─ bower.json
├─ gulpfile.js
├─ package-lock.json
└─ package.json
```

The disposition of the other files present in `src` is merely indicative; and its content, adjustable and optional.

## Pending

- Once the server waits for changes, synchronize also the deletion of files (from `src`).
- Bower should be replaced as a dependency manager. It is currently [under maintenance](https://bower.io/blog/2017/how-to-migrate-away-from-bower/) and, therefore, its use is not recommended.