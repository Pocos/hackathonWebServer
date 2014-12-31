var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	device_id: {type:String},
	gcm_id: String,
	status_wifi:String,
	ip_address:String,
	last_login:String,
	total_tickets: {type: Number, default: 0},
	tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }]
});

UserSchema.methods.upcount=function upcount(cb){
	this.total_tickets++;
	this.save(cb);
};

UserSchema.methods.downcount=function upcount(cb){
	this.total_tickets--;
	this.save(cb);
};

/*
UserSchema.method('upcount', function(cb){
	this.total_tickets++;
	this.save(cb);
});*/

var UserModel=mongoose.model('User', UserSchema);

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