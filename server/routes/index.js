/*******************FILE DESCRIPTION***********************
* 
* This js script handles all the routes for the server. Any GET, POST, etc made by the device or by the angular page
* pass through here. Below there is the list of the contents. Read each section header for any explanation:
* 1 - Render Page Views section
* 2 - Parameters section
* 3 - User List operation section
* 4 - Ticket List operation section
* 5 - GCM Commands operation section
**********************************************************/

var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var Command = mongoose.model('Command');
var async = require('async');
var router = express.Router();
var GCM = require('gcm').GCM;

/*******************SECTION: RENDER PAGE VIEWS***********************
* 
* The angular pages requires some html/ejs code to fill textboxes, field, table, and so on. To obtain the code they
* perform some GET requests. Here we catch these request and properly render the requested code.
* We recommend to read public/javascript/angularApp to know when how and where this requested are made
*
*
**********************************************************/
//Home page
router.get('/', function(req, res) {
	res.render('index', { title: 'Ennova' });
});

//Initial inner view of the body home page
router.get('/partial/home', function(req, res, next) {
	res.render('home', { title: 'Ennova' });
});

//View for user_list state
router.get('/partial/user_list', function(req, res, next) {
	res.render('user_list');
});

//View for tickets for a specified user
router.get('/partial/user-ticket_list', function(req, res, next) {
	res.render('user-ticket_list');
});

//View for all the tickets
router.get('/partial/ticket_list',function(req,res,next){
	res.render('ticket_list');
})

//View for the gcm console
router.get('/partial/user_gcm',function(req,res,next){
	res.render('user_gcm');
})

/*******************SECTION: PARAMETERS***********************
* 
* PARAMETERS USED TO ATTACH AN HEADER TO A REQUEST.
* Ex. Post /ticket_list/:user. Before to perform the post ticket_list operation on ticket list we catch the user param,
* do some operation on this param and then attach it on req.user for the post ticket_list
*
* id : contains the value of the parameter
**********************************************************/
router.param('user', function(req, res, next, id) {
	var query;
	if(id=='all'){
		query=User.find();	
	}
	else
		query = User.find({device_id : id});

	query.exec(function (err, user){
		if (err) { return next(err); }
		if (!user.length) { return next(new Error("can't find user")); }

		req.user = user;
		return next();
	});
});

//Parameter used for the delete operation of the tickets. Note that the route that contains 
//a ticket param also contains the user param, which is the result of a query on the DB, performed
// in router.param('user'... and which can be accessed as an header of the request
//!!! Ex. the route router.delete('/ticket_list/:user/:ticket')
//!!! router.delete('ticket_list/DEVICE_2/all') 
//1 - Firstly it is performed a query on the DB to find if the user DEVICE_2 exist, then the result is
//attached to the header of the request (req.user)
//2 - Then the result of the query is used to filter the tickets basing on the device_id, obtaining 
//a list
//3 - Finally if the ticket param is equal to 'all' all the tickets for that user will be returned,
//otherwise if only a single ticket id is specified then only that ticket will be returned
router.param('ticket', function(req, res, next, id) {
	var query;

	if(id=='all'){
		//get all the tickets for the user specified, which is in the user header
		query=Ticket.find({device_id:req.user[0].device_id});	
	}
	else
		//This is the case when we want to delete only one ticket for the specified user.
		//Since the ticket id is unique in the ticket list an AND condition for the query
		//Ticket.find({_id:id $AND device_id:req.user[0].device_id}) could be simplified as
		query = Ticket.find({_id:id}); 

		query.exec(function (err, ticket){
	//	console.log(ticket);
	if (err) { return next(err); }
	if (!ticket.length) { return next(new Error("can't find ticket")); }

	req.ticket = ticket;
	return next();
});
	});

/*******************SECTION: USER LIST OPERATIONS***********************
* 
*
*
*
**********************************************************/
router.get('/user_list', function(req, res, next) {
	User.find(function(err, users){
		if(err){ return next(err); }
		res.json(users);
		//console.log(users);
	});
});




//Update the infos about the users, or create a new one. The param device_id is the id that is needed
//to be inserted/updated
router.post('/user_list/:device_id', function(req, res, next) {
	console.log(req.ip);
	console.log(req.body.device_id);
	console.log(req.params.device_id);

	//if(req.body.device_id==null || req.body.device_id=='' || req.body.device_id=='undefined'){
	//	if(!req.body.device_id){
	//		return res.end("Request Malformed");
	//	}


	//TODO: Is attach the info on the body request the best practice?
	//Attach the ip address to the body string
	req.body.device_id=req.params.device_id;

	//Attach the ip address to the body string
	req.body.ip_address=req.ip;
	
	//Attach last login information
	req.body.last_login=new Date().toUTCString();

	//Set or update the user. We pass the body string of the request
	var query={device_id:req.body.device_id};
	User.findOneAndUpdate(query,req.body,{upsert:true}, function(err, user){
		if(err){ return next(err); }
		res.json(user);
	});
});

//This route allow to delete one or more user
//if the param user is equal to a single user id, just that user will be deleted
//if the param user is equal to the keyword "all", all the users will be deleted

router.delete('/user_list/:user', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	async.each(req.user,		
		function(user,callback){
			console.log(user);
			User.find({device_id : user.device_id}).remove(function(err){				
				if(err)
					res.write("Error on deleting element with 'device_id': '"+user.device_id+"'\n" );
				else
					res.write("Successfully deleted element with 'device_id': '"+user.device_id+"'\n");
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
});

/*******************SECTION: TICKET LIST OPERATIONS***********************
* 
* 
*
*
**********************************************************/
router.post('/ticket_list/:user', function(req, res, next) {
//add the ticket. You need to user req.user[0] because the user parameter is the result of a query
//so mongoose returns the results into an array

var ticket = new Ticket();
ticket.device_id=req.user[0].device_id;
ticket.timestamp= new Date().toUTCString();

ticket.save(function(err, ticket){
	if(err){ return next(err); }		
});

//increment the ticket count for the user
req.user[0].upcount(function(err,user){
	if(err){ return next(err); }
});

res.json({action: "Richiesta ricevuta"});
});

//Get all the tickets for the user specified, or for all the user if keyword "all" is used for the
//the user pparam. In this case we need an async each structure to wait until all the tickets for all
//the users are found
router.get('/ticket_list/:user', function(req, res, next) {
	var output=[];
	async.each(req.user,		
		function(user,callback){
			Ticket.find({device_id : user.device_id}).exec(function(err, tickets){
				if(err){ return next(err); }

				for(var i=0;i<tickets.length;i++)
					output.push(tickets[i]);
				callback();
			});
			
		},
		function(err){
			//now all the asynchronous request to the DB have returned
			console.log("finito");
			console.log(output);
			res.json(output);
		}
		);

});

//This route allow to delete one or more ticket for the user specified
//if the param ticket is equal to a single ticket id, just that ticket will be deleted
//if the param ticket is equal to the keyword "all", all the tickets for the user param will be deleted
router.delete('/ticket_list/:user/:ticket', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	console.log(req.ticket);
	async.each(req.ticket,		
		function(ticket,callback){
			console.log(ticket);
			Ticket.findById(ticket._id).remove(function(err){				
				if(err)
					res.write("Error on deleting element with 'device_id': '"+ticket._id+"'\n" );
				else{
					res.write("Successfully deleted element with 'device_id': '"+ticket._id+"'\n");
					req.user[0].downcount(function(err,user){
						if(err){ return next(err); }
					});
				}

				callback();
			});
			
		},
		function(err){
			//now all the asynchron-ous request to the DB have returned
			//console.log("finito");
			res.end("Finish");
			//res.json("finito");
		}
		);

});

/*******************SECTION: GCM COMMANDS OPERATIONS***********************
* 
* 
*
*
**********************************************************/

//API KEY. You can obtain it from console.developer.google.com
var gcm = new GCM('AIzaSyAZmb3Q4nAK9zYgXJRs7wdQbhN0eaZkV1M');

//Post command called by the angular client
router.post('/send_command', function(req, res, next) {
	console.log(req.body.device_id);
	console.log(req.body.action);
	console.log(req.body.message_json);
	//JSON TO SEND
	var json_data=[];

	User.find({device_id: req.body.device_id},function(err, users){
		if(err){ return next(err); }
		//console.log(users);

		var message = {
    		registration_id: users[0].gcm_id, // required
    		collapse_key: 'Collapse key', 
    		'data.message_action': req.body.action,
    		'data.message_json': req.body.message_json
		};

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
	//res.json({resp:"Command sent"});
	res.json("OK");
});

//Post command called by the device as answer of a requested action
router.post('/command_list/:user/:action', function(req, res, next) {
	console.log(req.user[0].device_id);
	console.log(req.params.action);
	/*for(var i=0; i<req.body.length;i++){
		console.log(req.body[i]);
	}*/

	var command = new Command();
	command.device_id=req.user[0].device_id;
	command.timestamp=new Date().toUTCString();
	command.action= req.params.action;
	command.payload=req.body;


	command.save(function(err, command){
		if(err){ return next(err); }		
	});

	//console.log(req.body.essid);
	//console.log(req.body.mac);
	var response = { response: "Post command successfully received"}
	res.json(response);
});

//Get command called by the angular client to render the answer of the device
//The answer given to the angular depends on the field passed in the body of the request:
//- req.body.device_id : filter on device id
//- req.body.action: filter on action request
//- req.body.limit: number of documents to pass
//In addition all the results are ordered basing on timestamp
router.post('/command_list/',function(req,res,next){
	//console.log(req.body.device_id);
	//console.log(req.body.action);
	//console.log(req.body.limit);

	Command.find({ $and: [ { device_id: req.body.device_id }, { action: req.body.action } ] },null,{sort : {timestamp: -1}, limit: req.body.limit},function(err, commands){
		if(err){ return next(err); }
		res.json(commands);
	});

});

//This route allow to delete one or more command
//if the param user is equal to a single user id, only the commands for that user are deleted
//if the param user is equal to the keyword "all", all the commands are deleted
router.delete('/command_list/:user', function(req, res) {
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
});



module.exports = router;
