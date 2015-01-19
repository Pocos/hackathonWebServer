var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var Command = mongoose.model('Command');
var async = require('async');
var router = express.Router();
var GCM = require('gcm').GCM;
var http = require('http');//to POST to ennova server

//API KEY. You can obtain it from console.developer.google.com
var gcm = new GCM('AIzaSyAZmb3Q4nAK9zYgXJRs7wdQbhN0eaZkV1M');

//Angular -> Server --GCM--> device
//Post command called by the angular client
exports.sendGCMCommand = function(req, res, next) {
	console.log(req.body.device_id);
	console.log(req.body.action);
	console.log(req.body.message_json);
	//JSON TO SEND
	var json_data=[];

	User.find({device_id: req.body.device_id},function(err, users){
		if(err){ return next(err); }
		if(!users[0]) 
		{
			console.log("User does not exist");
			return;
		}
		if(err){ return next(err); }
		//console.log(users);

		var message = {
    		registration_id: users[0].gcm_id, // required
    		collapse_key: 'Collapse key', 
    		'data.message_action': req.body.action,
    		'data.message_json': JSON.stringify(req.body.message_json)
		};
		console.log("------------Sending gcm message----------");
		console.log(message);

		gcm.send(message, function(err, messageId){
			if (err) {
				console.log("Something has gone wrong on GCM send message!");
			}else {
			console.log("Sent with message ID: ", messageId);			
			}
		});
		//console.log(users);
	});

	//il client angular è in attesa di una risposta
	res.json({resp:"Command sent"});
	
	//res.json("OK");
}

//device --> Server
//Post command called by the device as answer of a requested action, made by a GCM message
exports.answerGCM = function(req, res, next) {
	console.log(req.user[0].device_id);
	console.log(req.params.action);
	/*for(var i=0; i<req.body.length;i++){
		console.log(req.body[i]);
	}*/

	var command = new Command();
	command.device_id=req.user[0].device_id;
	command.timestamp=new Date().toTimeString();
	command.action= req.params.action;
	command.payload=req.body;


	command.save(function(err, command){
		if(err){ return next(err); }		
	});

	//console.log(req.body.essid);
	//console.log(req.body.mac);
	var response = { response: "Post command successfully received"}
	res.json(response);
}

//Angular --> Server
//Get command called by the angular client to render the answer of the device
//The answer given to the angular depends on the field passed in the body of the request:
//- req.body.device_id : filter on device id
//- req.body.action: filter on action request
//- req.body.limit: number of documents to pass
//In addition all the results are ordered basing on timestamp
exports.getCommandList = function(req,res,next){
	//console.log(req.body.device_id);
	//console.log(req.body.action);
	//console.log(req.body.limit);

	Command.find({ $and: [ { device_id: req.body.device_id }, { action: req.body.action } ] },null,{sort : {timestamp: -1}, limit: req.body.limit},function(err, commands){
		if(err){ return next(err); }
		//console.log(commands);
		res.json(commands);
	});

}


//This route allow to delete one or more command
//if the param user is equal to a single user id, only the commands for that user are deleted
//if the param user is equal to the keyword "all", all the commands are deleted
exports.deleteCommand = function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	async.each(req.user,		
		function(user,callback){
			console.log(user);
			Command.find({device_id : user.device_id}).remove(function(err){				
				if(err)
					res.write("Error on deleting commands for 'device_id': '"+user.device_id+"'\n" );
				else
					res.write("Successfully deleted commands for 'device_id': '"+user.device_id+"'\n");
				callback();
			});
			
		},
		function(err){
			//now all the asynchronous requests to the DB have returned
			//console.log("finito");
			res.end("Finish");
			//res.json("finito");
		}
		);
}