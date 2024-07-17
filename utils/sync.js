const syncSmartsheetToGoogleSheet = require("../utils/syncSmartsheetToGoogleSheet"),
  syncGoogleSheetToSmartsheet = require("../utils/syncGoogleSheetToSmartsheet"),
  syncReportToSheet = require("./syncReportToSheet");

const sync = async ({
  syncDirection,
  googleSheetId,
  smartsheetSheetId,
  googleSheetName,
  smartsheetReportId,
  ignoreUnrelatedColumns,
}) => {
  if (
    !syncDirection ||
    ((syncDirection === "G2S" || syncDirection === "S2G") &&
      (!googleSheetId || !smartsheetSheetId || !googleSheetName)) ||
    (syncDirection === "R2S" && (!smartsheetSheetId || !smartsheetReportId))
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
        ignoreUnrelatedColumns,
      });
    } else if (syncDirection === "R2S") {
      console.log(
        `Syncing Smartsheet Report ${smartsheetReportId} to Smartsheet Sheet ${smartsheetSheetId}`
      );
      await syncReportToSheet({
        smartsheetSheetId,
        smartsheetReportId,
        ignoreUnrelatedColumns,
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
        : syncDirection === "G2S"
        ? `Google Sheet ${googleSheetId} (${googleSheetName}) successfully synced to Smartsheet ${smartsheetSheetId}.`
        : `Report ${smartsheetReportId} successfully synced to sheet ${smartsheetSheetId}.`
    ),
  };
};

module.exports = sync;
