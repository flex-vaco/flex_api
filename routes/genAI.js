
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const GenAI = require('../models/GenAI.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/talk_to_ai", verifyToken, GenAI.phi_data_agents);

module.exports = router;