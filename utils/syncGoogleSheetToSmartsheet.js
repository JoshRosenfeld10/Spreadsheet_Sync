const smartsheet = require("../modules/smartsheet"),
  google = require("../modules/google"),
  isolatePrimaryColumn = require("../utils/isolatePrimaryColumn"),
  arrayMove = require("../utils/arrayMove");

const syncGoogleSheetToSmartsheet = async ({
  googleSheetId,
  smartsheetSheetId,
  googleSheetName,
}) => {
  let defaultColumnCount = 0;

  const { data: googleSheet } = await google.getSheetRange({
    spreadsheetId: googleSheetId,
    range: googleSheetName,
  });

  const googleSheetRows = googleSheet.values;

  const { columns: smartsheetColumns } = await smartsheet.getSheet(
    smartsheetSheetId
  );

  const smartsheetColumnTitles = smartsheetColumns
    .filter((column) => !column.primary)
    .map((column) => column.title);

  const googleSheetColumns = googleSheetRows.shift().map((title) => {
    if (title === "") defaultColumnCount++;
    return title === "" ? `Column${defaultColumnCount}` : title;
  }); // shift() pops first element

  // Isolate Primary Column
  await isolatePrimaryColumn(smartsheetColumns, smartsheetSheetId);

  // Compare Columns
  await (async () => {
    for (const [index, googleColumnTitle] of googleSheetColumns.entries()) {
      const smartsheetColumnTitle = smartsheetColumnTitles[index];

      if (googleColumnTitle !== smartsheetColumnTitle) {
        if (smartsheetColumnTitles.includes(googleColumnTitle)) {
          // If column exists in Smartsheet, change column index
          const swapIndex = smartsheetColumns
            .map((column) => column.title)
            .indexOf(googleColumnTitle);

          await smartsheet.updateColumn({
            sheetId: smartsheetSheetId,
            columnId: smartsheetColumns[swapIndex].id,
            columnTitle: smartsheetColumns[swapIndex].title,
            columnIndex: index + 1,
          });

          arrayMove(smartsheetColumns, swapIndex, index + 1);
          arrayMove(smartsheetColumnTitles, swapIndex, index);
        } else {
          // If column does not exist in Smartsheet, create a new one
          await smartsheet.addColumn({
            sheetId: smartsheetSheetId,
            columnTitle: googleColumnTitle,
            columnIndex: index + 1,
          });

          smartsheetColumns.splice(index + 1, 0, googleColumnTitle);
        }
      }
    }
  })();

  // Delete extra columns in Smartsheet
  while (smartsheetColumns.length - 1 > googleSheetColumns.length) {
    await smartsheet.deleteColumn({
      sheetId: smartsheetSheetId,
      columnId: smartsheetColumns[smartsheetColumns.length - 1].id,
    });
    smartsheetColumns.pop();
  }

  const { rows: smartsheetRows, columns: updatedSmartsheetColumns } =
    await smartsheet.getSheet(smartsheetSheetId);

  const smartsheetColumnIds = updatedSmartsheetColumns
    .filter((column) => !column.primary)
    .map((column) => column.id);
  const smartsheetRowValues = smartsheetRows.map((row) =>
    row.cells
      .filter(
        (cell, idx) => (row.cells[idx + 1] || cell.displayValue) && idx !== 0
      )
      .map((cell) => cell.displayValue || "")
  );

  let newRows = [],
    updateRows = [],
    deleteRowIds = [];

  // Compare Rows
  (() => {
    for (const [index, googleSheetRow] of googleSheetRows.entries()) {
      const smartsheetRow = smartsheetRowValues[index];

      if (JSON.stringify(googleSheetRow) !== JSON.stringify(smartsheetRow)) {
        // If row doesn't exist, add new one
        if (smartsheetRow === undefined) {
          newRows.push({
            toBottom: true,
            cells: googleSheetRow.map((cell, idx) => ({
              value: cell,
              columnId: smartsheetColumnIds[idx],
            })),
          });
        } else {
          // If row does exist, update existing
          updateRows.push({
            id: smartsheetRows[index].id,
            cells: googleSheetRow.map((cell, idx) => ({
              value: cell,
              columnId: smartsheetColumnIds[idx],
            })),
          });
        }
      }
    }
  })();

  // Delete extra rows in Smartsheet
  while (smartsheetRows.length > googleSheetRows.length) {
    deleteRowIds.push(smartsheetRows.pop().id);
  }

  if (newRows.length) {
    await smartsheet.addRows({
      sheetId: smartsheetSheetId,
      rows: newRows,
    });
  }

  if (updateRows.length) {
    await smartsheet.updateRows({
      sheetId: smartsheetSheetId,
      rows: updateRows,
    });
  }

  if (deleteRowIds.length) {
    await smartsheet.deleteRows({
      sheetId: smartsheetSheetId,
      rowIds: deleteRowIds.toString(),
    });
  }
};

module.exports = syncGoogleSheetToSmartsheet;
