
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/User.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, User.findAll);
router.get("/lineOfBusiness/:lineOfBusinessId", verifyToken, User.findByLineOfBusiness);
router.get("/:user_id", verifyToken, User.findById);
router.post("/sign-up", verifyToken, User.create);
router.post("/update/:user_id", verifyToken, User.update);
router.get("/delete/:user_id", verifyToken, User.erase);
router.post("/sign-in", User.signIn);
router.post("/roles", verifyToken, User.getUserRoles);
router.post("/resetPassword/:user_id", verifyToken, User.resetPassword);
router.post("/getUserByRole", verifyToken, User.getUserByRole);
router.post("/getManagersByLineOfBusiness", verifyToken, User.getManagersByLineOfBusiness);
router.get("/offshoreLeads/serviceLine/:serviceLineId", verifyToken, User.getOffshoreLeadsByServiceLine);
router.post("/forgotPassword", User.forgotPassword);
router.post("/updatePassword", User.resetPasswordRequest);
module.exports = router;