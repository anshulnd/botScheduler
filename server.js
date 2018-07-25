const { RTMClient, WebClient } = require('@slack/client');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const {google} = require('googleapis');
const app = express();
var mongoose = require('mongoose');
const Models = require('./backend/Models/Models.js');
const User = Models.User
const Task = Models.Task
const Meeting = Models.Meeting
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

mongoose.connect(process.env.MONGODB_URI);
// let users = [];
// app.get('https://slack.com/api/users.list?token='+process.env.SLACK_TOKEN, (req, res){
//   res.members.forEach(user => {
//     users.push(user.profile.display_name)
//   })
// })

app.post('/slack', (req, res) => {
  let payload = JSON.parse(req.body.payload);
  let slackId = payload.user.id
  let subject = payload.subject
  let channel = payload.channel
  if(payload.text === "No one will love you if you can't remember simple stuff like that"){
    User.findOne({slackId: slackId})
    .then((user) => {
      makeCalendarReminder(user.googleCalenderAccount, slackId, subject, channel)
    })
  }else{

  }
  res.end()
})

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID_CAL,
  process.env.CLIENT_SECRET_CAL,
  process.env.REDIRECT_URL
)

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

app.get('/oauthcallback', function(req, res){
  oauth2Client.getToken(req.query.code, function (err, token) {
    if (err) return console.error(err.message)
    var newUser = new User({
      // email: prompt("Please enter your email.")
      googleCalenderAccount: token,
      slackId: req.query.state
    })
    newUser.save()
    .then( () => res.status(200).send("Your account was successfuly authenticated"))
    .catch((err) => {
      console.log('error in newuser save of connectcallback');
      res.status(400).json({error:err});
    })
  })
})

// Get an API token by creating an app at <https://api.slack.com/apps?new_app=1>
// It's always a good idea to keep sensitive data like the token outside your source code. Prefer environment variables.
const slack_token = process.env.SLACK_TOKEN || '';
//if (!token) { console.log('You must specify a token to use this example'); process.exitCode = 1; return; }
// Initialize an RTM API client
const rtm = new RTMClient(slack_token);
const web = new WebClient(slack_token);
// Start the connection to the platform
rtm.start();

// Log all incoming messages
rtm.on('message', (event) => {
  if (event.bot_id) return
  User.findOne({'slackId': event.user}).then((res) => {
    if(!res){
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        state: event.user,
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/userinfo.email'
        ]
      })
      web.chat.postMessage({
        "text": `Hello! I am ScheduBot, your friendly neighborhood scheduling assistant.
        I can create reminders and schedule events for you! To do my job really well,
        I need permission to access your calendar (but don't worry, I won't share
        anything with anyone).`,
        "channel": event.channel,
        "attachments": [
          {
            "fallback": "Authorize ScheduBot to use Google Calendar.",
            "actions": [
              {
                "type": 'button',
                "text": "Authorize ScheduBot",
                "url": url
              }
            ]
          }
        ]
      })
    }else{
        const projectId = process.env.DIALOG_FLOW_ID;
        const sessionId = event.user;
        const query = event.text;
        const languageCode = 'en-US';
        const sessionClient = new dialogflow.SessionsClient();

        const sessionPath = sessionClient.sessionPath(projectId, sessionId);
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: query,
              languageCode: languageCode,
            },
          },
        };
        sessionClient.detectIntent(request)
          .then(responses => {
            const result = responses[0].queryResult;
            const params = result.parameters.fields;
            if (!event.bot_id) {
              let confirmation;
              if (result.task !== "" && result.fulfillmentText === "No one will love you if you can't remember simple stuff like that") { //Intent indicates a reminder
                var reminder = new Task({
                  time: params.date.stringValue,
                  subject: params.Task.stringValue,
                  requesterId: event.user
                })
                reminder.save()
                .then(()=>{
                  confirmation = {
                    "channel": event.channel,
                    "text": result.fulfillmentText,
                    "attachments": [
                                      {
                                          "text": `Create task to ${params.Task.stringValue}?`,
                                          "fallback": "You are unable to confirm",
                                          "callback_id": "confirm_reminder",
                                          "color": "#3AA3E3",
                                          "attachment_type": "default",
                                          "actions": [
                                              {
                                                  "name": "confirmation",
                                                  "text": "Yes",
                                                  "type": "button",
                                                  "value": JSON.stringify({user: event.user, subject: params.Task.stringValue, channel: event.channel})
                                              },
                                              {
                                                  "name": "confirmation",
                                                  "text": "No",
                                                  "type": "button",
                                                  "value": "false"
                                              }
                                          ]
                                      }
                                  ]
                  }
                  web.chat.postMessage(confirmation).catch(err => console.log(err))
                }).catch((err) => console.log(err))
              } else if (result.meeting !== "" && result.fulfillmentText === "Aight fucker. Catch me outside") { //Intent indicates a meeting
                var meeting = new Meeting({
                  time: params.date || params.time,
                  invitees: params.name,
                  subject: params.Task,
                  requesterId: event.user
                })
                confirmation = {
                  "channel": event.channel,
                  "text": result.fulfillmentText,
                  "attachments": [
                                    {
                                        "text": `Schedule a meeting?`,
                                        "fallback": "You are unable to confirm",
                                        "callback_id": "confirm_meeting",
                                        "color": "#3AA3E3",
                                        "attachment_type": "default",
                                        "actions": [
                                            {
                                                "name": "confirmation",
                                                "text": "Yes",
                                                "type": "button",
                                                "value": JSON.stringify({user: event.user, subject: params.Task.stringValue, text: result.fulfillmentText})
                                            },
                                            {
                                                "name": "confirmation",
                                                "text": "No",
                                                "type": "button",
                                                "value": "no"
                                            }
                                        ]
                                    }
                                ]
                }
                web.chat.postMessage(confirmation).catch(err => console.log(err))
              } else { //Intent indicates neither reminder nor meeting
                confirmation = {
                  "channel": event.channel,
                  "text": result.fulfillmentText,
                  "attachments": [
                                    {
                                        "text": `Please request either a reminder
                                        or for an event to be scheduled.`
                                    }
                                ]
                }
                web.chat.postMessage(confirmation).catch(err => console.log(err))
              }
            }
          })
          .catch(err => {
            console.error('ERROR:', err);
        });

    }
    }
  )

  // Structure of `event`: <https://api.slack.com/events/message>
  //BBUSG64KA => ScheduBot bot_id

//   if (event.bot_id !== "BBWTAJR70") {
//     web.chat.postMessage({
//     "text": "Would you like set this reminder?",
//     "channel": event.channel,
//     "attachments": [
//         {
//             "text": "Choose a game to play",
//             "fallback": "You are unable to choose a game",
//             "callback_id": "wopr_game",
//             "color": "#3AA3E3",
//             "attachment_type": "default",
//             "actions": [
//                 {
//                     "name": "Confirm"
//                     "text": "Confirm",
//                     "type": "button",
//                     "value": "Confirm"
//                 },
//                 {
//                     "name": "Cancel",
//                     "text": "Cancel",
//                     "type": "button",
//                     "value": "Cancel"
//                 },
//             ]
//         }
//     ]
// })
//   }
})

console.log('running running running');
app.listen(3000);
