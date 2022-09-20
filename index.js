this.html5Mode = html5Mode;

const gulp = require('gulp'),
	path = require('path'),
	args = require('get-gulp-args')(),
	mergeStream = require('merge-stream'),
	mainBowerFiles = require('main-bower-files'),
	$ = require('gulp-load-plugins')(),
	injStr = $.injectString,
	gulpSass = $.sass(require('sass')),
	notifyError = $.notify.onError(error => error.message),
	browserSync = require('browser-sync').create(),
	deleteEmpty = require('delete-empty');

let domain = undefined;

const allFiles = getFiles(),
	indexHtmlFile = 'index.html',
	cssFilename = 'index',
	cssFullFilename = cssFilename + '.css';
let stylesFolder = 'styles/',
	jsTemplatesFile = 'scripts/templates.js';

const paths = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
paths.srcIndexHtml = paths.src + indexHtmlFile;
paths.srcCss = paths.src + stylesFolder + cssFullFilename;
paths.srcLess = paths.src + getFiles('less');
paths.srcSass = paths.src + getFiles('scss');
paths.srcJs = paths.src + getFiles('js');
paths.srcOthers = [paths.src + allFiles, '!' + paths.srcIndexHtml, '!' + paths.srcCss, '!' + paths.srcLess, '!' + paths.srcSass, '!' + paths.srcJs];

const nl = '\n',
	tab = '	';

gulp.task('check', () => {
	const pckg = require(path.resolve('package.json')),
		domains = pckg.domains;
	let domainIndex = args[0] || 'local';
	if (domains) {
		const domainAliases = pckg.domainAliases;
		if (domainAliases) {
			const alias = domainAliases[domainIndex];
			if (alias)
				domainIndex = alias;
		}
		domain = domains[domainIndex];
	}
	const isMatched = domain !== undefined;
	return gulp.src(paths.src)
		.pipe($.notify(isMatched ? `Matching domain: "${domainIndex}".` : 'No domain matched.'));
});
gulp.task('del', () => delFolder(paths.tmp));
gulp.task('index-build', () => gulp.src(paths.srcIndexHtml).pipe(injStr.after('<!-- endbuild -->', nl + tab + `<link rel="stylesheet" href="${stylesFolder}${cssFullFilename}">`)).pipe($.inject(gulp.src(paths.srcJs).pipe($.angularFilesort()), { relative: true })).on('error', notifyError).pipe($.wiredep()).pipe($.useref()).pipe(gulp.dest(paths.tmp)));
gulp.task('index-domain', () => gulp.src(paths.tmp + getFiles('js')).pipe(injStr.replace('{{AUTOFRONT_DOMAIN}}', domain)).pipe(gulp.dest(paths.tmp)));
gulp.task('index', gulp.series('index-build', 'index-domain'));
gulp.task('styles', () => {
	return mergeStream(getStream('css'), getStream('less', $.less), getStream('scss', gulpSass, '@import "variables";'))
		.pipe($.concat(cssFullFilename))
		.pipe(gulp.dest(paths.tmp + stylesFolder))
		.pipe(browserSync.stream());

	function getStream(ext, process, extraCode) {
		let stream = gulp.src(paths.src + stylesFolder + cssFilename + '.' + ext, { allowEmpty: true });
		if (process)
			return stream.pipe(injStr.prepend((extraCode ? extraCode + nl : '') + '// bower:' + ext + nl + '// endbower' + nl)).pipe($.wiredep())
				.pipe(process()).on('error', notifyError);
		return stream;
	}
});
gulp.task('fonts', () => gulp.src(mainBowerFiles()).pipe(filter(['eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'], true)).pipe(gulp.dest(paths.tmp + 'fonts/')));
gulp.task('others', () => {
	const pugFilter = filter('pug');
	return gulp.src(paths.srcOthers)
		.pipe(pugFilter).pipe($.pug()).on('error', notifyError).pipe(pugFilter.restore)
		.pipe(gulp.dest(paths.tmp));
});
gulp.task('about', () => gulp.src('package.json').pipe($.about()).pipe(gulp.dest(paths.tmp)));
gulp.task('build:tmp', gulp.series('del', 'check', gulp.parallel('index', 'styles', 'fonts', 'others', 'about')));
gulp.task('browser', gulp.series('build:tmp', (cb) => {
	browserSyncInit(paths.tmp);
	cb();
}));
gulp.task('serve', gulp.series('browser', () => {
	gulp.watch([paths.srcIndexHtml, paths.srcJs], gulp.task('index'));
	gulp.watch([paths.srcCss, paths.srcLess, paths.srcSass], gulp.task('styles'));
	gulp.watch(paths.srcOthers, gulp.task('others')).on('unlink', function (path) {
		gulp.src(path.replaceAll('\\', '/').replace(paths.src, paths.tmp).replace('.pug', '.html')).pipe($.clean());
		deleteEmpty(paths.tmp);
	});
	gulp.watch([paths.tmp + allFiles, '!' + paths.tmp + stylesFolder + cssFullFilename], function (cb) {
		browserSync.reload();
		cb();
	});
}));

gulp.task('del:dist', () => delFolder(paths.dist));
gulp.task('copy', gulp.series('del:dist', () => gulp.src(paths.tmp + allFiles).pipe(gulp.dest(paths.dist))));
gulp.task('templates-build', () => gulp.src([paths.dist + getFiles('html'), '!' + paths.dist + indexHtmlFile]).pipe($.cleanDest(paths.dist)).pipe(minifyHtml()).pipe($.angularTemplatecache(jsTemplatesFile, { module: 'app', transformUrl: function (url) { return url.slice(1); } })).pipe(gulp.dest(paths.dist)));
gulp.task('templates-clean', () => deleteEmpty(paths.dist));
gulp.task('templates', gulp.series('templates-build', 'templates-clean'));
gulp.task('build', gulp.series('build:tmp', 'copy', 'templates', () => {
	const indexHtmlFilter = filter('html'),
		cssFilter = filter('css'),
		jsFilter = filter('js'),
		cssAndJsFilter = filter(['css', 'js']),
		imgFilter = filter(['png', 'jpg', 'gif', 'svg']),
		jsonFilter = filter('json');
	return gulp.src(paths.dist + allFiles)
		.pipe(indexHtmlFilter).pipe(injStr.before('</body>', `<script src="${jsTemplatesFile}"></script>` + nl)).pipe(minifyHtml()).pipe(indexHtmlFilter.restore)
		.pipe(cssFilter).pipe($.cssnano({ zindex: false })).pipe(cssFilter.restore)
		.pipe(jsFilter).pipe($.ngAnnotate()).pipe($.terser()).pipe(jsFilter.restore)
		.pipe(cssAndJsFilter).pipe($.rev()).pipe($.revDeleteOriginal()).pipe(cssAndJsFilter.restore)
		.pipe($.revReplace())
		.pipe(imgFilter).pipe($.imagemin()).pipe(imgFilter.restore)
		.pipe(jsonFilter).pipe($.jsonmin()).pipe(jsonFilter.restore)
		.pipe($.size({ showFiles: true }))
		.pipe(gulp.dest(paths.dist));
}));
gulp.task('serve:dist', gulp.series('build', () => browserSyncInit(paths.dist)));

gulp.task('default', gulp.task('serve'));

function html5Mode() {
	const pathPrefix = '/';
	stylesFolder = pathPrefix + stylesFolder;
	jsTemplatesFile = pathPrefix + jsTemplatesFile;
}

function getFiles(ext = '*') {
	const isArray = typeof ext != 'string';
	return '**/*.' + (isArray ? '{' : '') + (isArray ? ext.join() : ext) + (isArray ? '}' : '');
}

function delFolder(path) {
	return gulp.src(path, { allowEmpty: true, read: false })
		.pipe($.clean());
}

function filter(ext, isUnrestored) {
	return $.filter(getFiles(ext), { restore: !isUnrestored });
}

function browserSyncInit(path) {
	browserSync.init({
		server: {
			baseDir: path
		}
	});
}

function minifyHtml() {
	return $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true });
}