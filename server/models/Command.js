var mongoose = require('mongoose');

var CommandSchema = new mongoose.Schema({
	device_id: {type:String},
	timestamp: String,
	action: String,
	payload: Object
});

var CommandModel=mongoose.model('Command', CommandSchema);

