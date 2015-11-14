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
var Gestures = mongoose.model('Gesture');
var JsonWearable = mongoose.model('JsonWearable');
var async = require('async');
var router = express.Router();
var http = require('http');//to POST to ennova server
var path = require("path");

//var userListRouteHandler = require('./userListRouteHandler');

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


/*******************SECTION: USER LIST OPERATIONS***********************
*                                                                      *
************************************************************************/
router.get('/app_list', getAppList);
router.post('/app_list', insertOrUpdateApp);

function getAppList (req, res, next) {
	res.json("hello");
  
};

//Update the infos about the users, or create a new one. The param device_id is the id that is needed
//to be inserted/updated
function insertOrUpdateApp (req, res, next) {
	
};
module.exports = router;
