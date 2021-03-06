var mongoose = require('mongoose');

var JsonWearableSchema = new mongoose.Schema({
	appName: {type:String},
	gestures: {type:Array, "default":[{
		name: String,
  		type: String,
  		padding: {type: String, default: "                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "},
  		protocolVersion: {type:Number, default:1}
	},{strict:false, _id:false}]}
},{strict:false, _id:false});



var JsonWearableModel=mongoose.model('JsonWearable', JsonWearableSchema);

/* Alternative to unique field on device_id
UserSchema.pre('save', function (next) {
	var self = this;
	UserModel.find({device_id : self.device_id}, function (err, docs) {
		if (!docs.length){
			next();
		}else{                
			var err = new Error('user exists:'+self.device_id);
			next(err);
		}
	});
});*/