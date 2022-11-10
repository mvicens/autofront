const autofront = require('./index');

autofront.html.pug = true;
autofront.css = {
	scss: true,
	fonts: { extensions: ['ttf', 'woff2'] }
};
autofront.js.envs = {
	development: {
		domain: 'http://localhost:3001/',
		apiKey: 1234567890,
		hasPort: true
	},
	preproduction: {
		domain: 'http://dev.mydomain/',
		apiKey: 987654321,
		hasPort: false
	},
	production: {
		domain: 'http://mydomain/',
		apiKey: 1029384756,
		hasPort: false
	}
};