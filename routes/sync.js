const express = require("express"),
  router = express.Router(),
  syncSmartsheetToGoogleSheet = require("../utils/syncSmartsheetToGoogleSheet"),
  syncGoogleSheetToSmartsheet = require("../utils/syncGoogleSheetToSmartsheet");

router.use(express.json());

router.get("/", async (req, res) => {
  const { syncDirection, googleSheetId, smartsheetSheetId, googleSheetName } =
    req.query;

  if (
    !syncDirection ||
    !googleSheetId ||
    !smartsheetSheetId ||
    !googleSheetName
  ) {
    res.sendStatus(400);
    return;
  }

  try {
    if (syncDirection === "S2G") {
      console.log(
        `Syncing Smartsheet ${smartsheetSheetId} to Google Sheet ${googleSheetId} (${googleSheetName})`
      );
      await syncSmartsheetToGoogleSheet({
        googleSheetId,
        smartsheetSheetId,
        googleSheetName,
      });
    } else if (syncDirection === "G2S") {
      console.log(
        `Syncing Google Sheet ${googleSheetId} (${googleSheetName}) to Smartsheet ${smartsheetSheetId}`
      );
      await syncGoogleSheetToSmartsheet({
        googleSheetId,
        smartsheetSheetId,
        googleSheetName,
      });
    } else {
      console.error("Invalid sync direction.");
      res.sendStatus(400);
      return;
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
    return;
  }

  res.set("Content-Type", "text/html");
  res.send(
    JSON.stringify(
      syncDirection === "S2G"
        ? `Smartsheet ${smartsheetSheetId} successfully synced to Google Sheet ${googleSheetId} (${googleSheetName}).`
        : `Google Sheet ${googleSheetId} (${googleSheetName}) successfully synced to Smartsheet ${smartsheetSheetId}.`
    )
  );
});

module.exports = router;
