var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Put schemas here
var userSchema = new Schema({
  googleCalenderAccount: {},
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

var taskSchema = new Schema({
  subject: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  googleCalendarEventId: {
    type: String
  },
  requesterId: {
    type: String
  },
  status: {
    type: String
  },
  createdAt: {
    type: String
  },
  requesterId: {
    type: String
  }
})

var meetingSchema = new Schema({
  day: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  invitees: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  location: {
    type: String
  },
  meetingLength: {
    type: String
  }
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
