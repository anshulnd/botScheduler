const { RTMClient, WebClient } = require('@slack/client');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const app = express();
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.post('/slack', (req, res) => {
  console.log(req.body);
  res.end()
})

// Get an API token by creating an app at <https://api.slack.com/apps?new_app=1>
// It's always a good idea to keep sensitive data like the token outside your source code. Prefer environment variables.
const token = process.env.SLACK_TOKEN || '';
//if (!token) { console.log('You must specify a token to use this example'); process.exitCode = 1; return; }
console.log(token);
// Initialize an RTM API client
const rtm = new RTMClient(token);
const web = new WebClient(token);
// Start the connection to the platform
rtm.start();

// Log all incoming messages
rtm.on('message', (event) => {
  console.log(event);
  // Structure of `event`: <https://api.slack.com/events/message>
  //BBUSG64KA => ScheduBot bot_id

  const projectId = 'schedulerbot-9b789';
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
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
        if (event.bot_id !== "BBWTAJR70") {
          web.chat.postMessage({
          "text": result.fulfillmentText
      })
        }
      } else {
        console.log(`  No intent matched.`);
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
    });

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
