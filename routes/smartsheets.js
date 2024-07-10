const express = require("express"),
  router = express.Router(),
  smartsheet = require("../modules/smartsheet");

router.get("/", async (req, res) => {
  const sheets = await smartsheet.getSheets();
  res.send(sheets);
});

router.get("/:id", async (req, res) => {
  const sheet = await smartsheet.getSheet(req.params.id);
  res.send(sheet);
});

module.exports = router;
