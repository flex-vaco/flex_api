const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const LineOfBusiness = require('../models/LineOfBusiness.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", verifyToken, LineOfBusiness.findAll);
router.get("/:id", verifyToken, LineOfBusiness.findById);
router.post("/add", verifyToken, LineOfBusiness.create);
router.post("/update/:id", verifyToken, LineOfBusiness.update);
router.get("/delete/:id", verifyToken, LineOfBusiness.erase);

module.exports = router; 