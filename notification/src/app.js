const express = require("express");
const { connect} = require("../src/broker/broker");
const setListeners = require("../src/broker/listener")

const app = express();

connect().then(() => {
  setListeners()
});


app.get("/", (req, res) => {
  res.send("Notification Service is running");
});



module.exports = app;
