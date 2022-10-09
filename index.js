let autofront = this;
autofront.html5Mode = false;
autofront.domains = {};

const gulp = require('gulp'),
	args = require('get-gulp-args')(),
	mainBowerFiles = require('main-bower-files'),
	$ = require('gulp-load-plugins')(),
	injStr = $.injectString,
	gulpSass = $.sass(require('sass')),
	notifyError = $.notify.onError(error => error.message),
	browserSync = require('browser-sync').create(),
	deleteEmpty = require('delete-empty');

let defDomain = 'production',
	domain = undefined;

const allFiles = getGlob(),
	indexHtmlFile = 'index.html',
	jsFiles = getGlob('js'),
	stylesDir = 'styles/',
	indexFilename = 'index',
	cssFile = indexFilename + '.css',
	stylesCssFile = stylesDir + cssFile,
	scriptsDir = 'scripts/',
	cssComment = '<!-- autofrontcss -->',
	endCssComment = '<!-- endautofrontcss -->',
	jsComment = '<!-- autofrontjs -->',
	html5ModeJsFile = scriptsDir + 'html5-mode.js',
	endJsComment = '<!-- endautofrontjs -->',
	jsTemplatesFile = scriptsDir + 'templates.js',
	scriptsJsFile = scriptsDir + indexFilename + '.js';

const globs = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
globs.srcIndexHtml = globs.src + indexHtmlFile;
globs.srcJs = globs.src + jsFiles;
globs.srcIndexAndSrcJs = [globs.srcIndexHtml, globs.srcJs];
globs.srcStyles = [globs.src + stylesCssFile, globs.src + getGlob('less'), globs.src + getGlob('scss')];
globs.srcOthers = [globs.src + allFiles, ...[...globs.srcIndexAndSrcJs, ...globs.srcStyles].map(glob => '!' + glob)];
globs.tmpAllFiles = globs.tmp + allFiles;
globs.distIndexHtmlFile = globs.dist + indexHtmlFile;
globs.distTmpls = [globs.dist + getGlob('html'), '!' + globs.distIndexHtmlFile];

const nl = '\r\n',
	tab = '	';

function setDefault(cb) {
	defDomain = 'development';
	cb();
}
setDefault.displayName = 'set-default';

function remove() {
	return delDir(globs.tmp);
}

function manageDomain() {
	const name = args.domain || args.d || defDomain;
	domain = autofront.domains?.[name];
	const isMatched = domain !== undefined;
	return gulp.src(globs.src, { read: false })
		.pipe($.notify(isMatched ? `Matching domain: "${name}".` : 'No domain matched.'));
}
manageDomain.displayName = 'manage-domain';

function buildIndex() {
	const filename = 'vendor',
		headStrs = [
			cssComment,
			`<!-- build:css ${stylesDir + filename}.css -->`,
			'<!-- bower:css --><!-- endbower -->',
			'<!-- endbuild -->',
			`<link rel="stylesheet" href="${stylesCssFile}">`
		],
		bodyStrs = [
			jsComment,
			`<!-- build:js ${scriptsDir + filename}.js -->`,
			'<!-- bower:js --><!-- endbower -->',
			'<!-- endbuild -->',
			'<!-- inject:js -->',
			'<!-- endinject -->'
		];
	for (let ext of ['less', 'scss'])
		headStrs.push(`<link rel="stylesheet" href="${stylesDir + indexFilename}.${ext}.css">`);
	headStrs.push(endCssComment);
	if (autofront.html5Mode) {
		headStrs.unshift('<base href="/">');
		bodyStrs.push(`<script src="${html5ModeJsFile}"></script>`);
	}
	return gulp.src(globs.srcIndexHtml)
		.pipe(injStrBefore('head', headStrs))
		.pipe(injStrBefore('body', [...bodyStrs, endJsComment]))
		.pipe($.inject(gulp.src(globs.srcJs).pipe($.angularFilesort()), { relative: true })).on('error', notifyError)
		.pipe($.wiredep())
		.pipe($.useref())
		.pipe(gulp.src(globs.srcJs))
		.pipe(gulp.dest(globs.tmp));

	function injStrBefore(tagName, strs) {
		return injStr.before(`</${tagName}>`, tab + strs.join(nl + tab) + nl);
	}
}
buildIndex.displayName = 'build-index';

function injectDomain() {
	return gulp.src(globs.tmp + jsFiles)
		.pipe(injStr.replace('\\${AUTOFRONT_DOMAIN}', domain))
		.pipe(gulp.dest(globs.tmp));
}
injectDomain.displayName = 'inject-domain';

const indexAndJs = gulp.series(buildIndex, injectDomain);

function addJs(cb) {
	if (autofront.html5Mode)
		return $.addFiles([{
			name: html5ModeJsFile,
			content: `(function () {
	angular.module('app')
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

function less() {
	return getCssTask('less', $.less);
}

function sass() {
	return getCssTask('scss', gulpSass, '@import "variables";');
}

const styles = gulp.parallel(css, less, sass);

function fonts() {
	return gulp.src(mainBowerFiles())
		.pipe(filter(['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'], true))
		.pipe(gulp.dest(globs.tmp + 'fonts/'));
}

function others() {
	const pugFilter = filter('pug');
	return gulp.src(globs.srcOthers)
		.pipe(pugFilter).pipe($.pug()).on('error', notifyError).pipe(pugFilter.restore)
		.pipe(gulp.dest(globs.tmp));
}

function about() {
	return gulp.src('package.json')
		.pipe($.about({ inject: { domain } }))
		.pipe(gulp.dest(globs.tmp));
}

const buildTmp = gulp.series(
	gulp.parallel(remove, manageDomain),
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
		gulp.src(path.replaceAll('\\', '/').replace(globs.src, globs.tmp).replace('.pug', '.html'), { read: false })
			.pipe($.clean());
		deleteEmpty(globs.tmp);
	});
	gulp.watch([globs.tmpAllFiles, '!' + globs.tmp + getGlob('css')], function (cb) {
		browserSync.reload();
		cb();
	});
}

gulp.task('serve', gulp.series(setDefault, buildTmp, browser, watch));

function removeDist() {
	return delDir(globs.dist);
}
removeDist.displayName = 'remove:dist';

function copy() {
	return gulp.src(globs.tmpAllFiles)
		.pipe(gulp.dest(globs.dist));
}

function buildTemplates() {
	return gulp.src(globs.distTmpls)
		.pipe(gulpHtmlmin())
		.pipe($.angularTemplatecache(jsTemplatesFile, { module: 'app', transformUrl: function (url) { return url.slice(1); } }))
		.pipe(gulp.dest(globs.dist));
}
buildTemplates.displayName = 'build-templates';

function buildIndexDist() {
	const replaces = Object.entries({
		[cssComment]: `<!-- build:css ${stylesCssFile} -->`,
		[endCssComment]: '<!-- endbuild -->',
		[jsComment]: `<!-- build:js ${scriptsJsFile} -->`,
		[endJsComment]: '<!-- endbuild -->'
	});
	var stream = gulp.src(globs.distIndexHtmlFile)
		.pipe(injStr.before(endJsComment, `<script src="${jsTemplatesFile}"></script>` + nl + tab));
	for (let [search, str] of replaces)
		stream = stream.pipe(injStr.replace(search, str));
	return stream
		.pipe($.useref())
		.pipe(gulp.dest(globs.dist));
}
buildIndexDist.displayName = 'build-index:dist';

function removeFiles() {
	return gulp.src([
		...globs.distTmpls,
		globs.dist + getGlob('css'), '!' + globs.dist + stylesCssFile,
		globs.dist + jsFiles, '!' + globs.dist + scriptsJsFile
	], { read: false })
		.pipe($.clean());
}
removeFiles.displayName = 'remove-files';

function clean() {
	return deleteEmpty(globs.dist);
}

let minifyHtml = getMinifyTask('html', stream => stream.pipe(gulpHtmlmin()));
minifyHtml.displayName = 'minify-html';

let minifyCss = getMinifyTask('css', stream => stream.pipe($.cssnano({ zindex: false })));
minifyCss.displayName = 'minify-css';

let minifyJs = getMinifyTask('js', stream => stream.pipe($.ngAnnotate()).pipe($.terser()));
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
	gulp.parallel(buildTmp, removeDist),
	copy, buildTemplates, buildIndexDist, removeFiles, clean, minify, finishBuild
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

function delDir(glob) {
	return gulp.src(glob, { allowEmpty: true, read: false })
		.pipe($.clean());
}

function getCssTask(ext, process, extraCode) {
	let stream = gulp.src(globs.src + stylesDir + indexFilename + '.' + ext, { allowEmpty: true });
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