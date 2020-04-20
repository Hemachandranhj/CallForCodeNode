const express = require("express");
const router = express.Router();
const AssistanceController = require("../controllers/assistance-controller");

// define the https post for storing assistance request
router.post("/", AssistanceController.storeAssistanceRequest);

// define the https post for storing assistance request
router.post("/acceptRequest", AssistanceController.acceptRequest);

router.get("/", AssistanceController.getAssistance);

module.exports = router;
