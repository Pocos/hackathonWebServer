var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var Command = mongoose.model('Command');
var async = require('async');
var router = express.Router();
var GCM = require('gcm').GCM;
var http = require('http');//to POST to ennova server

/*******************SECTION: PARAMETERS***********************
* 
* PARAMETERS USED TO ATTACH AN HEADER TO A REQUEST.
* Ex. Post /ticket_list/:user. Before to perform the post ticket_list operation on ticket list we catch the user param,
* do some operation on this param and then attach it on req.user for the post ticket_list
*
* id : contains the value of the parameter
**********************************************************/
exports.userParameter = function(req, res, next, id) {
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
};

exports.getUserList = function(req, res, next) {
  User.find(function(err, users){
    if(err){ return next(err); }
    res.json(users);
    //console.log(users);
  });
};

//Update the infos about the users, or create a new one. The param device_id is the id that is needed
//to be inserted/updated
exports.insertOrUpdateUser = function(req, res, next) {
	console.log(req.ip);
	console.log(req.body.device_id);
	console.log(req.params.device_id);

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

//---------------------POST ENNOVA server--------------------------
var data= JSON.stringify({
  "token": "test",
  "data": {
   "type": "a",
   "category": "b",
   "subcategory": "c"
 }
}) ;
/*var data = JSON.stringify({
    token: 'test',
    data: body_data,
  });*/

console.log(data);
var options = {
  host: 'backend-pqixpx9s4p.elasticbeanstalk.com',
  port: 80,
  path: '/ticket/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
console.log(options);
var httpreq = http.request(options, function (response) {
  response.setEncoding('utf8');
  response.on('data', function (chunk) {
    console.log("body: " + chunk);
  });
  response.on('end', function() {
      //res.send('ok');
    })
});
httpreq.write(data);
httpreq.end();
//-----------END POST ENNOVA server
};

//This route allow to delete one or more user
//if the param user is equal to a single user id, just that user will be deleted
//if the param user is equal to the keyword "all", all the users will be deleted
exports.deleteUser = function(req, res) {
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
};
