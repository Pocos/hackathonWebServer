angular.module('EnnovaServer', ['ui.router']).config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise("/");
		$stateProvider
		.state('home', {
			url: "/",
			views: {
				"body-view": {
					templateUrl: "partial/home"
				}
			}
		})
		.state('user_list', {
			url: "/user_list",
			views: {
				"body-view": {
					templateUrl: "partial/user_list",
					controller: 'UserListController',
				}
				
			}
		})
		.state('user-ticket_list', {
			url: "/ticket_list/:device_id",
			views: {
				"body-view":
				{
					templateUrl: "partial/user-ticket_list",
					controller: 'UserTicketController'
				}
			}
		})
		.state('user_gcm', {
			url: "/user_gcm/:device_id",
			views: {
				"body-view": {
					templateUrl: "partial/user_gcm",
					controller: 'UserGcmController',
				}
				
			}
		})
		//not used anymore. Once upon a time it was used for the socket io part
		.state('user-console', {
			url: "/open_console/:device_id",
			views: {
				"body-view":
				{
					template: '<h2>Console for user {{device_id}}</h2>'+
					'<div style="background-color: #FFFFFF;">'+
					'<li ng-repeat=" command in commands track by $index">'+
					'{{command}}</li>'+
					'<form role="form" ng-submit="send_command()">'+
					'<div class="form-group">'+
					'<input type="text" class="form-control" ng-model="cmd_text" placeholder="Insert command">'+
					'</div>'+
					'</form>'+
					'</div>',
					controller: 'UserConsole'
				}
			}
		})
		.state('ticket_list', {
			url: "/ticket_list",
			views: {
				"body-view":
				{
					templateUrl: "partial/ticket_list",
					controller: 'TicketListController',
				}
			}
		});
	}])

//This factory manages both the users and the tickets
.factory('service', ['$http', function($http){
	var o = {
		user_list: [], ticket_list: [], user_ticket_list: []
	};

//Get all the users
o.getUserList = function() {
	return $http.get('/user_list').success(function(data){
		angular.copy(data, o.user_list);
	});
};
//Get all the tickets of all the users
o.getAllTicketList= function() {
	return $http.get('/ticket_list/all').success(function(data){
		angular.copy(data, o.ticket_list);
	});
};

//Get all the tickets of the specified user
o.getUserTicketList= function(device_id) {
	return $http.get('/ticket_list/'+device_id).success(function(data){
		angular.copy(data, o.user_ticket_list);
	});
};

//Delete all the tickets for the specified user
o.deleteUserTicketList=function(device_id){
	return $http.delete('/ticket_list/'+device_id+'/all').success(function(data){
	});
};

//Delete the specified ticket for the specified user
o.deleteUserSingleTicket=function(device_id,ticket_id){
	return $http.delete('/ticket_list/'+device_id+'/'+ticket_id).success(function(data){
	});
};

//Delete the user specified	
o.deleteUser=function(device_id){
	return $http.delete('/user_list/'+device_id).success(function(data){
	});
};
return o;
}])

//This factory handle the HTTP messages between the angular app to the server
.factory('command_service', ['$http', function($http){
	var o = {
		commands:[]
	};

	o.sendCommand=function(cmd){
		return $http.post('/send_command/',cmd).success(function(data){	
		});
	}

	o.getCommand=function(cmd){
		return $http.post('/command_list/',cmd).success(function(data){
			angular.copy(data,o.commands);
		})
	}
	
	return o;
}])

//Factory that handle SOCKET-IO events and forward them to angular. That's needed in order to use $scope
.factory('socket', ['$rootScope', function ($rootScope) {
	var socket = io.connect();
	
	return {
		on: function (eventName, callback) {
			function wrapper() {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			}

			socket.on(eventName, wrapper);

			return function () {
				socket.removeListener(eventName, wrapper);
			};
		},

		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if(callback) {
						callback.apply(socket, args);
					}
				});
			});
		},
		isConnected: function(){
			if(socket.connected==false)
				return false;
			else return true;
		}
	};
}])

.controller('MainCtrl', [
	'$scope',
	'service',
	'$state',
	function($scope,service,$state){
		$scope.state=$state;
		console.log($scope.state);
		$scope.state=$state.current;
		console.log($scope.state);
		
	}])

.controller('UserListController', [
	'$scope',
	'service',
	'$state',
	'$interval',
	function($scope,service,$state,$interval){
		//used for refresh purpose
		var loop;
		service.getUserList();
		$scope.user_list = service.user_list;

//Delete all the tickets for the specified user and then delete the user
$scope.delete=function(device_id){
	service.deleteUserTicketList(device_id);
	service.deleteUser(device_id);
			//Refresh the view
			service.getUserList();
		}
		
//Refresh user_list without to reload whole page
$scope.change=function(){
	if($scope.refresh==true){
		if (angular.isDefined(loop) ) return;
		loop=$interval(function(){
			//console.log("a");
			service.getUserList();				
		},1000);	
	}
	else{
		if (angular.isDefined(loop)) {
			$interval.cancel(loop);
			loop = undefined;
		}
	}
}


//Stop the automatic refreh when change view (when the view changes, the scope is destroyed)
$scope.$on('$destroy', function(e) {
	if (angular.isDefined(loop)) {
		$interval.cancel(loop);
		loop = undefined;
	}
});

}])

.controller('UserTicketController', [
	'$scope',
	'service',
	'$stateParams',
	'$state',
	function($scope,service,$stateParams,$state){
		//open ticket list for desidered user
		//console.log($stateParams.device_id);
		$scope.device_id=$stateParams.device_id;
		service.getUserTicketList($stateParams.device_id);
		$scope.ticket_list = service.user_ticket_list;

//Delete all the tickets for the specified user and then delete the user
$scope.delete=function(device_id,ticket_id){	
	service.deleteUserSingleTicket(device_id,ticket_id);
	//Refresh the view
	service.getUserTicketList(device_id);
}

}])


.controller('UserGcmController', [
	'$scope',
	'command_service',
	'$stateParams',
	'$state',
	'$interval',
	function($scope,command_service,$stateParams,$state,$interval){
		//used to poll for response
		var loop;

		$scope.commands=[];
		$scope.device_id=$stateParams.device_id;
		$scope.commands=command_service.commands;

		//Sometimes you need to use old-fashioned style to get data, because here the $scope.aps_list
		//doesn't work
		var selectedAP="";
		
		//--------------SCAN AP PART-------------------------

		$scope.scanAP=function(){
			$scope.scanAP_view=true;
			$scope.connectAP_view=false;
			$scope.wifi_status_view=false;
			$scope.vpn_view=false;
			$scope.apk_view=false;
		//	$scope.commands.push("Selected AP Scan");
		if (angular.isDefined(loop)) {
			$interval.cancel(loop);
			loop = undefined;
		}

		var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.SCAN_AP",message_json :{}};
		command_service.sendCommand(data);

		loop=$interval(function(){
			//Prepare the conditions to search for in the DB. Limit is the number of items to be displayer
			//if the limit is unset all the results will be displayed
			var data={device_id: $scope.device_id, action: "SCAN_AP", limit: ""};
			command_service.getCommand(data);				
		},1000);
	}

		//---------------------------CONNECT AP PART---------------------------------
		$scope.connectWifi=function(){
			$scope.scanAP_view=false;
			$scope.connectAP_view=true;
			$scope.wifi_status_view=false;
			$scope.vpn_view=false;
			$scope.apk_view=false;
			if (angular.isDefined(loop)) {
				$interval.cancel(loop);
				loop = undefined;
			}

			var data={device_id: $scope.device_id, action: "SCAN_AP", limit: "1"};
			command_service.getCommand(data);
			console.log($scope.commands);

		}

		$scope.changeAP=function(aps_list){
			selectedAP=aps_list.ssid;
		}

		$scope.connectAP=function(){
			console.log(selectedAP);
			console.log($scope.pwd_text)
			var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.CONNECT_TO_WIFI",message_json : {ssid: selectedAP, password: $scope.pwd_text}};
			command_service.sendCommand(data);
			$scope.pwd_text="";		
		}

	//---------------------------- WIFI STATUS PART -----------------------------------
	$scope.wifi_status=function(){
		$scope.scanAP_view=false;
		$scope.connectAP_view=false;
		$scope.wifi_status_view=true;
		$scope.vpn_view=false;
		$scope.apk_view=false;
		if (angular.isDefined(loop)) {
			$interval.cancel(loop);
			loop = undefined;
		}
		

		loop=$interval(function(){
			//Prepare the conditions to search for in the DB. Limit is the number of items to be displayer
			//if the limit is unset all the results will be displayed			
			var data={device_id: $scope.device_id, action: "WIFI_STATUS", limit: ""};
			command_service.getCommand(data);				
		},1000);

	}

//---------------------------- VPN PART -----------------------------------
	$scope.vpn=function(){
		$scope.scanAP_view=false;
		$scope.connectAP_view=false;
		$scope.wifi_status_view=false;
		$scope.vpn_view=true;
		$scope.apk_view=false;
		if (angular.isDefined(loop)) {
			$interval.cancel(loop);
			loop = undefined;
		}

		loop=$interval(function(){
			//Prepare the conditions to search for in the DB. Limit is the number of items to be displayer
			//if the limit is unset all the results will be displayed			
			var data={device_id: $scope.device_id, action: "VPN", limit: "1"};
			command_service.getCommand(data);				
		},1000);
	}

	$scope.connectVPN=function(){
		var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.VPN",message_json : {open: "true"}};
		command_service.sendCommand(data);
	}

	$scope.disconnectVPN=function(){
		var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.VPN",message_json : {open: "false"}};
		command_service.sendCommand(data);	
	}

//---------------------------- APK PART -----------------------------------
	$scope.apk=function(){
		$scope.scanAP_view=false;
		$scope.connectAP_view=false;
		$scope.wifi_status_view=false;
		$scope.vpn_view=false;
		$scope.apk_view=true;

		if (angular.isDefined(loop)) {
			$interval.cancel(loop);
			loop = undefined;
		}

		var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.APK_LIST",message_json :{}};
		command_service.sendCommand(data);	


		loop=$interval(function(){
			//Prepare the conditions to search for in the DB. Limit is the number of items to be displayer
			//if the limit is unset all the results will be displayed			
			var data={device_id: $scope.device_id, action: "APK_LIST", limit: "1"};
			command_service.getCommand(data);				
		},1000);	
	}

	$scope.requestAPKs=function(){
		var data={device_id: $scope.device_id, action: "it.tonicminds.ennova.intent.action.APK_LIST",message_json :{}};
		command_service.sendCommand(data);	
	}
//---------------------------- SPEAK PART -----------------------------------




$scope.$on('$destroy', function(e) {
	if (angular.isDefined(loop)) {
		$interval.cancel(loop);
		loop = undefined;
	}
});

}])


.controller('UserConsole', [
	'$scope',
	'service',
	'$stateParams',
	'$state',
	'socket',
	function($scope,service,$stateParams,$state,socket){
		$scope.commands=[];
		//open ticket list for desidered user
		$scope.device_id=$stateParams.device_id;

		if(socket.isConnected())
			$scope.commands.push("Connection Opened");
		else
			$scope.commands.push("Connection Closed");
		//Connect the angular client () to the server websocket, using the socket factory
		socket.on("login_request",function(msg){
			socket.emit('master_user',{device_id: $scope.device_id, cmd: $scope.cmd_text});
			$scope.commands.push("Connection Opened");
		})		

		//Send gcm command to open websocket		

		$scope.send_command=function(){
			socket.emit('command_issued',{device_id: $scope.device_id, cmd: $scope.cmd_text});
			$scope.commands.push($scope.cmd_text);
			$scope.cmd_text="";
		}
		
	}])

.controller('TicketListController', [
	'$scope',
	'service',
	'$state',
	'$interval',
	function($scope,service,$state,$interval){
		var loop;
		service.getAllTicketList();
		$scope.ticket_list = service.ticket_list;

		//Refresh user_list without to reload whole page
		$scope.change=function(){
			if($scope.refresh==true){
				if (angular.isDefined(loop) ) return;
				loop=$interval(function(){
					service.getAllTicketList();				
				},1000);	
			}
			else{
				if (angular.isDefined(loop)) {
					$interval.cancel(loop);
					loop = undefined;
				}
			}

		}
//Stop the automatic refreh when change view (when the view changes, the scope is destroyed)
$scope.$on('$destroy', function(e) {
	if (angular.isDefined(loop)) {
		$interval.cancel(loop);
		loop = undefined;
	}
});
}])