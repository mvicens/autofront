(function () {
	angular.module('app')
		.run(runBlock);

	function runBlock() {
		console.info('My environment variable contains:', AUTOFRONT_ENV);
	}
})();