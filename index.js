const defSettings = {
	html: { pug: false },
	css: {
		folder: 'styles/',
		filename: 'index',
		order: 0,
		less: { order: 1 },
		scss: {
			order: 2,
			variables: '_variables'
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

const gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	notifyError = $.notify.onError(error => error.message),
	gulpFilter = ext => $.filter(getGlob(ext), { restore: true }),
	browserSync = require('browser-sync').create(),
	deleteEmpty = require('delete-empty'),
	gulpHtmlmin = () => $.htmlmin({ collapseWhitespace: true, conservativeCollapse: true }),
	gulpPostcss = name => $.postcss([require(name)()]),
	fs = require('fs'),
	hidefile = require('hidefile');

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
	html5ModeFile = scriptsDir + 'html5-mode.js',
	templatesFile = scriptsDir + 'templates.js',
	endJsComment = '<!-- endautofrontjs -->',
	cssFile = 'index.css',
	jsFile = 'index.js';
let stylesDir,
	stylesFilename,
	cssExtensions = [];

const globs = {
	src: 'src/',
	tmp: '.tmp/',
	dist: 'dist/'
};
globs.hiddenDist = '.' + globs.dist;
globs.srcStyles = globs.src;
globs.srcIndex = globs.src + indexFile;
globs.srcJss = globs.src + jsFiles;
globs.srcOthers = [globs.src + allFiles];
globs.tmpAll = globs.tmp + allFiles;
globs.tmpStyles = globs.tmp;
globs.distIndex = globs.dist + indexFile;
globs.distTmpls = [globs.dist + getGlob('html'), '!' + globs.distIndex];
globs.distCss = globs.dist + cssFile;

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
	for (const prop of ['srcStyles', 'tmpStyles'])
		globs[prop] += stylesDir;

	for (const cssExt of [
		{
			name: 'css',
			process: $.cssimport
		},
		{
			name: 'less',
			process: $.less,
			isPreprocessor: true
		},
		{
			name: 'scss',
			process: $.sass(require('sass')),
			getExtraCode: () => {
				const file = globs.srcStyles + getSetting('variables') + '.scss';
				return fileExists(file) ? `@import "./${file}";` : '';
			},
			isPreprocessor: true
		}
	]) {
		const name = cssExt.name;
		if (!cssExt.isPreprocessor || getSetting(name))
			cssExtensions.push({ getExtraCode: () => '', ...cssExt, order: getSetting(name + 'Order') });
	}
	cssExtensions = cssExtensions.sort((a, b) => a.order - b.order);

	const srcStylesFiles = [];
	for (const cssExt of cssExtensions) {
		const glob = globs.src + getGlob(cssExt.name);
		srcStylesFiles.push(glob);
		cssExt.glob = glob;
	}
	globs.srcOthers.push(...[globs.srcIndex, globs.srcJss, ...srcStylesFiles].map(glob => '!' + glob));

	cb();
}
setVariables.displayName = 'set-variables';

function getEnv() {
	envName = require('get-gulp-args')().env || defEnv;
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
		strs.push('<link rel="stylesheet" href="' + stylesDir + stylesFilename + (name != 'css' ? '.' + name : '') + '.css' + '">');
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
		strs.push(getScriptTag(html5ModeFile));
	}
	strs.push(endJsComment);

	let stream = gulp.src(globs.srcJss);
	if (getSetting('ng'))
		stream = stream.pipe($.angularFilesort());

	return gulp.src(globs.srcIndex)
		.pipe($.injectString.before('</head>', tab + strs.join(nl + tab) + nl))
		.pipe($.inject(stream, { relative: true, transform: filepath => getScriptTag(filepath) })).on('error', notifyError)
		.pipe($.wiredep())
		.pipe($.useref())
		.pipe(gulp.dest(globs.tmp));
}

function js() {
	return gulp.src(globs.srcJss)
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
			name: html5ModeFile,
			content: `(function () {
	angular
		.module('${getSetting('module')}')
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
	const glob = require('main-bower-files')(getGlob(getSetting('extensions')));
	if (glob.length)
		return gulp.src(glob)
			.pipe(gulp.dest(globs.tmp + getSetting('fontsFolder')));

	cb();
}

function others() {
	let stream = gulp.src(globs.srcOthers);
	if (getSetting('pug')) {
		const pugFilter = gulpFilter('pug');
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
	gulp.watch(globs.srcIndex, index);
	gulp.watch(globs.srcJss)
		.on('add', indexAndJs)
		.on('change', gulp.series(js))
		.on('unlink', gulp.series(index))
		.on('unlink', path => { delFile(path); });

	for (cssExt of cssExtensions)
		gulp.watch(cssExt.glob, eval(cssExt.name));

	gulp.watch(globs.srcOthers)
		.on('add', gulp.series(others))
		.on('change', gulp.series(others))
		.on('unlink', path => { delFile(path, replaceExt); });

	gulp.watch([globs.tmpAll, '!' + globs.tmpStyles + getGlob('css')], reload).on('unlink', () => { deleteEmpty(globs.tmp); });

	function delFile(path, fn) {
		path = path.replaceAll('\\', '/').replace(globs.src, globs.tmp);
		if (fn)
			path = fn(path);
		gulp.src(path, { read: false })
			.pipe($.clean());
	}

	function replaceExt(path) {
		if (getSetting('pug'))
			return path.replace('.pug', '.html');
		return path;
	}
}

defineTask('serve', gulp.series(
	gulp.parallel(setDefaultEnv, setVariables),
	buildTmp, browser, watch
));

function removeFolderDist() {
	return delDir([globs.dist, globs.hiddenDist]);
}
removeFolderDist.displayName = 'remove-folder:dist';

function copy() {
	return gulp.src(globs.tmpAll)
		.pipe($.size())
		.pipe(gulp.dest(globs.dist));
}

function templates() {
	let stream = gulp.src(globs.distTmpls)
		.pipe(gulpHtmlmin());
	if (getSetting('template'))
		stream = stream.pipe($.angularTemplatecache(templatesFile, { module: getSetting('module'), transformUrl: url => url.slice(1) }));
	return stream.pipe(gulp.dest(globs.dist));
}

function indexDist() {
	const replaces = Object.entries({
		[cssComment]: `<!-- build:css ${cssFile} -->`,
		[endCssComment]: '<!-- endbuild -->',
		[jsComment]: `<!-- build:js ${jsFile} defer -->`,
		[endJsComment]: '<!-- endbuild -->'
	});
	let stream = gulp.src(globs.distIndex);
	if (getSetting('template') && fileExists(globs.dist + templatesFile))
		stream = stream.pipe($.injectString.before(endJsComment, getScriptTag(templatesFile) + nl + tab));
	for (const [search, str] of replaces)
		stream = stream.pipe($.injectString.replace(search, str));
	return stream
		.pipe($.useref())
		.pipe(gulp.dest(globs.dist));
}
indexDist.displayName = 'index:dist';

function purgeCss() {
	return gulp.src(globs.distCss)
		.pipe($.purgecss({ content: [globs.dist + getGlob('html')] }))
		.pipe(gulp.dest(globs.dist));
}
purgeCss.displayName = 'purge-css';

function rebase() {
	const str = 'url(',
		quotes = ["'", '"'];
	let stream = gulp.src(globs.distCss)
		.pipe(replace(str + '\\s*', str));
	for (char of ['', ...quotes])
		for (str2 of ['http://', 'https://', '//', '/', 'data:', '#'])
			stream = stream.pipe(replace(str + char + str2, str + tab + char + str2));
	stream = stream
		.pipe(replace(str, str + stylesDir))
		.pipe(replace(str + stylesDir + tab, str));
	for (quote of quotes)
		stream = stream.pipe(replace(str + stylesDir + quote, str + quote + stylesDir));
	return stream.pipe(gulp.dest(globs.dist));
}

function cleanFiles() {
	return gulp.src([
		...(getSetting('template') ? globs.distTmpls : []),
		globs.dist + getGlob('css'), '!' + globs.distCss,
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

const rebaseAndClean = gulp.parallel(rebase, clean);

const compatible = gulp.parallel(
	getCompatibleTask('css', stream => stream.pipe(gulpPostcss('autoprefixer'))),
	getCompatibleTask('js', stream => stream.pipe($.babel({ presets: ['@babel/preset-env'], compact: false })))
);

const minify = gulp.parallel(
	getMinifyTask('html', stream => stream.pipe(gulpHtmlmin())),
	getMinifyTask('css', stream => stream.pipe(gulpPostcss('cssnano'))),
	getMinifyTask('js', stream => {
		if (getSetting('ng'))
			stream = stream.pipe($.ngAnnotate());
		return stream.pipe($.terser());
	}),
	getMinifyTask(['png', 'jpg', 'gif', 'svg'], stream => stream.pipe($.imagemin()), 'img'),
	getMinifyTask('json', stream => stream.pipe($.jsonmin()))
);

function finishBuild() {
	const cssAndJsFilter = gulpFilter(['css', 'js']);
	return gulp.src(globs.dist + allFiles)
		.pipe(cssAndJsFilter).pipe($.rev()).pipe($.revDeleteOriginal()).pipe(cssAndJsFilter.restore)
		.pipe($.revReplace())
		.pipe($.size({ showFiles: true }))
		.pipe(gulp.dest(globs.dist));
}
finishBuild.displayName = 'finish-build';

defineTask('build', gulp.series(
	setVariables,
	gulp.parallel(buildTmp, removeFolderDist),
	copy, templates, indexDist, purgeCss, rebaseAndClean, compatible, minify, finishBuild
), 'Build the project.');

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

defineTask('serve:dist', gulp.series(setDefaultEnv, 'build', hideFolderDist, browserDist), 'Serve the built project.');

defineTask('default', gulp.series('serve'));

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
	return $.injectString.replace(search, str);
}

function getStylesTask(ext) {
	const fn = cb => {
		const cssExt = cssExtensions.find(({ name }) => name == ext);
		if (cssExt) {
			const stylesFile = stylesFilename + '.' + ext,
				srcStylesFile = globs.srcStyles + stylesFile,
				isPreprocessor = cssExt.isPreprocessor,
				extraCode = cssExt.getExtraCode(),
				sep = nl + nl,
				content = (extraCode ? extraCode + sep : '') + (isPreprocessor ? '// bower:' + ext + nl + '// endbower' : '');
			let stream;
			if (!fileExists(srcStylesFile))
				stream = $.addFiles([{
					name: stylesFile,
					content
				}]);
			else
				stream = gulp.src(srcStylesFile)
					.pipe($.injectString.prepend(content ? content + sep : ''));
			if (isPreprocessor)
				stream = stream.pipe($.wiredep());
			stream = stream.pipe(cssExt.process()).on('error', notifyError);
			if (isPreprocessor)
				stream = stream.pipe($.rename({ suffix: '.' + ext }));
			return stream
				.pipe(gulp.dest(globs.tmpStyles))
				.pipe(browserSync.stream());
		}

		cb();
	};
	fn.displayName = ext;
	return fn;
}

function browserSyncInit(path) {
	browserSync.init({ server: path });
}

function defineTask(name, composing, description) {
	composing.description = description || 'Serve the project.';
	composing.flags = { '--env': 'Environment name' };
	gulp.task(name, composing);
}

function getCompatibleTask(ext, getProcessedStream) {
	return getProcessingTask('compatible', ext, getProcessedStream);
}

function getMinifyTask(ext, getProcessedStream, str) {
	return getProcessingTask('minify', ext, getProcessedStream, str);
}

function getProcessingTask(prefix, ext, getProcessedStream, str) {
	const fn = () => getProcessedStream(gulp.src(globs.dist + getGlob(ext)))
		.pipe(gulp.dest(globs.dist));
	fn.displayName = prefix + '-' + (str || ext);
	return fn;
}