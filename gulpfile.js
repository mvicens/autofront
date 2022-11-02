let autofront = require('./index');
autofront.html.pug = true;
autofront.css = {
	scss: true,
	fonts: { extensions: ['ttf', 'woff2'] }
};
autofront.js.domains = {
	development: 'http://localhost:3001/',
	preproduction: 'http://dev.mydomain/',
	production: 'http://mydomain/'
};