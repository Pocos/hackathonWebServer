var wearableApp =  angular.module('wearableApp', ['ui.router']);

wearableApp.controller('MainCtrl', ['$scope',function($scope){ }]);

wearableApp.controller('navigationCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	// console.log('back button tapped');

	$scope.backBtn = function ($event) {
		//$rootScope.$emit($rootScope.actualState + 'BackEvent');

		if ($rootScope.panelVisibility == 'saved-gesture') {
			$rootScope.panelVisibility = 'application';
		} 
		if ($rootScope.panelVisibility == 'gesture') {
			$rootScope.panelVisibility = 'application';
		}
		if ($rootScope.panelVisibility == 'action') {
			$rootScope.panelVisibility = 'gesture';
		}
	};
// cmt
}]);



wearableApp.factory('messages',function(){
var messages={};

messages.list=[];

messages.actions=[];

messages.appName;

messages.jsons=[];

messages.addAppName = function(message){
	messages.appName=message;
}

messages.getAppName=function(){
	return messages.appName;
}

messages.addAction=function(message){
	messages.actions.push(message);
}

messages.getActions=function(){
	return messages.actions;
}

messages.resetActions=function(){
	messages.actions=[];
}

messages.addJson=function(appName,messageJson){
	console.log(messageJson);
	// var check=messages.messageJson.appName;
	for (var i=0; i<messages.jsons.length;i++){
		console.log(messages.jsons[i]);
		console.log("end");
		if(messages.jsons[i].appName==appName){
			console.log("trovato");
			messages.jsons[i].gestures.push(messageJson.gestures);
			return;
		}
	}
	console.log("not known");
	console.log(messageJson);
	messages.jsons.push(messageJson);

}

messages.getJson=function(appName){
	return messages.jsons;
}

//not used
  messages.add = function(message){
    messages.list.push({appName: message});
  };


  return messages;
});

wearableApp.controller('applicationCtrl', ['messages','$scope', '$rootScope', function(messages,$scope, $rootScope) {
	// console.log('applicationCtrl is running');

	//$rootScope.activeState = 'application'; 
	$rootScope.panelVisibility = 'application';

	$scope.applications = [
		{
			'name': 'org.videolan.vlc',
			'icon': '/images/vlc.png',
			'title': 'Vlc',
			'subtitle': 'subtitle',
			'arrow': 'arrow'
		},
		{   
			'name': 'com.apple.iWork.Keynote',
			'icon': '/images/keynote.png',
			'title': 'Keynote ',
			'subtitle': 'subtitle 1',
			'arrow': 'arrow'
		}
	];

	$scope.selectApplication = function ($event) {
		messages.resetActions();
		// console.log('select application event click');

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

		messages.addAppName(appId);
		// console.log(messages.getAppName());

		// $rootScope.$emit('openSavedGesturePanel', appId);
		$rootScope.panelVisibility = 'gesture';
	};

	// console.log('end applicationCtrl');
}]);

wearableApp.controller('savedGestureCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
	console.log('savedGestureCtrl is running');

	$scope.gestures = [

		];

	
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

wearableApp.controller('gestureCtrl', ['messages','$scope', '$rootScope', function(message,$scope, $rootScope) {
	// console.log('gestureCtrl is running');

	$scope.gestures = [
			{
				'name': 'TAP',
				'icon': '/images/icn_gesture_1_finger_tap.png',
				'title': 'Tap'
			},
			{   
				'name': 'ONE_FINGER_SWIPE_DOWN',
				'icon': '/images/icn_gesture_1_finger_down.png',
				'title': 'One Finger Down'
			}
		];

	$scope.selectGesture = function ($event) {
		// console.log('select gesture event click');

		var gestureId = angular.element($event.currentTarget).find('.gesture-el').attr('data-gestureId');

		if (!$rootScope.applicationsGestures['gestures']) {
			$rootScope.applicationsGestures['gestures'] = [];
		}

		console.log(gestureId);
		$rootScope.$emit('openActionPanel', gestureId);
	};

	// console.log('end gestureCtrl');
}]);

wearableApp.controller('actionCtrl', ['messages','$scope', '$rootScope', '$http' ,function(messages,$scope, $rootScope, $http) {

	// console.log('actionCtrl is running');

	$scope.actions = [
			{
				'name': 'play',
			},
			{   
				'name': 'spacebar',
			}
		];

	var commands = {
		'spacebar': {"type":"CHAR_PLZ_MSG","modifiers":0,"character":32},
		'play': {"type":"MEDIAACTION_PLZ_MSG","action":"play"}
	};

	$rootScope.$on('openActionPanel', function (e, gestureCaller) {
		$rootScope.panelVisibility = 'action';
		$scope.gestureCaller = gestureCaller;
	});

	$scope.selectAction = function ($event) {
		// console.log('select action event click');

		var item = angular.element($event.currentTarget);
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
		cmd['appName'] = messages.getAppName();
		
		messages.addAction(cmd);
		// console.log(JSON.stringify(messages.getActions()));

		var jsonToSave={
			appName: messages.getAppName(),
			gestures:messages.getActions()
		}

		// messages.addJson(jsonToSave.appName,jsonToSave);

		// $rootScope.applicationsGestures['gestures'].push(cmd);
		
		console.log(JSON.stringify(jsonToSave));
        $http.post("/app_list", JSON.stringify(jsonToSave)).success(function() {
            console.log('post done');
        });
	};

	// console.log('end actionCtrl');
	
}]);