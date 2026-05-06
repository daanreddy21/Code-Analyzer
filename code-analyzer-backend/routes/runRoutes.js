const express = require("express");
const router = express.Router();
const { runCode } = require("../controller/runController");
const rateLimit = require("express-rate-limit");

const compilerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

// USES YOUR DOCKER CONTROLLER (no more mock!)
router.post('/', compilerLimiter, runCode);
router.post('/run', compilerLimiter, runCode);

module.exports = router;