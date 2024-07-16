const express = require("express"),
  router = express.Router(),
  smartsheet = require("../modules/smartsheet");

router.use(express.json());

router.get("/", async (req, res) => {
  const sheets = await smartsheet.getSheets();
  res.send(sheets);
});

router.get("/:id", async (req, res) => {
  const sheet = await smartsheet.getSheet(req.params.id);
  res.send(sheet);
});

/**
 * Example Request Body
 * {
    "name": "In-Queue-Change",
    "callbackUrl": "https://rm-order-confirmations.onrender.com/attach",
    "scope": "sheet",
    "scopeObjectId": 585916863172484,
    "subscope": {
        "columnIds": [
            8206253518966660
        ]
    },
    "events": [
        "*.*"
    ],
    "version": 1
}
 */
router.post("/webhook", async (req, res) => {
  const data = await smartsheet.createWebhook(req.body);
  res.send(data);
});

router.get("/webhook", async (req, res) => {
  const data = await smartsheet.getWebhooks();
  res.send(data);
});

/**
 * Example Request Body
 * {
 *    enabled: true
 * }
 */
router.post("/webhook/:id", async (req, res) => {
  const data = await smartsheet.updateWebhook(req.params.id, req.body);
  res.send(data);
});

router.get("/webhook/:id", async (req, res) => {
  const data = await smartsheet.getWebhook(req.params.id);
  res.send(data);
});

router.get("/report/:id", async (req, res) => {
  // const data = await smartsheet.getReport(req.params.id);
  const data = await smartsheet.getReport(req.params.id);
  res.send(data);
});

module.exports = router;
