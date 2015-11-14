var mongoose = require('mongoose');

var GestureSchema = new mongoose.Schema({
		name: String,
  		type: String,
  		padding: {type: String, default: "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "},
  		protocolVersion: {type:Number, default:1}
},{strict:false, _id:false});



var GestureModel=mongoose.model('Gesture', GestureSchema);