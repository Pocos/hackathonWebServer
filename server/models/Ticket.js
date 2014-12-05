var mongoose = require('mongoose');

var TicketSchema = new mongoose.Schema({
  device_id: String,
  timestamp: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});


mongoose.model('Ticket', TicketSchema);