const { RTMClient, WebClient } = require('@slack/client');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const {google} = require('googleapis');
const app = express();
var mongoose = require('mongoose');
const { User, Task, Meeting } = require('./backend/Models/Models.js');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI);

function makeCalendarMeeting(token, slackId, subject, channel, users) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)
  oauth2Client.refreshAccessToken((err, token) => {
    User.findOneAndUpdate({slackId: slackId}, {googleCalenderAccount: token})
    oauth2Client.setCredentials(token)
  })

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  Meeting.findOne({requesterId: slackId, subject: subject})
  .then((meeting) => {
    let emails = [];
    meeting.invitees.forEach((name)=>{
      //find user email in array of objects, users
      let obj = users.find(o => o === name);
      emails.push({'email': obj.name})
    })
    let start = new Date(meeting.time);
    let end = new Date(start.getTime() + 1800000)
    calendar.events.insert({
      calendarId: 'primary', // Go to setting on your calendar to get Id
      'resource': {
        'summary': meeting.subject,
        'location': '415 9th St., San Francisco, CA 94103',
        'description': meeting.subject,
        'start': {
          'dateTime': start.toISOString(),
          'timeZone': 'America/Los_Angeles'
        },
        'end': {
          'dateTime': end.toISOString(),
          'timeZone': 'America/Los_Angeles'
        },
        'attendees': emails,
      },
      'sendNotifications': true
    }, (err, data) => {
      if (err) return console.log('The API returned an error: ' + err);
      web.chat.postMessage({
        "channel": event.channel,
        "text": "Congatulations! Your reminder has been set.",
      });
    })
  }).catch(err => console.log(err))
}


function makeCalendarReminder(token, slackId, subject, channel) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  )

  oauth2Client.setCredentials(token)
  oauth2Client.refreshAccessToken((err, token) => {
    User.findOneAndUpdate({slackId: slackId}, {googleCalenderAccount: token})
    oauth2Client.setCredentials(token)
  })

  const calendar = google.calendar({version: 'v3', auth: oauth2Client});
  Task.findOne({requesterId: slackId, subject: subject})
  .then((task) => {
    console.log(task.time, task)
    let date = task.time.slice(0, 10)

    calendar.events.insert({
      calendarId: 'primary', // Go to setting on your calendar to get Id
      'resource': {
        'summary': task.subject,
        'location': '415 9th St., San Francisco, CA 94103',
        'description': task.subject,
        'start': {
          'date': date,
          // 'timeZone': 'America/Los_Angeles'
        },
        'end': {
          'date': date,
          // 'timeZone': 'America/Los_Angeles'
        }
      }
    }, (err, data) => {
      if (err) return console.log('The API returned an error: ' + err);
      console.log(data)
    })
    web.chat.postMessage({
      "channel": event.channel,
      "text": "Congatulations! Your reminder has been set.",
    });
  })
}

module.exports = {makeCalendarMeeting, makeCalendarReminder}
