let autofront = this;
autofront.html5Mode = false;
autofront.domains = {};

const gulp = require('gulp'),
	args = require('get-gulp-args')(),
	mergeStream = require('merge-stream'),
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
	cssFilename = 'index',
	cssFile = cssFilename + '.css';
let stylesDir = 'styles/',
	scriptsDir = 'scripts/',
	jsTemplatesFile = scriptsDir + 'templates.js';

const globs = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
globs.srcIndexHtml = globs.src + indexHtmlFile;
globs.srcJs = globs.src + jsFiles;
globs.srcIndexAndSrcJs = [globs.srcIndexHtml, globs.srcJs];
globs.srcStyles = [globs.src + stylesDir + cssFile, globs.src + getGlob('less'), globs.src + getGlob('scss')];
globs.srcOthers = [globs.src + allFiles, ...[...globs.srcIndexAndSrcJs, ...globs.srcStyles].map(glob => '!' + glob)];
globs.tmpAllFiles = globs.tmp + allFiles;

const nl = '\r\n',
	tab = '	';

function setDefault(cb) {
	defDomain = 'development';
	cb();
}
setDefault.displayName = 'set-default';

function clean() {
	return delDir(globs.tmp);
}

function init() {
	if (autofront.html5Mode) {
		const prefix = '/';
		stylesDir = prefix + stylesDir;
		scriptsDir = prefix + scriptsDir;
		jsTemplatesFile = prefix + jsTemplatesFile;
	}

	const name = args.domain || args.d || defDomain;
	domain = autofront.domains?.[name];
	const isMatched = domain !== undefined;
	return gulp.src(globs.src, { read: false })
		.pipe($.notify(isMatched ? `Matching domain: "${name}".` : 'No domain matched.'));
}

function buildIndex() {
	const filename = 'vendor';
	return gulp.src(globs.srcIndexHtml)
		.pipe(injStrBefore('head', [
			`<!-- build:css ${stylesDir + filename}.css -->`,
			'<!-- bower:css --><!-- endbower -->',
			'<!-- endbuild -->',
			`<link rel="stylesheet" href="${stylesDir + cssFile}">`
		]))
		.pipe(injStrBefore('body', [
			`<!-- build:js ${scriptsDir + filename}.js -->`,
			'<!-- bower:js --><!-- endbower -->',
			'<!-- endbuild -->',
			`<!-- build:js ${scriptsDir + cssFilename}.js -->`,
			'<!-- inject:js -->',
			'<!-- endinject -->',
			'<!-- endbuild -->'
		]))
		.pipe($.inject(gulp.src(globs.srcJs).pipe($.angularFilesort()), { relative: true })).on('error', notifyError)
		.pipe($.wiredep())
		.pipe($.useref())
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

function styles() {
	return mergeStream(getStream('css'), getStream('less', $.less), getStream('scss', gulpSass, '@import "variables";'))
		.pipe($.concat(cssFile))
		.pipe(gulp.dest(globs.tmp + stylesDir))
		.pipe(browserSync.stream());

	function getStream(ext, process, extraCode) {
		let stream = gulp.src(globs.src + stylesDir + cssFilename + '.' + ext, { allowEmpty: true });
		const sep = nl + nl;
		if (process)
			return stream
				.pipe(injStr.prepend(sep + (extraCode ? extraCode + sep : '') + '// bower:' + ext + nl + '// endbower' + sep))
				.pipe($.wiredep())
				.pipe(process()).on('error', notifyError);
		return stream;
	}
}

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
	gulp.parallel(clean, init),
	gulp.parallel(indexAndJs, styles, fonts, others, about)
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
	gulp.watch([globs.tmpAllFiles, '!' + globs.tmp + stylesDir + cssFile], function (cb) {
		browserSync.reload();
		cb();
	});
}

gulp.task('serve', gulp.series(setDefault, buildTmp, browser, watch));

function cleanDist() {
	return delDir(globs.dist);
}
cleanDist.displayName = 'clean:dist';

function copy() {
	return gulp.src(globs.tmpAllFiles)
		.pipe(gulp.dest(globs.dist));
}

function buildTemplates() {
	return gulp.src([globs.dist + getGlob('html'), '!' + globs.dist + indexHtmlFile])
		.pipe($.cleanDest(globs.dist))
		.pipe(minifyHtml())
		.pipe($.angularTemplatecache(jsTemplatesFile, { module: 'app', transformUrl: function (url) { return url.slice(1); } }))
		.pipe(gulp.dest(globs.dist));
}
buildTemplates.displayName = 'build-templates';

function cleanTemplates() {
	return deleteEmpty(globs.dist);
}
cleanTemplates.displayName = 'clean-templates';

function finishBuild() {
	const indexHtmlFilter = filter('html'),
		cssFilter = filter('css'),
		jsFilter = filter('js'),
		cssAndJsFilter = filter(['css', 'js']),
		imgFilter = filter(['png', 'jpg', 'gif', 'svg']),
		jsonFilter = filter('json');
	return gulp.src(globs.dist + allFiles)
		.pipe(indexHtmlFilter).pipe(injStr.before('</body>', tab + `<script src="${jsTemplatesFile}"></script>` + nl)).pipe(minifyHtml()).pipe(indexHtmlFilter.restore)
		.pipe(cssFilter).pipe($.cssnano({ zindex: false })).pipe(cssFilter.restore)
		.pipe(jsFilter).pipe($.ngAnnotate()).pipe($.terser()).pipe(jsFilter.restore)
		.pipe(cssAndJsFilter).pipe($.rev()).pipe($.revDeleteOriginal()).pipe(cssAndJsFilter.restore)
		.pipe($.revReplace())
		.pipe(imgFilter).pipe($.imagemin()).pipe(imgFilter.restore)
		.pipe(jsonFilter).pipe($.jsonmin()).pipe(jsonFilter.restore)
		.pipe($.size({ showFiles: true }))
		.pipe(gulp.dest(globs.dist));
}
finishBuild.displayName = 'finish-build';

gulp.task('build', gulp.series(buildTmp, cleanDist, copy, buildTemplates, cleanTemplates, finishBuild));

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

function filter(ext, isUnrestored) {
	return $.filter(getGlob(ext), { restore: !isUnrestored });
}

function browserSyncInit(path) {
	browserSync.init({ server: path });
}

function minifyHtml() {
	return $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true });
}