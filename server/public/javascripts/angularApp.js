angular.module('WearableApp', ['ui.router'])

.controller('MainCtrl', [
	'$scope',
	'service',
	'$state',
	function($scope,service,$state){
		$scope.activeTab="home";
		/*$scope.state=$state;
		console.log($scope.state);
		$scope.state=$state.current;
		console.log($scope.state);
		*/
		//console.log($scope.activeTab);

		$scope.changeTab=function(tab){			
			$scope.activeTab=tab;
		}
	}])


}])