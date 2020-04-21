// import dependencies and initialize the express router
const express = require("express");
const userProfileController = require("../controllers/userProfile-controller");

const router = express.Router();

// define routes
router.get("", userProfileController.getUserProfile);
router.post("", userProfileController.postUserProfileRequest);
router.put("", userProfileController.updateProfileRequest);


module.exports = router;
