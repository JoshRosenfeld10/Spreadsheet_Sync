const smartsheet = require("../modules/smartsheet"),
  arrayMove = require("../utils/arrayMove");

const isolatePrimaryColumn = async (smartsheetColumns, sheetId) => {
  const primaryColumnIndex = smartsheetColumns
    .map((column) => column.primary)
    .indexOf(true);

  if (
    smartsheetColumns[primaryColumnIndex].index !== 0 ||
    smartsheetColumns[primaryColumnIndex].title !== "Primary Column (IGNORE)"
  ) {
    await smartsheet.updateColumn({
      sheetId,
      columnId: smartsheetColumns[primaryColumnIndex].id,
      columnIndex: 0,
      columnTitle: "Primary Column (IGNORE)",
      hidden: true,
    });

    smartsheetColumns[primaryColumnIndex].title = "Primary Column (IGNORE)";

    if (smartsheetColumns[primaryColumnIndex].index !== 0)
      arrayMove(smartsheetColumns, primaryColumnIndex, 0);
  }
};

module.exports = isolatePrimaryColumn;
