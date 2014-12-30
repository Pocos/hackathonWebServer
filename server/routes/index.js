/*******************FILE DESCRIPTION***********************
* 
* This js script handles all the routes for the server. Any GET, POST, etc made by the device or by the angular page
* pass through here. Below there is the list of the contents. Read each section header for any explanation:
* 1 - Render Page Views section
* 2 - Parameters section
* 3 - User List operation section
* 4 - Ticket List operation section
**********************************************************/

var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var async = require('async');
var router = express.Router();


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
	console.log("!!!!!!!QUI!!!!");
	res.render('user_list');
});
/*******************SECTION: PARAMETERS***********************
* 
* PARAMETERS USED TO ATTACH AN HEADER TO A REQUEST.
* Ex. Post /ticket_list/:user. Before to perform the post ticket_list operation on ticket list we catch the user param,
* do some operation on this param and then attach it on req.user for the post ticket_list
*
*
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

router.param('ticket', function(req, res, next, id) {
	var query;
	console.log(id);
	if(id=='all'){
		//console.log("all");
		query=Ticket.find();	
	}
	else
		query = Ticket.find({_id:id});

	query.exec(function (err, ticket){
		console.log(ticket);
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

router.delete('/ticket_list/:user/:ticket', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	async.each(req.ticket,		
		function(ticket,callback){
			console.log(ticket);
			Ticket.findById(ticket._id).remove(function(err){				
				if(err)
					res.write("Error on deleting element with 'device_id': '"+ticket._id+"'\n" );
				else
					res.write("Successfully deleted element with 'device_id': '"+ticket._id+"'\n");
				callback();
			});
			
		},
		function(err){
			//now all the asynchronous request to the DB have returned
			//console.log("finito");
			res.end("Finish");
			//res.json("finito");
		}
		);
});


module.exports = router;
