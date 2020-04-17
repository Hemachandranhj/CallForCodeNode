const vcapServices = require('vcap_services');

function getCredentials(sereviceName) {
  const credentials = vcapServices.findCredentials({ service: sereviceName });
  return credentials;
}

module.exports = getCredentials;
