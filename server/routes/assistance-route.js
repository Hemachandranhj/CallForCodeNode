const express = require("express");
const router = express.Router();
const AssistanceController = require("../controllers/assistance-controller");

// define the https post for storing assistance request
router.post("/", AssistanceController.storeAssistanceRequest);

module.exports = router;
