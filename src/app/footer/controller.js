(function () {
	angular.module('app')
		.controller('FooterController', FooterController);

	function FooterController($scope, $http) {
		$scope.version;
		$scope.links;

		function activate() {
			$http.get('about.json').then(function (response) {
				$scope.version = response.data.version;
			});
			$scope.links = [
				{
					url: 'https://github.com/mvicens/autofront',
					icon: 'github'
				},
				{
					url: 'https://www.npmjs.com/package/autofront',
					icon: 'npm'
				}
			];
		}

		activate();
	}
})();