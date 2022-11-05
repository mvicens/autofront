(function () {
	angular.module('app')
		.run(runBlock);

	function runBlock() {
		console.info('My environment value is: ${AUTOFRONT_ENV}');
	}
})();