var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var Command = mongoose.model('Command');
var async = require('async');
var router = express.Router();
var http = require('http');//to POST to ennova server

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
exports.ticketParameter = function(req, res, next, id) {
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
	}

//add the ticket. You need to user req.user[0] because the user parameter is the result of a query,
//hence mongoose returns the results into an array
exports.insertTicket = function(req, res, next) {
	var ticket = new Ticket();
	ticket.device_id=req.user[0].device_id;
	//ticket.timestamp= new Date().toTimeString();
	ticket.timestamp=new Date().toUTCString();
	ticket.save(function(err, ticket){
		if(err){ return next(err); }		
	});

	//increment the ticket count for the user
	req.user[0].upcount(function(err,user){
		if(err){ return next(err); }
	});

	res.json({action: "Richiesta ricevuta"});
}


//Get all the tickets for the user specified, or for all the user if keyword "all" is used for the
//the user pparam. In this case we need an async each structure to wait until all the tickets for all
//the users are found
exports.getTicketList = function(req, res, next) {
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

}

//This route allow to delete one or more ticket for the user specified
//if the param ticket is equal to a single ticket id, just that ticket will be deleted
//if the param ticket is equal to the keyword "all", all the tickets for the user param will be deleted
exports.deleteTicket = function(req, res) {
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

}