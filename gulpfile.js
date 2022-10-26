let autofront = require('./index');
autofront.css.fonts.extensions = ['ttf', 'woff2'];
autofront.js.domains = {
	development: 'http://localhost:3001/',
	preproduction: 'http://dev.mydomain/',
	production: 'http://mydomain/'
};