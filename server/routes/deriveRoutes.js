const express = require("express");
const router = express.Router();

const { deriveString } = require("../controllers/deriveController");

router.post("/derive", deriveString);

module.exports = router;