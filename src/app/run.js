(function () {
	angular.module('app')
		.run(runBlock);

	function runBlock() {
		console.info('My domain is: ${AUTOFRONT_DOMAIN}');
	}
})();