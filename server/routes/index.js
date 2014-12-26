var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var async = require('async');

var router = express.Router();



/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Ennova' });
});

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

router.get('/user_list', function(req, res, next) {
	User.find(function(err, users){
		if(err){ return next(err); }
		res.json(users);
		//console.log(users);
	});
});

//Update the infos about the users, or create a new one.
router.post('/user_list', function(req, res, next) {
	//console.log(req.ip);
	//console.log(req);
	console.log(req.ip);
	console.log(req.body.device_id);

	//TODO: check if the request is well formed --> check if ==false 
	if(req.body.device_id==null || req.body.device_id=='' || req.body.device_id=='undefined'){
		return res.end("Request Malformed");
	}


	//Attach the ip address to the body string
	req.body.ip_address=req.ip;

	//Set or update the user. We pass the body string of the request
	var query={device_id:req.body.device_id};
	User.findOneAndUpdate(query,req.body,{upsert:true}, function(err, user){
		if(err){ return next(err); }
		res.json(user);
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


router.post('/ticket_list/:user', function(req, res, next) {
//add the ticket
	//console.log(req.user.device_id);
	//req.body.device_id=req.user.device_id;
	console.log(req.body[0]);
	var ticket = new Ticket(req.body[0]);

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
