var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Put schemas here

var Meeting = mongoose.model('Meeting', meetingSchema);
var User = mongoose.model('User', userSchema);
var Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = {
  User: User,
  Reminder: Reminder,
  Meeting: Meeting,
 };
