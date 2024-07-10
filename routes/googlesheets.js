const express = require("express"),
  router = express.Router(),
  google = require("../modules/google");

router.use(express.json()); // middleware to read JSON objects

router.get("/:id", async (req, res) => {
  const sheet = await google.getSheet(req.params.id);
  res.send(sheet.data);
});

router.post("/:id", async (req, res) => {
  const sheet = await google.getSheetRange({
    spreadsheetId: req.params.id,
    range: req.body.range,
  });
  res.send(sheet.data);
});

module.exports = router;
