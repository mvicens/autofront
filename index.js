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
		domains: {}
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

let defDomain = 'production',
	domain;

const allFiles = getGlob(),
	indexHtmlFile = 'index.html',
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
globs.srcIndexHtml = globs.src + indexHtmlFile;
globs.srcJs = globs.src + jsFiles;
globs.srcIndexAndSrcJs = [globs.srcIndexHtml, globs.srcJs];
globs.srcStyles = [];
globs.srcOthers = [globs.src + allFiles];
globs.tmpAllFiles = globs.tmp + allFiles;
globs.distIndexHtmlFile = globs.dist + indexHtmlFile;
globs.distTmpls = [globs.dist + getGlob('html'), '!' + globs.distIndexHtmlFile];

const nl = '\r\n',
	tab = '	';

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
	globs.srcOthers.push(...[...globs.srcIndexAndSrcJs, ...globs.srcStyles].map(glob => '!' + glob));

	cb();
}
setVariables.displayName = 'set-variables';

function setDefault(cb) {
	defDomain = 'development';
	cb();
}
setDefault.displayName = 'set-default';

function remove() {
	return delDir(globs.tmp);
}

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

const create = gulp.series(createFolder, hideFolder);

function manageDomain() {
	const name = args.domain || args.d || defDomain;
	domain = getSetting('domains')[name];
	const isMatched = domain !== undefined;
	return gulp.src(globs.src, { read: false })
		.pipe($.notify(isMatched ? `Matching domain: "${name}".` : 'No domain matched.'));
}
manageDomain.displayName = 'manage-domain';

function buildIndex() {
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
	return gulp.src(globs.srcIndexHtml)
		.pipe(injStr.before('</head>', tab + strs.join(nl + tab) + nl))
		.pipe($.inject(stream, { relative: true, transform: filepath => getScriptTag(filepath) })).on('error', notifyError)
		.pipe($.wiredep())
		.pipe($.useref())
		.pipe(gulp.src(globs.srcJs))
		.pipe(gulp.dest(globs.tmp));
}
buildIndex.displayName = 'build-index';

function injectDomain() {
	return gulp.src(globs.tmp + jsFiles)
		.pipe(replace('${AUTOFRONT_DOMAIN}', domain))
		.pipe(gulp.dest(globs.tmp));
}
injectDomain.displayName = 'inject-domain';

const indexAndJs = gulp.series(buildIndex, injectDomain);

function addJs(cb) {
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
addJs.displayName = 'add-js';

function css() {
	return getCssTask('css');
}

function less(cb) {
	if (cssExtensions.includes('less'))
		return getCssTask('less', $.less);

	cb();
}

function sass(cb) {
	if (cssExtensions.includes('scss'))
		return getCssTask('scss', gulpSass, getSetting('variables') ? '@import "variables";' : '');

	cb();
}

const styles = gulp.parallel(css, less, sass);

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
		.pipe($.about({ inject: { domain } }))
		.pipe(gulp.dest(globs.tmp));
}

const buildTmp = gulp.series(
	gulp.parallel(remove, manageDomain),
	create,
	gulp.parallel(indexAndJs, addJs, styles, fonts, others, about)
);

function browser(cb) {
	browserSyncInit(globs.tmp);
	cb();
}

function watch() {
	gulp.watch(globs.srcIndexAndSrcJs, indexAndJs);
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
	gulp.parallel(setVariables, setDefault),
	buildTmp, browser, watch
));

function removeDist() {
	return delDir(globs.dist);
}
removeDist.displayName = 'remove:dist';

function copy() {
	return gulp.src(globs.tmpAllFiles)
		.pipe($.size())
		.pipe(gulp.dest(globs.dist));
}

function buildTemplates() {
	let stream = gulp.src(globs.distTmpls)
		.pipe(gulpHtmlmin());
	if (getSetting('template'))
		stream = stream.pipe($.angularTemplatecache(jsTemplatesFile, { module: getSetting('module'), transformUrl: function (url) { return url.slice(1); } }));
	return stream.pipe(gulp.dest(globs.dist));
}
buildTemplates.displayName = 'build-templates';

function buildIndexDist() {
	const replaces = Object.entries({
		[cssComment]: `<!-- build:css ${cssFile} -->`,
		[endCssComment]: '<!-- endbuild -->',
		[jsComment]: `<!-- build:js ${jsFile} defer -->`,
		[endJsComment]: '<!-- endbuild -->'
	});
	let stream = gulp.src(globs.distIndexHtmlFile);
	if (getSetting('template'))
		stream = stream.pipe(injStr.before(endJsComment, getScriptTag(jsTemplatesFile) + nl + tab));
	for (const [search, str] of replaces)
		stream = stream.pipe(injStr.replace(search, str));
	return stream
		.pipe($.useref())
		.pipe(gulp.dest(globs.dist));
}
buildIndexDist.displayName = 'build-index:dist';

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

function removeFiles() {
	return gulp.src([
		...(getSetting('template') ? globs.distTmpls : []),
		globs.dist + getGlob('css'), '!' + globs.dist + cssFile,
		globs.dist + jsFiles, '!' + globs.dist + jsFile
	], { read: false })
		.pipe($.clean());
}
removeFiles.displayName = 'remove-files';

function clean() {
	return deleteEmpty(globs.dist);
}

let minifyHtml = getMinifyTask('html', stream => stream.pipe(gulpHtmlmin()));
minifyHtml.displayName = 'minify-html';

let minifyCss = getMinifyTask('css', stream => stream.pipe($.postcss([cssnano()])));
minifyCss.displayName = 'minify-css';

let minifyJs = getMinifyTask('js', stream => {
	if (getSetting('angularjs'))
		stream = stream.pipe($.ngAnnotate());
	return stream.pipe($.terser());
});
minifyJs.displayName = 'minify-js';

let minifyImg = getMinifyTask(['png', 'jpg', 'gif', 'svg'], stream => stream.pipe($.imagemin()));
minifyImg.displayName = 'minify-img';

let minifyJson = getMinifyTask('json', stream => stream.pipe($.jsonmin()));
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
	gulp.parallel(buildTmp, removeDist),
	copy, buildTemplates, buildIndexDist, fixUrls, removeFiles, clean, minify, finishBuild
));

function browserDist(cb) {
	browserSyncInit(globs.dist);
	cb();
}
browserDist.displayName = 'browser:dist';

gulp.task('serve:dist', gulp.series(setDefault, 'build', browserDist));

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
		case 'domains':
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

function getCssTask(ext, process, extraCode) {
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