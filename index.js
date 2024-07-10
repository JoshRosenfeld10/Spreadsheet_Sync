const express = require("express"),
  config = require("./modules/config"),
  constants = require("./constants/constants"),
  smartsheets = require("./routes/smartsheets"),
  googlesheets = require("./routes/googlesheets"),
  sync = require("./routes/sync"),
  port = 3000 || config.port,
  app = express();

if (constants.local) {
  app.use("/smartsheets", smartsheets);
  app.use("/googlesheets", googlesheets);
}

app.use("/sync", sync);

app.listen(3000, () => {
  console.log(`Listening on port ${port}`);
});

module.exports = app;
