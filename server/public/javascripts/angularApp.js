var wearableApp =  angular.module('wearableApp', ['ui.router']);

wearableApp.controller('MainCtrl', ['$scope',function($scope){ }]);

wearableApp.controller('navigationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('back button tapped');

	$scope.backBtn = function ($event) {
		$rootScope.$emit($rootScope.actualState + 'BackEvent');
	};

}]);

wearableApp.controller('applicationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('applicationCtrl is running');

	$rootScope.activeState = 'application'; 
	$scope.panelVisibility = 'visible';

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

		$scope.panelVisibility = '';

		$rootScope.$emit('openGestureSettedPanel', appId);
	};

	$rootScope.$on('backToApplicationPanel', function (e) { 
		$scope.panelVisibility = "visible";
		$rootScope.actualState = 'application';
	});

	console.log('end applicationCtrl');
}]);

wearableApp.controller('gestureCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('gestureCtrl is running');

	$rootScope.actualState = 'gesture';

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
		$scope.panelVisibility = 'visible';
		$scope.appCaller = caller;
	});

	$scope.selectGesture = function ($event) {
		console.log('select gesture event click');

		var gestureId = angular.element($event.currentTarget).find('.gesture-el').attr('data-gestureId');

		if (!$rootScope.applicationsGestures['gestures']) {
			$rootScope.applicationsGestures['gestures'] = [];
		}
		$scope.panelVisibility = '';
		$rootScope.$emit('openActionPanel', $scope.appCaller, gestureId);
	};

	$rootScope.$on('backToGesturePanel', function (e) { 
		$scope.panelVisibility = "visible";
		$rootScope.actualState = 'gesture';
	});

	$rootScope.$on('gestureBackEvent', function () {
		$rootScope.$emit('backToApplicationPanel');
        $scope.panelVisibility = '';
	});

	console.log('end gestureCtrl');
}]);

wearableApp.controller('actionCtrl', ['$scope', '$rootScope', '$http' ,function($scope, $rootScope, $http) {

	console.log('actionCtrl is running');

	$rootScope.actualState = 'action';

	$scope.actions = [
			{
				'name': 'play',
				'icon': 'icon',
				'title': 'PLAY',
				'subtitle': 'subtitle',
				'arrow': 'arrow'
			},
			{   
				'name': 'foward',
				'icon': 'icon',
				'title': 'FOWARD ',
				'subtitle': 'subtitle 1',
				'arrow': 'arrow'
			}
		];

	var commands = {
		'foward': {"type":"CHAR_PLZ_MSG","modifiers":0,"character":32},
		'play': {"type":"MEDIAACTION_PLZ_MSG","action":"play"}
	};

	$rootScope.$on('openActionPanel', function (e, appCaller, gestureCaller) {
		$scope.panelVisibility = 'visible';
		$scope.appCaller = appCaller;
		$scope.gestureCaller = gestureCaller;
		$rootScope.actualState = 'action';
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

	$rootScope.$on('actionBackEvent', function () {
		$rootScope.$emit('backToGesturePanel');
        $scope.panelVisibility = '';
	});

	console.log('end actionCtrl');
	
}]);