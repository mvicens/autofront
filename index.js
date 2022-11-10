const defSettings = {
	html: { pug: false },
	css: {
		folder: 'styles/',
		filename: 'index',
		order: 0,
		less: { order: 1 },
		scss: {
			order: 2,
			variables: true
		},
		fonts: {
			folder: 'fonts/',
			extensions: ['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2']
		}
	},
	js: {
		angularjs: {
			module: 'app',
			html5Mode: false,
			template: true
		},
		envs: {}
	}
};
let settings = this;
for (const name in defSettings)
	settings[name] = { ...defSettings[name] };

const gulp = require('gulp'),
	hidefile = require('hidefile'),
	args = require('get-gulp-args')(),
	mainBowerFiles = require('main-bower-files'),
	$ = require('gulp-load-plugins')(),
	injStr = $.injectString,
	gulpSass = $.sass(require('sass')),
	notifyError = $.notify.onError(error => error.message),
	browserSync = require('browser-sync').create(),
	deleteEmpty = require('delete-empty'),
	cssnano = require('cssnano');

let defEnv = 'production',
	envName,
	envValue;

const allFiles = getGlob(),
	indexFile = 'index.html',
	jsFiles = getGlob('js'),
	scriptsDir = 'scripts/',
	cssComment = '<!-- autofrontcss -->',
	endCssComment = '<!-- endautofrontcss -->',
	jsComment = '<!-- autofrontjs -->',
	html5ModeJsFile = scriptsDir + 'html5-mode.js',
	endJsComment = '<!-- endautofrontjs -->',
	jsTemplatesFile = scriptsDir + 'templates.js',
	jsFile = 'index.js',
	cssFile = 'index.css';
let stylesDir,
	stylesFilename,
	stylesCssFile,
	cssExtensions = [];

const globs = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
globs.srcIndex = globs.src + indexFile;
globs.srcJs = globs.src + jsFiles;
globs.srcIndexAndJs = [globs.srcIndex, globs.srcJs];
globs.srcStyles = [];
globs.srcOthers = [globs.src + allFiles];
globs.tmpAllFiles = globs.tmp + allFiles;
globs.distIndexFile = globs.dist + indexFile;
globs.distTmpls = [globs.dist + getGlob('html'), '!' + globs.distIndexFile];

const nl = '\r\n',
	tab = '	';

function setDefaultEnv(cb) {
	defEnv = 'development';
	cb();
}
setDefaultEnv.displayName = 'set-default-env';

function setVariables(cb) {
	stylesDir = getSetting('cssFolder');
	stylesFilename = getSetting('filename');
	stylesCssFile = stylesDir + stylesFilename + '.css';

	cssExtensions = [{
		name: 'css',
		order: getSetting('cssOrder')
	}];
	for (const name of ['less', 'scss'])
		if (getSetting(name))
			cssExtensions.push({
				name,
				order: getSetting(name + 'Order')
			});
	cssExtensions = cssExtensions.sort((a, b) => a.order - b.order).map(obj => obj.name);

	for (const ext of cssExtensions)
		globs.srcStyles.push(globs.src + (ext == 'css' ? stylesCssFile : getGlob(ext)));
	globs.srcOthers.push(...[...globs.srcIndexAndJs, ...globs.srcStyles].map(glob => '!' + glob));

	cb();
}
setVariables.displayName = 'set-variables';

function getEnv() {
	envName = args.env || defEnv;
	envValue = getSetting('envs')[envName];
	const isMatched = envValue !== undefined;
	return gulp.src(globs.src, { read: false })
		.pipe($.notify(isMatched ? `Matching environment: "${envName}".` : 'No environment matched.'));
}
getEnv.displayName = 'get-env';

function removeFolder() {
	return delDir(globs.tmp);
}
removeFolder.displayName = 'remove-folder';

function createFolder() {
	return gulp.src('*.*', { read: false })
		.pipe(gulp.dest(globs.tmp));
}
createFolder.displayName = 'create-folder';

function hideFolder(cb) {
	hidefile.hideSync(globs.tmp, error => notifyError(error));
	cb();
}
hideFolder.displayName = 'hide-folder';

const addFolder = gulp.series(createFolder, hideFolder);

function index() {
	const filename = 'vendor',
		strs = [
			cssComment,
			`<!-- build:css ${stylesDir + filename}.css -->`,
			'<!-- bower:css --><!-- endbower -->',
			'<!-- endbuild -->'
		];
	for (const ext of cssExtensions)
		strs.push('<link rel="stylesheet" href="' + (ext == 'css' ? stylesCssFile : stylesDir + stylesFilename + '.' + ext + '.css') + '">');
	strs.push(
		endCssComment,
		jsComment,
		`<!-- build:js ${scriptsDir + filename}.js defer -->`,
		'<!-- bower:js --><!-- endbower -->',
		'<!-- endbuild -->',
		'<!-- inject:js -->',
		'<!-- endinject -->'
	);
	if (getSetting('html5Mode')) {
		strs.unshift('<base href="/">');
		strs.push(getScriptTag(html5ModeJsFile));
	}
	strs.push(endJsComment);

	let stream = gulp.src(globs.srcJs);
	if (getSetting('angularjs'))
		stream = stream.pipe($.angularFilesort());

	return gulp.src(globs.srcIndex)
		.pipe(injStr.before('</head>', tab + strs.join(nl + tab) + nl))
		.pipe($.inject(stream, { relative: true, transform: filepath => getScriptTag(filepath) })).on('error', notifyError)
		.pipe($.wiredep())
		.pipe($.useref())
		.pipe(gulp.dest(globs.tmp));
}

function js() {
	return gulp.src(globs.srcJs)
		.pipe(replace('AUTOFRONT_ENV', JSON.stringify(envValue, undefined, tab)))
		.pipe(gulp.dest(globs.tmp));
}

const indexAndJs = gulp.parallel(index, js);

function css() {
	return getStylesStream('css');
}

function less(cb) {
	if (cssExtensions.includes('less'))
		return getStylesStream('less', $.less);

	cb();
}

function scss(cb) {
	if (cssExtensions.includes('scss'))
		return getStylesStream('scss', gulpSass, getSetting('variables') ? '@import "variables";' : '');

	cb();
}

const styles = gulp.parallel(css, less, scss);

function html5Mode(cb) {
	if (getSetting('html5Mode'))
		return $.addFiles([{
			name: html5ModeJsFile,
			content: `(function () {
	angular.module('${getSetting('module')}')
		.config(config);

	function config($locationProvider) {
		$locationProvider.html5Mode(true);
	}
})();`
		}])
			.pipe(gulp.dest(globs.tmp));

	cb();
}
html5Mode.displayName = 'html5-mode';

function fonts() {
	return gulp.src(mainBowerFiles())
		.pipe(filter(getSetting('extensions'), true))
		.pipe(gulp.dest(globs.tmp + getSetting('fontsFolder')));
}

function others() {
	let stream = gulp.src(globs.srcOthers);
	if (getSetting('pug')) {
		const pugFilter = filter('pug');
		stream = stream.pipe(pugFilter).pipe($.pug()).on('error', notifyError).pipe(pugFilter.restore);
	}
	return stream.pipe(gulp.dest(globs.tmp));
}

function about() {
	return gulp.src('package.json')
		.pipe($.about({ inject: { environment: envName } }))
		.pipe(gulp.dest(globs.tmp));
}

const buildTmp = gulp.series(
	gulp.parallel(getEnv, removeFolder),
	addFolder,
	gulp.parallel(indexAndJs, styles, html5Mode, fonts, others, about)
);

function browser(cb) {
	browserSyncInit(globs.tmp);
	cb();
}

function watch() {
	gulp.watch(globs.srcIndexAndJs, indexAndJs);
	gulp.watch(globs.srcStyles, styles);
	gulp.watch(globs.srcOthers, others).on('unlink', function (path) {
		path = path.replaceAll('\\', '/').replace(globs.src, globs.tmp);
		if (getSetting('pug'))
			path = path.replace('.pug', '.html');
		gulp.src(path, { read: false })
			.pipe($.clean());
		deleteEmpty(globs.tmp);
	});
	gulp.watch([globs.tmpAllFiles, '!' + globs.tmp + getGlob('css')], function (cb) {
		browserSync.reload();
		cb();
	});
}

gulp.task('serve', gulp.series(
	gulp.parallel(setDefaultEnv, setVariables),
	buildTmp, browser, watch
));

function removeFolderDist() {
	return delDir(globs.dist);
}
removeFolderDist.displayName = 'remove-folder:dist';

function copy() {
	return gulp.src(globs.tmpAllFiles)
		.pipe($.size())
		.pipe(gulp.dest(globs.dist));
}

function templates() {
	let stream = gulp.src(globs.distTmpls)
		.pipe(gulpHtmlmin());
	if (getSetting('template'))
		stream = stream.pipe($.angularTemplatecache(jsTemplatesFile, { module: getSetting('module'), transformUrl: function (url) { return url.slice(1); } }));
	return stream.pipe(gulp.dest(globs.dist));
}

function indexDist() {
	const replaces = Object.entries({
		[cssComment]: `<!-- build:css ${cssFile} -->`,
		[endCssComment]: '<!-- endbuild -->',
		[jsComment]: `<!-- build:js ${jsFile} defer -->`,
		[endJsComment]: '<!-- endbuild -->'
	});
	let stream = gulp.src(globs.distIndexFile);
	if (getSetting('template'))
		stream = stream.pipe(injStr.before(endJsComment, getScriptTag(jsTemplatesFile) + nl + tab));
	for (const [search, str] of replaces)
		stream = stream.pipe(injStr.replace(search, str));
	return stream
		.pipe($.useref())
		.pipe(gulp.dest(globs.dist));
}
indexDist.displayName = 'index:dist';

function fixUrls() {
	const replaces = [
		['./', './' + stylesDir],
		['../', '']
	], str = 'url(';
	let stream = gulp.src(globs.dist + cssFile);
	for (const [search, str2] of replaces)
		for (const char of ['', "'", '"'])
			stream = stream.pipe(replace(str + '\\s*' + char + search, str + char + str2));
	return stream
		.pipe(gulp.dest(globs.dist));
}
fixUrls.displayName = 'fix-urls';

function cleanFiles() {
	return gulp.src([
		...(getSetting('template') ? globs.distTmpls : []),
		globs.dist + getGlob('css'), '!' + globs.dist + cssFile,
		globs.dist + jsFiles, '!' + globs.dist + jsFile
	], { read: false })
		.pipe($.clean());
}
cleanFiles.displayName = 'clean-files';

function cleanFolders() {
	return deleteEmpty(globs.dist);
}
cleanFolders.displayName = 'clean-folders';

const clean = gulp.series(cleanFiles, cleanFolders);

const minifyHtml = getMinifyTask('html', stream => stream.pipe(gulpHtmlmin()));
minifyHtml.displayName = 'minify-html';

const minifyCss = getMinifyTask('css', stream => stream.pipe($.postcss([cssnano()])));
minifyCss.displayName = 'minify-css';

const minifyJs = getMinifyTask('js', stream => {
	if (getSetting('angularjs'))
		stream = stream.pipe($.ngAnnotate());
	return stream.pipe($.terser());
});
minifyJs.displayName = 'minify-js';

const minifyImg = getMinifyTask(['png', 'jpg', 'gif', 'svg'], stream => stream.pipe($.imagemin()));
minifyImg.displayName = 'minify-img';

const minifyJson = getMinifyTask('json', stream => stream.pipe($.jsonmin()));
minifyJson.displayName = 'minify-json';

const minify = gulp.parallel(minifyHtml, minifyCss, minifyJs, minifyImg, minifyJson);

function finishBuild() {
	const cssAndJsFilter = filter(['css', 'js']);
	return gulp.src(globs.dist + allFiles)
		.pipe(cssAndJsFilter).pipe($.rev()).pipe($.revDeleteOriginal()).pipe(cssAndJsFilter.restore)
		.pipe($.revReplace())
		.pipe($.size({ showFiles: true }))
		.pipe(gulp.dest(globs.dist));
}
finishBuild.displayName = 'finish-build';

gulp.task('build', gulp.series(
	setVariables,
	gulp.parallel(buildTmp, removeFolderDist),
	copy, templates, indexDist, fixUrls, clean, minify, finishBuild
));

function browserDist(cb) {
	browserSyncInit(globs.dist);
	cb();
}
browserDist.displayName = 'browser:dist';

gulp.task('serve:dist', gulp.series(setDefaultEnv, 'build', browserDist));

gulp.task('default', gulp.task('serve'));

function getGlob(ext = '*') {
	const glob = '**/*.';
	if (typeof ext == 'string')
		return glob + ext;
	return glob + '{' + ext.join() + '}';
}

function getSetting(name) {
	switch (name) {
		case 'pug':
			return getValue('html');
		case 'cssFolder':
		case 'filename':
		case 'cssOrder':
			return getValue('css');
		case 'less':
		case 'scss':
			return getValue('css', true);
		case 'lessOrder':
			return getValue('css.less', true, true);
		case 'scssOrder':
		case 'variables':
			return getValue('css.scss', true, true);
		case 'fontsFolder':
		case 'extensions':
			return getValue('css.fonts');
		case 'angularjs':
			return getValue('js', true);
		case 'module':
		case 'html5Mode':
		case 'template':
			return getValue('js.angularjs', true, true);
		case 'envs':
			return getValue('js');
	}

	function getValue(str, withoutDefault, onlyIfFalsy) {
		for (const str of ['Folder', 'Order'])
			if (name.endsWith(str))
				name = str.toLowerCase();

		const nameStr = str + '.' + name,
			value = eval('settings.' + nameStr.replaceAll('.', '?.'));
		if (withoutDefault) {
			if (!onlyIfFalsy || !getSetting(str.split('.').pop()))
				return value;
		}
		return value ?? eval('defSettings.' + nameStr);
	}
}

function delDir(glob) {
	return gulp.src(glob, { allowEmpty: true, read: false })
		.pipe($.clean());
}

function getScriptTag(src) {
	return `<script src="${src}" defer></script>`;
}

function replace(search, str) {
	for (const char of ['$', '.', '/', '('])
		search = search.replaceAll(char, '\\' + char);
	return injStr.replace(search, str);
}

function getStylesStream(ext, process, extraCode) {
	let stream = gulp.src(globs.src + stylesDir + stylesFilename + '.' + ext);
	const sep = nl + nl;
	if (process)
		stream = stream
			.pipe(injStr.prepend((extraCode ? extraCode + sep : '') + '// bower:' + ext + nl + '// endbower' + sep))
			.pipe($.wiredep())
			.pipe(process()).on('error', notifyError)
			.pipe($.rename({ suffix: '.' + ext }));
	return stream
		.pipe(gulp.dest(globs.tmp + stylesDir))
		.pipe(browserSync.stream());
}

function filter(ext, isUnrestored) {
	return $.filter(getGlob(ext), { restore: !isUnrestored });
}

function browserSyncInit(path) {
	browserSync.init({ server: path });
}

function gulpHtmlmin() {
	return $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true });
}

function getMinifyTask(ext, getProcessedStream) {
	return () => getProcessedStream(gulp.src(globs.dist + getGlob(ext)))
		.pipe(gulp.dest(globs.dist));
}