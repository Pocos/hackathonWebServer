var mongoose = require('mongoose');

var GestureSchema = new mongoose.Schema({
  type: String,
  name: String
});


mongoose.model('Gesture', GestureSchema);