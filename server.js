const { RTMClient, WebClient } = require('@slack/client');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const app = express();
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post('/slack', (req, res) => {
  console.log(req.body);
  res.end()
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

rtm.on('channel_joined', (event) => {
  web.chat.postMessage({
    "text": `Hello! I am ScheduBot, your friendly neighborhood scheduling assistant.
    I can create reminders and schedule events for you! To do my job really well,
    I need permission to access your calendar (but don't worry, I won't share
    anything with anyone).`,
    "channel": event.channel
  })
})

// Log all incoming messages
rtm.on('message', (event) => {
  console.log(event);

  if (event.bot_id !== "BBWTAJR70"){
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
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);
        console.log(`  Intent: ${result.intent.displayName}`);
        if (event.bot_id !== "BBWTAJR70") {
          web.chat.postMessage({
            "channel": event.channel,
            "text": result.fulfillmentText,
            "attachments": [
                              {
                                  "text": "Confirm task",
                                  "fallback": "You are unable to confirm",
                                  "callback_id": "confirm_reminder",
                                  "color": "#3AA3E3",
                                  "attachment_type": "default",
                                  "actions": [
                                      {
                                          "name": "confirmation",
                                          "text": "Yes",
                                          "type": "button",
                                          "value": "yes"
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
          })
        }
      })
      .catch(err => {
        console.error('ERROR:', err);
    });
  }
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
console.log('running running running')
app.listen(3000)

// Log all reactions
// rtm.on('reaction_added', (event) => {
//   // Structure of `event`: <https://api.slack.com/events/reaction_added>
//   console.log(`Reaction from ${event.user}: ${event.reaction}`);
// });
// rtm.on('reaction_removed', (event) => {
//   // Structure of `event`: <https://api.slack.com/events/reaction_removed>
//   console.log(`Reaction removed by ${event.user}: ${event.reaction}`);
// });
//
// // Send a message once the connection is ready
// rtm.on('ready', (event) => {
//   console.log("event", event)
//   // Getting a conversation ID is left as an exercise for the reader. It's usually available as the `channel` property
//   // on incoming messages, or in responses to Web API requests.
//   //
//   const conversationId = 'DBUN89ARE';
//    rtm.sendMessage('I AM CONNECTED', conversationId);
// });
