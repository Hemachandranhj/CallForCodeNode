// import dependencies and initialize the express router
const express = require('express');
const authController = require('../controllers/auth-controller');

const router = express.Router();
const CALLBACK_URL = '/ibm/bluemix/appid/callback';

// define routes
router.get('/au/login', authController.login);
router.get(CALLBACK_URL, authController.callbackAuthorization);
router.get('/au/logout', authController.logout);
router.get('/au/logged', authController.logged);

module.exports = router;
