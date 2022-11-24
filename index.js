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
		ng: {
			module: 'app',
			html5Mode: false,
			template: true
		},
		envs: {}
	}
};
const settings = this;
for (const name in defSettings)
	settings[name] = { ...defSettings[name] };

const args = require('get-gulp-args')(),
	gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	injStr = $.injectString,
	notifyError = $.notify.onError(error => error.message),
	gulpSass = $.sass(require('sass')),
	mainBowerFiles = require('main-bower-files'),
	browserSync = require('browser-sync').create(),
	deleteEmpty = require('delete-empty'),
	cssnano = require('cssnano'),
	hidefile = require('hidefile'),
	fs = require('fs');

let defEnv = 'production',
	envName,
	envValue;

const allFiles = getGlob(),
	indexFile = 'index.html',
	scriptsDir = 'scripts/',
	jsFiles = getGlob('js'),
	cssComment = '<!-- autofrontcss -->',
	endCssComment = '<!-- endautofrontcss -->',
	jsComment = '<!-- autofrontjs -->',
	html5ModeJsFile = scriptsDir + 'html5-mode.js',
	jsTemplatesFile = scriptsDir + 'templates.js',
	endJsComment = '<!-- endautofrontjs -->',
	cssFile = 'index.css',
	jsFile = 'index.js';
let stylesDir,
	stylesFilename,
	stylesCssFile,
	cssExtensions = [];

const globs = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
globs.hiddenDist = '.' + globs.dist;
globs.srcIndex = globs.src + indexFile;
globs.srcJs = globs.src + jsFiles;
globs.srcIndexAndJs = [globs.srcIndex, globs.srcJs];
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

	for (const cssExt of [
		{
			name: 'css'
		},
		{
			name: 'less',
			process: $.less
		},
		{
			name: 'scss',
			process: gulpSass,
			getExtraCode: getSetting('variables') ? () => {
				const file = globs.src + stylesDir + '_variables.scss';
				return fileExists(file) ? `@import "${file}";` : '';
			} : undefined
		}
	]) {
		const name = cssExt.name;
		if (!cssExt.process || getSetting(name))
			cssExtensions.push({ getExtraCode: () => '', ...cssExt, order: getSetting(name + 'Order') });
	}
	cssExtensions = cssExtensions.sort((a, b) => a.order - b.order);

	const srcStyles = [];
	for (const cssExt of cssExtensions) {
		const name = cssExt.name,
			glob = globs.src + (name == 'css' ? stylesCssFile : getGlob(name));
		srcStyles.push(glob);
		cssExt.glob = glob;
	}
	globs.srcOthers.push(...[...globs.srcIndexAndJs, ...srcStyles].map(glob => '!' + glob));

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
	hideDir(globs.tmp);
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
	for (const { name } of cssExtensions)
		strs.push('<link rel="stylesheet" href="' + (name == 'css' ? stylesCssFile : stylesDir + stylesFilename + '.' + name + '.css') + '">');
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
	if (getSetting('ng'))
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

const css = getStylesTask('css');

const less = getStylesTask('less');

const scss = getStylesTask('scss');

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

function fonts(cb) {
	const glob = mainBowerFiles(getGlob(getSetting('extensions')));
	if (glob.length)
		return gulp.src(glob)
			.pipe(gulp.dest(globs.tmp + getSetting('fontsFolder')));

	cb();
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

function reload(cb) {
	browserSync.reload();
	cb();
}

function watch() {
	gulp.watch(globs.srcIndexAndJs, indexAndJs);
	for (cssExt of cssExtensions)
		gulp.watch(cssExt.glob, eval(cssExt.name));
	gulp.watch(globs.srcOthers, others).on('unlink', path => {
		path = path.replaceAll('\\', '/').replace(globs.src, globs.tmp);
		if (getSetting('pug'))
			path = path.replace('.pug', '.html');
		gulp.src(path, { read: false })
			.pipe($.clean());
	});
	gulp.watch([globs.tmpAllFiles, '!' + globs.tmp + getGlob('css')], reload).on('unlink', () => {
		deleteEmpty(globs.tmp);
	});
}

gulp.task('serve', gulp.series(
	gulp.parallel(setDefaultEnv, setVariables),
	buildTmp, browser, watch
));

function removeFolderDist() {
	return delDir([globs.dist, globs.hiddenDist]);
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
		stream = stream.pipe($.angularTemplatecache(jsTemplatesFile, { module: getSetting('module'), transformUrl: url => url.slice(1) }));
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
	if (getSetting('template') && fileExists(globs.dist + jsTemplatesFile))
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

const minify = gulp.parallel(
	getMinifyTask('html', stream => stream.pipe(gulpHtmlmin())),
	getMinifyTask('css', stream => stream.pipe($.postcss([cssnano()]))),
	getMinifyTask('js', stream => {
		if (getSetting('ng'))
			stream = stream.pipe($.ngAnnotate());
		return stream.pipe($.terser());
	}),
	getMinifyTask(['png', 'jpg', 'gif', 'svg'], stream => stream.pipe($.imagemin()), 'img'),
	getMinifyTask('json', stream => stream.pipe($.jsonmin()))
);

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

function hideFolderDist(cb) {
	hideDir(globs.dist);
	cb();
}
hideFolderDist.displayName = 'hide-folder:dist';

function browserDist(cb) {
	browserSyncInit(globs.hiddenDist);
	cb();
}
browserDist.displayName = 'browser:dist';

gulp.task('serve:dist', gulp.series(setDefaultEnv, 'build', hideFolderDist, browserDist));

gulp.task('default', gulp.task('serve'));

function getGlob(ext = '*') {
	const glob = '**/*.';
	if (typeof ext == 'string')
		return glob + ext;
	return glob + '{' + ext.join() + ',}';
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
		case 'ng':
			return getValue('js', true);
		case 'module':
		case 'html5Mode':
		case 'template':
			return getValue('js.ng', true, true);
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

function fileExists(path) {
	return fs.existsSync(path);
}

function delDir(glob) {
	return gulp.src(glob, { allowEmpty: true, read: false })
		.pipe($.clean());
}

function hideDir(glob) {
	hidefile.hideSync(glob, error => notifyError(error));
}

function getScriptTag(src) {
	return `<script src="${src}" defer></script>`;
}

function replace(search, str) {
	for (const char of ['$', '.', '/', '('])
		search = search.replaceAll(char, '\\' + char);
	return injStr.replace(search, str);
}

function getStylesTask(ext) {
	const fn = cb => {
		const cssExt = cssExtensions.find(({ name }) => name == ext);
		if (cssExt) {
			const stylesFile = stylesFilename + '.' + ext,
				srcStylesFile = globs.src + stylesDir + stylesFile,
				process = cssExt.process,
				extraCode = cssExt.getExtraCode(),
				sep = nl + nl,
				content = (extraCode ? extraCode + sep : '') + (process ? '// bower:' + ext + nl + '// endbower' : '');
			let stream;
			if (!fileExists(srcStylesFile))
				stream = $.addFiles([{
					name: stylesFile,
					content
				}]);
			else
				stream = gulp.src(srcStylesFile)
					.pipe(injStr.prepend(content ? content + sep : ''));
			if (process)
				stream = stream
					.pipe($.wiredep())
					.pipe(process()).on('error', notifyError)
					.pipe($.rename({ suffix: '.' + ext }));
			return stream
				.pipe(gulp.dest(globs.tmp + stylesDir))
				.pipe(browserSync.stream());
		}

		cb();
	};
	fn.displayName = ext;
	return fn;
}

function filter(ext) {
	return $.filter(getGlob(ext), { restore: true });
}

function browserSyncInit(path) {
	browserSync.init({ server: path });
}

function gulpHtmlmin() {
	return $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true });
}

function getMinifyTask(ext, getProcessedStream, str) {
	const fn = () => getProcessedStream(gulp.src(globs.dist + getGlob(ext)))
		.pipe(gulp.dest(globs.dist));
	fn.displayName = 'minify-' + (str || ext);
	return fn;
}