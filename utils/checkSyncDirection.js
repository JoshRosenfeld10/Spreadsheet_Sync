const smartsheetUI = require("../constants/smartsheetUI"),
  smartsheet = require("../modules/smartsheet");

const checkSyncDirection = async (rowId) => {
  const { cells } = await smartsheet.getRow(smartsheetUI.sheetId, rowId);
  const syncDirection = cells[smartsheetUI.syncDirectionIndex].value;

  return syncDirection;
};

module.exports = checkSyncDirection;
