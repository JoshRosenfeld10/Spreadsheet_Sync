const express = require("express"),
  router = express.Router(),
  sync = require("../utils/sync"),
  syncSmartsheetToGoogleSheet = require("../utils/syncSmartsheetToGoogleSheet"),
  syncGoogleSheetToSmartsheet = require("../utils/syncGoogleSheetToSmartsheet"),
  smartsheet = require("../modules/smartsheet"),
  smartsheetUI = require("../constants/smartsheetUI");

router.use(express.json());

router.get("/", async (req, res) => {
  const { syncDirection, googleSheetId, smartsheetSheetId, googleSheetName } =
    req.query;

  const syncResponse = await sync({
    syncDirection,
    googleSheetId,
    smartsheetSheetId,
    googleSheetName,
  });

  if (syncResponse.send === "code") {
    res.sendStatus(syncResponse.code);
    return;
  } else if (syncResponse.send === "string") {
    res.set("Content-Type", "text/html");
    res.send(syncResponse.message);
    return;
  }

  res.sendStatus(500);
});

/**
 * Smartsheet Webhook Request Body
  {
    "nonce": "dea04437-e6f6-42be-9647-b9b296131a1b",
    "timestamp": "2024-06-05T14:53:37.003+00:00",
    "webhookId": 7455865323186052,
    "scope": "sheet",
    "scopeObjectId": 585916863172484,
    "events": [
        {
            "objectType": "cell",
            "eventType": "updated",
            "rowId": 3118671287127940,
            "columnId": 8206253518966660,
            "userId": 2512811755628420,
            "timestamp": "2024-06-05T14:53:31.000+00:00"
        }
    ]
  }
*/
router.post("/", async (req, res) => {
  const { rowId: rowIdUI } = req.body.events[0];

  try {
    const { cells } = await smartsheet.getRow(smartsheetUI.sheetId, rowIdUI);

    const syncDirection =
        cells[smartsheetUI.syncDirectionIndex].displayValue ===
        "From Google Sheet to Smartsheet"
          ? "G2S"
          : "S2G",
      googleSheetId = cells[smartsheetUI.googleSheetIdIndex].displayValue,
      smartsheetSheetId =
        cells[smartsheetUI.smartsheetSheetIdIndex].displayValue,
      googleSheetName = cells[smartsheetUI.googleSheetNameIndex].displayValue;

    const syncResponse = await sync({
      syncDirection,
      googleSheetId,
      smartsheetSheetId,
      googleSheetName,
    });

    if (syncResponse.send === "code") {
      res.sendStatus(syncResponse.code);
      return;
    } else if (syncResponse.send === "string") {
      res.set("Content-Type", "text/html");
      res.send(syncResponse.message);
      return;
    }
  } catch (error) {
    res.sendStatus(400);
    return;
  }
});

module.exports = router;
