const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const getCredential = require('../service/credential-service');
require('../config/config.js');

const credential = getCredential('conversation');

const assistant = new AssistantV2({
  version: global.gConfig.watsonAssistantVersion,
  authenticator: new IamAuthenticator({
    apikey: credential.apikey || global.gConfig.watsonApikey,
  }),
  url: credential.url || global.gConfig.watsonApiUrl,
});

function createSession() {
  return new Promise(function (resolve, reject) {
    assistant.createSession({
      assistantId: global.gConfig.watsonAssistantId
    }, function (err, response) {
      if (err) {
        reject(err);
      }
      else {
        resolve(response.result.session_id);
      }
    });
  })
}

function sendMessage(sessionId, message) {
  return new Promise(function (resolve, reject) {
    assistant.message({
      assistantId: global.gConfig.watsonAssistantId,
      sessionId: sessionId,
      input: {
        'message_type': 'text',
        'text': message
      }
    }, function (err, response) {
      if (err) {
        reject(err);
      }
      else {
        resolve(response.result.output.intents);
      }
    });
  })
}

async function getIntents(message) {
  try {
    const sessionId = await createSession();

    const messageResonse = await sendMessage(sessionId, message);

    var intents = messageResonse.map(item => item.intent);

    return intents;

  }
  catch (err) {
    throw err;
  }
}

module.exports = getIntents



