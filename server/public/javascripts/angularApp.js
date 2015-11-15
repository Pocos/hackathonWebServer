var wearableApp =  angular.module('wearableApp', ['ui.router']);

wearableApp.controller('MainCtrl', ['$scope',function($scope){ }]);

wearableApp.controller('navigationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('back button tapped');

	$scope.backBtn = function ($event) {
		//$rootScope.$emit($rootScope.actualState + 'BackEvent');

		if ($rootScope.panelVisibility == 'saved-gesture') {
			$rootScope.panelVisibility = 'application';
		} 
		if ($rootScope.panelVisibility == 'gesture') {
			$rootScope.panelVisibility = 'saved-gesture';
		}
		if ($rootScope.panelVisibility == 'action') {
			$rootScope.panelVisibility = 'gesture';
		}
	};

}]);

wearableApp.controller('applicationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('applicationCtrl is running');

	//$rootScope.activeState = 'application'; 
	$rootScope.panelVisibility = 'application';

	$scope.applications = [
		{
			'name': 'org.videolan.vlc',
			'icon': 'icon',
			'title': 'VLC',
			'subtitle': 'subtitle',
			'arrow': 'arrow'
		},
		{   
			'name': 'supercazzola',
			'icon': 'icon',
			'title': 'TITLE 1 ',
			'subtitle': 'subtitle 1',
			'arrow': 'arrow'
		}
	];

	$scope.selectApplication = function ($event) {
		console.log('select application event click');

		var appId = angular.element($event.currentTarget).find('.app-el').attr('data-applicationId');
		if ($rootScope.applicationsGestures && $rootScope.applicationsGestures['appName'] !=  appId) {
			$rootScope.applicationsGestures = {
				'appName': appId
			}		}
		else {
			$rootScope.applicationsGestures = {
				'appName': appId
			}
		}

		$rootScope.$emit('openSavedGesturePanel', appId);
	};

	console.log('end applicationCtrl');
}]);

wearableApp.controller('savedGestureCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('savedGestureCtrl is running');

	$scope.gestures = [

		];

	$rootScope.$on('openSavedGesturePanel', function (e, caller) {
		$rootScope.panelVisibility = 'saved-gesture';
		$scope.appCaller = caller;
	});
	$scope.selectGesture = function ($event) {
		console.log('select gesture event click');

		var gestureId = angular.element($event.currentTarget).find('.gesture-el').attr('data-gestureId');

		if (!$rootScope.applicationsGestures['gestures']) {
			$rootScope.applicationsGestures['gestures'] = [];
		}
		$rootScope.$emit('openActionPanel', $scope.appCaller, gestureId);
	};
	$scope.addGesture = function ($event) {
		$rootScope.$emit('openGesturePanel', $scope.appCaller);
	};

	console.log('end savedGestureCtrl');
}]);

wearableApp.controller('gestureCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('gestureCtrl is running');

	$scope.gestures = [
			{
				'name': 'tap',
				'icon': 'icon',
				'title': 'TAP',
				'subtitle': 'subtitle',
				'arrow': 'arrow'
			},
			{   
				'name': 'swype',
				'icon': 'icon',
				'title': 'SWYPE ',
				'subtitle': 'subtitle 1',
				'arrow': 'arrow'
			}
		];

	$rootScope.$on('openGesturePanel', function (e, caller) {
		$rootScope.panelVisibility = 'gesture';
		$scope.appCaller = caller;
	});

	$scope.selectGesture = function ($event) {
		console.log('select gesture event click');

		var gestureId = angular.element($event.currentTarget).find('.gesture-el').attr('data-gestureId');

		if (!$rootScope.applicationsGestures['gestures']) {
			$rootScope.applicationsGestures['gestures'] = [];
		}
		$rootScope.$emit('openActionPanel', $scope.appCaller, gestureId);
	};

	console.log('end gestureCtrl');
}]);

wearableApp.controller('actionCtrl', ['$scope', '$rootScope', '$http' ,function($scope, $rootScope, $http) {

	console.log('actionCtrl is running');

	$scope.actions = [
			{
				'name': 'play',
			},
			{   
				'name': 'foward',
			}
		];

	var commands = {
		'foward': {"type":"CHAR_PLZ_MSG","modifiers":0,"character":32},
		'play': {"type":"MEDIAACTION_PLZ_MSG","action":"play"}
	};

	$rootScope.$on('openActionPanel', function (e, appCaller, gestureCaller) {
		$rootScope.panelVisibility = 'action';
		$scope.appCaller = appCaller;
		$scope.gestureCaller = gestureCaller;
	});

	$scope.selectAction = function ($event) {
		console.log('select action event click');

		var item = angular.element($event.currentTarget);
		item.parent().find('.action-item').removeClass('disabled');
		item.addClass('disabled');

		var actionId = angular.element($event.currentTarget).find('.action-el').attr('data-actionId');

		if ($rootScope.applicationsGestures['gestures'].length != 0) {
			for (var i = 0; i < $rootScope.applicationsGestures['gestures'].length; i++) {
				if ($rootScope.applicationsGestures['gestures'][i]['name'] == $scope.gestureCaller) {
					$rootScope.applicationsGestures['gestures'].splice(i, 1);
				}
			}
		}
		var cmd = commands[actionId];
		cmd['name'] = $scope.gestureCaller;
		cmd['appName'] = $scope.appCaller;
		$rootScope.applicationsGestures['gestures'].push(cmd);
		
		console.log(JSON.stringify($rootScope.applicationsGestures)); 
        $http.post("/app_list", JSON.stringify($rootScope.applicationsGestures)).success(function() {
            console.log('post done');
        });
	};

	console.log('end actionCtrl');
	
}]);