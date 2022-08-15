const gulp = require('gulp'),
	args = require('get-gulp-args')(),
	mainBowerFiles = require('main-bower-files'),
	$ = require('gulp-load-plugins')(),
	injStr = $.injectString,
	gulpSync = $.sync(gulp),
	notifyError = $.notify.onError(error => error.message),
	browserSync = require('browser-sync').create();

var domain = undefined;

const allFiles = getFiles(),
	indexHtmlFile = 'index.html',
	stylesFolder = 'styles/',
	cssFilename = stylesFolder+'index',
	jsTemplatesFile = 'scripts/templates.js';

const paths = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
paths.srcIndexHtml = paths.src+indexHtmlFile;
paths.srcLess = paths.src+getFiles('less');
paths.srcJs = paths.src+getFiles('js');
paths.srcOthers = [paths.src+allFiles, '!'+paths.srcIndexHtml, '!'+paths.srcLess, '!'+paths.srcJs];

const nl = '\n',
	tab = '	';

gulp.task('check', () => {
	const pckg = require('./package.json'),
		domainAliases = pckg.domainAliases;
	var domainIndex = args[0]||'local';
	if (domainAliases) {
		const alias = domainAliases[domainIndex];
		if (alias)
			domainIndex = alias;
	}
	domain = pckg.domains[domainIndex];
	return gulp.src(paths.src)
		.pipe(domain?$.notify('Matching domain: "'+domainIndex+'".'):process.exit());
});

gulp.task('del', () => delFolder(paths.tmp));
gulp.task('index-build', () => gulp.src(paths.srcIndexHtml).pipe(injStr.after('<!-- endbuild -->', nl+tab+'<link rel="stylesheet" href="'+cssFilename+'.css">')).pipe($.inject(gulp.src(paths.srcJs).pipe($.angularFilesort()), {relative: true})).pipe($.wiredep()).pipe($.useref()).pipe(gulp.dest(paths.tmp)));
gulp.task('index-domain', () => gulp.src(paths.tmp+getFiles('js')).pipe(injStr.replace('{{AUTOFRONT_DOMAIN}}', domain)).pipe(gulp.dest(paths.tmp)));
gulp.task('index', gulpSync.sync([
	'index-build',
	'index-domain'
]));
gulp.task('styles', () => gulp.src(paths.src+cssFilename+'.less').pipe(injStr.prepend('// bower:less'+nl+'// endbower'+nl)).pipe($.wiredep()).pipe($.less()).on('error', notifyError).pipe(gulp.dest(paths.tmp+stylesFolder)));
gulp.task('fonts', () => gulp.src(mainBowerFiles()).pipe(filter(['eot','otf','svg','ttf', 'woff', 'woff2'], true)).pipe(gulp.dest(paths.tmp+'fonts/')));
gulp.task('others', () => {
	const pugFilter = filter('pug');
	return gulp.src(paths.srcOthers)
		.pipe(pugFilter).pipe($.pug()).on('error', notifyError).pipe(pugFilter.restore)
		.pipe(gulp.dest(paths.tmp));
});
gulp.task('about', () => gulp.src('package.json').pipe($.about()).pipe(gulp.dest(paths.tmp)));
gulp.task('build:tmp', gulpSync.sync([
	'del',
	'check',
	['index', 'styles', 'fonts', 'others', 'about']
]));
gulp.task('browser', ['build:tmp'], () => browserSyncInit(paths.tmp));
gulp.task('serve', ['browser'], () => {
	gulp.watch([paths.srcIndexHtml, paths.srcJs], ['index']);
	gulp.watch(paths.srcLess, ['styles']);
	gulp.watch(paths.srcOthers, ['others']);
	gulp.watch(paths.tmp+allFiles, function(event) {
		browserSync.reload(event.path);
	});
});

gulp.task('del:dist', () => delFolder(paths.dist));
gulp.task('copy', ['del:dist'], () => gulp.src(paths.tmp+allFiles).pipe(gulp.dest(paths.dist)));
gulp.task('templates-build', () => gulp.src([paths.dist+getFiles('html'), '!'+paths.dist+indexHtmlFile]).pipe($.cleanDest(paths.dist)).pipe(minifyHtml()).pipe($.angularTemplatecache(jsTemplatesFile, {module: 'app'})).pipe(gulp.dest(paths.dist)));
gulp.task('templates-clean', () => require('delete-empty')(paths.dist));
gulp.task('templates', gulpSync.sync([
	'templates-build',
	'templates-clean'
]));
gulp.task('build', gulpSync.sync([
	'build:tmp',
	'copy',
	'templates'
]), () => {
	const indexHtmlFilter = filter('html'),
		cssFilter = filter('css'),
		jsFilter = filter('js'),
		cssAndJsFilter = filter(['css','js']),
		imgFilter = filter(['png','jpg','gif','svg']),
		jsonFilter = filter('json');
	return gulp.src(paths.dist+allFiles)
		.pipe(indexHtmlFilter).pipe(injStr.before('</body>', '<script src="'+jsTemplatesFile+'"></script>'+nl)).pipe(minifyHtml()).pipe(indexHtmlFilter.restore)
		.pipe(cssFilter).pipe($.cssnano({zindex: false})).pipe(cssFilter.restore)
		.pipe(jsFilter).pipe($.ngAnnotate()).pipe($.uglify()).pipe(jsFilter.restore)
		.pipe(cssAndJsFilter).pipe($.rev()).pipe($.revDeleteOriginal()).pipe(cssAndJsFilter.restore)
		.pipe($.revReplace())
		.pipe(imgFilter).pipe($.imagemin()).pipe(imgFilter.restore)
		.pipe(jsonFilter).pipe($.jsonmin()).pipe(jsonFilter.restore)
		.pipe($.size({showFiles: true}))
		.pipe(gulp.dest(paths.dist));
});
gulp.task('serve:dist', ['build'], () => browserSyncInit(paths.dist));

gulp.task('default', ['serve']);

function getFiles(ext) {
	ext = ext || '*';
	const isArray = typeof ext != 'string';
	return '**/*.'+(isArray?'{':'')+(isArray?ext.join():ext)+(isArray?'}':'');
}

function delFolder(path) {
	return gulp.src(path, {read: false})
		.pipe($.clean());
}

function filter(ext, isUnrestored) {
	return $.filter(getFiles(ext), {restore: !isUnrestored});
}

function browserSyncInit(path) {
	return browserSync.init({
		server: {
			baseDir: path
		}
	});
}

function minifyHtml() {
	return $.htmlmin({collapseWhitespace: true, conservativeCollapse: true});
}