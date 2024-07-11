const syncSmartsheetToGoogleSheet = require("../utils/syncSmartsheetToGoogleSheet"),
  syncGoogleSheetToSmartsheet = require("../utils/syncGoogleSheetToSmartsheet");

const sync = async ({
  syncDirection,
  googleSheetId,
  smartsheetSheetId,
  googleSheetName,
}) => {
  if (
    !syncDirection ||
    !googleSheetId ||
    !smartsheetSheetId ||
    !googleSheetName
  ) {
    return {
      send: "code",
      code: 400,
    };
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
      return {
        send: "code",
        code: 400,
      };
    }
  } catch (error) {
    return {
      send: "code",
      code: 404,
    };
  }

  return {
    send: "string",
    message: JSON.stringify(
      syncDirection === "S2G"
        ? `Smartsheet ${smartsheetSheetId} successfully synced to Google Sheet ${googleSheetId} (${googleSheetName}).`
        : `Google Sheet ${googleSheetId} (${googleSheetName}) successfully synced to Smartsheet ${smartsheetSheetId}.`
    ),
  };
};

module.exports = sync;
