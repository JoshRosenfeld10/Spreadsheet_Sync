const express = require("express"),
  router = express.Router(),
  sync = require("../utils/sync"),
  syncSmartsheetToGoogleSheet = require("../utils/syncSmartsheetToGoogleSheet"),
  syncGoogleSheetToSmartsheet = require("../utils/syncGoogleSheetToSmartsheet"),
  smartsheet = require("../modules/smartsheet"),
  smartsheetUI = require("../constants/smartsheetUI");

router.use(express.json());

router.get("/", async (req, res) => {
  const {
    syncDirection,
    googleSheetId,
    smartsheetSheetId,
    googleSheetName,
    smartsheetReportId,
  } = req.query;

  const syncResponse = await sync({
    syncDirection,
    googleSheetId,
    smartsheetSheetId,
    googleSheetName,
    smartsheetReportId,
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
  if (req.body.challenge) {
    res.status(200).send({
      smartsheetHookResponse: req.body.challenge,
    });
    return;
  }

  console.log(req.body);
  const { rowId: rowIdUI, eventType } = req.body.events[0];
  res.sendStatus(200);

  // // If the webhook event is not an update event
  // if (eventType !== "updated") {
  //   res.sendStatus(200);
  //   return;
  // }

  // try {
  //   const { cells } = await smartsheet.getRow(smartsheetUI.sheetId, rowIdUI);

  //   const syncFlag = cells[smartsheetUI.syncFlagIndex].displayValue;

  //   if (syncFlag === "false") {
  //     res.sendStatus(200);
  //     return;
  //   }

  //   const syncDirectionConversion = {
  //     "From Google Sheet to Smartsheet": "G2S",
  //     "From Smartsheet to Google Sheet": "S2G",
  //     "From Report to Sheet (Smartsheet)": "R2S",
  //   };

  //   const syncDirection =
  //       syncDirectionConversion[
  //         cells[smartsheetUI.syncDirectionIndex].displayValue
  //       ],
  //     googleSheetId = cells[smartsheetUI.googleSheetIdIndex].displayValue,
  //     smartsheetSheetId =
  //       cells[smartsheetUI.smartsheetSheetIdIndex].displayValue,
  //     googleSheetName = cells[smartsheetUI.googleSheetNameIndex].displayValue;

  //   const syncResponse = await sync({
  //     syncDirection,
  //     googleSheetId,
  //     smartsheetSheetId,
  //     googleSheetName,
  //   });

  //   if (syncResponse.send === "code") {
  //     res.sendStatus(syncResponse.code);
  //     return;
  //   } else if (syncResponse.send === "string") {
  //     await smartsheet.updateRows({
  //       sheetId: smartsheetUI.sheetId,
  //       rows: [
  //         {
  //           id: rowIdUI,
  //           cells: cells
  //             .filter((cell) => cell.value && !cell.formula)
  //             .map((cell) =>
  //               cell.columnId === smartsheetUI.syncFlagColumnId
  //                 ? {
  //                     columnId: cell.columnId,
  //                     value: "false",
  //                   }
  //                 : cell
  //             ),
  //         },
  //       ],
  //     });
  //     res.set("Content-Type", "text/html");
  //     res.send(syncResponse.message);
  //     return;
  //   }
  // } catch (error) {
  //   res.sendStatus(400);
  //   return;
  // }
});

module.exports = router;
