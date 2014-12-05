(function (socket) {	

	socket.init = function(server){
		var io=require('socket.io').listen(server);

		io.sockets.on('connection', function (socket) {
			console.log("Connected");
			//console.log(socket);
			socket.emit("login_request", {});
			

			socket.on('master_user', function(msg){
				console.log("master user");
				console.log(msg);				
			});

			socket.on('command_issued', function(msg){
					console.log("Sending command");
					console.log(msg);
					socket.emit('ctrlCmd',msg);
			});

			socket.on('slave_user', function(cmd){
				console.log("slave user");
				console.log(cmd);
			});
		});
	}

})(module.exports);