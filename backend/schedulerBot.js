import Bot from 'slackbots'
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

let scheduler = new Bot(settings);
let rtm = new RtmClient("xoxb-403223646932-403336875187-Bf8Df3OFFSMuG1t19BmRXJWi");
rtm.start();

//Listener for messages inputed in the channel
rtm.on(RTM_EVENTS.MESSAGE, function(message) {

});
