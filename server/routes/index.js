/*******************FILE DESCRIPTION***********************
* 
* This js script handles all the routes for the server. Any GET, POST, etc made by the device or by
* the angular page pass through here. Below there is the list of the contents.
* 1 - Render Page Views section
* 2 - Parameters section
* 3 - User List operation section
* 4 - Ticket List operation section
* 5 - GCM Commands operation section
*
* For any explanation on sections 2-5 please refer to the related callback documentation
**********************************************************/
var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Ticket = mongoose.model('Ticket');
var Command = mongoose.model('Command');
var async = require('async');
var router = express.Router();
var http = require('http');//to POST to ennova server

var userListRouteHandler = require('./userListRouteHandler');
var ticketRouteHandler = require('./ticketRouteHandler');
var commandRouteHandler = require('./commandRouteHandler');
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

/*******************SECTION: PARAMETERS*********************************
* 																	   *
************************************************************************/
router.param('user', userListRouteHandler.userParameter);
router.param('ticket', ticketRouteHandler.ticketParameter);

/*******************SECTION: USER LIST OPERATIONS***********************
*                                                                      *
************************************************************************/
router.get('/user_list', userListRouteHandler.getUserList);
router.post('/user_list/:device_id', userListRouteHandler.insertOrUpdateUser);
router.delete('/user_list/:user', userListRouteHandler.deleteUser);

/*******************SECTION: TICKET LIST OPERATIONS*********************
*																	   *
************************************************************************/
router.post('/ticket_list/:user', ticketRouteHandler.insertTicket);
router.get('/ticket_list/:user', ticketRouteHandler.getTicketList);
router.delete('/ticket_list/:user/:ticket', ticketRouteHandler.deleteTicket);

/*******************SECTION: GCM COMMANDS OPERATIONS********************
*         															   *
************************************************************************/
//Angular -> Server --GCM--> device
router.post('/send_command', commandRouteHandler.sendGCMCommand);
//device --> Server
router.post('/command_list/:user/:action', commandRouteHandler.answerGCM);
//Angular --> Server
router.post('/command_list/',commandRouteHandler.getCommandList);
router.delete('/command_list/:user', commandRouteHandler.deleteCommand);


module.exports = router;
