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
					template: '<h2>Ticket List for user {{device_id}}</h2>'+
					'<table border=4>'+
					'<thead>'+
					'<tr>'+
					'<td>Device Id</td>'+
					'<td>Timestamp</td>'+
					'</thead>'+
					'<tr ng-repeat="ticket in ticket_list|orderBy:\'timestamp\'">'+
					'<td>{{ticket.device_id}}</td>'+
					'<td>{{ticket.timestamp}}</td>'+
					'<td><a href="#/open_console/{{user.device_id}}">Open Console</a></td>'+
					'</td></tr></table>',
					controller: 'UserTicketController'
				}
			}
		})
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
					template: '<h2>Ticket List</h2>'+
					'<table border=4>'+
					'<thead>'+
					'<tr>'+
					'<td>Device Id</td>'+
					'<td>Timestamp</td>'+
					'</thead>'+
					'<tr ng-repeat="ticket in ticket_list|orderBy:\'timestamp\'">'+
					'<td>{{ticket.device_id}}</td>'+
					'<td>{{ticket.timestamp}}</td>'+
					'<td><a href="#/open_console/{{ticket.device_id}}">Open Console</a></td>'+
					'</td></tr></table>'+
					'Automatic Refresh: <input type="checkbox" ng-model="refresh" ng-change="change()"> <br/>',
					controller: 'TicketListController',
				}
			}
		});
	}])

.factory('service', ['$http', function($http){
	var o = {
		user_list: [], ticket_list: [], user_ticket_list: []
	};
	o.getUserList = function() {
		return $http.get('/user_list').success(function(data){
			angular.copy(data, o.user_list);
		});
	};

	o.getAllTicketList= function() {
		return $http.get('/ticket_list/all').success(function(data){
			angular.copy(data, o.ticket_list);
		});
	};

	o.getUserTicketList= function(id) {
		return $http.get('/ticket_list/'+id).success(function(data){
			angular.copy(data, o.user_ticket_list);
		});
	};

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
		console.log($stateParams.device_id);
		$scope.device_id=$stateParams.device_id;
		service.getUserTicketList($stateParams.device_id);
		$scope.ticket_list = service.user_ticket_list;


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