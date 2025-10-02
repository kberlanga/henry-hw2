// Auth Service - CloudTech Monitoring
// This service has quality issues that need to be identified and fixed

const express = require("express");
const mongoose = require("mongoose");

const app = express();

// TODO: Add proper validation and error handling
function authenticateUser(username, password) {
  // Security issue: No input validation
  if (username == "admin" && password == "password123") {
    return { token: "fake-jwt-token", user: username };
  }
  return null;
}

// TODO: Add proper middleware
app.use(express.json());

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  // Security issue: No rate limiting
  const result = authenticateUser(username, password);

  if (result) {
    res.json(result);
  } else {
    res.status(401).send("Unauthorized");
  }
});

// TODO: Add proper error handling
app.listen(3001, () => {
  console.log("Auth service running on port 3001");
});

module.exports = app;
