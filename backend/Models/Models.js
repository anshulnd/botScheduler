var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Put schemas here
<<<<<<< HEAD
var meetingSchema = new Schema({
  
})

=======
//Updates have been made
>>>>>>> 1537962b5324bb851354301284410577b0cdd976

var taskSchema = new Schema({

})

var meetingSchema = new Schema({

})

var userSchema = new Schema({
  googleCalenderAccount: {
    accessToken: ,
    refreshToken: ,
    googlePlusprofile:
  }
  meetingLength: 30,
  slackId: String,
  slackUser: String,
  slackEmail: String,
  slackDmids: String
})

var inviteSchema = new Schema({
  eventId: String,
  inviteeId: String,
  requesterId: String,
  status: String
})

var Task = mongoose.model('Task', taskSchema)
var Meeting = mongoose.model('Meeting', meetingSchema);
var User = mongoose.model('User', userSchema);
var Invite = mongoose.model('Invite', inviteSchema);
module.exports = {
  Task: Task,
  Meeting: Meeting,
  User: User,
  Invite: Invite
 };
