const smartsheet = require("../modules/smartsheet"),
  google = require("../modules/google"),
  isolatePrimaryColumn = require("../utils/isolatePrimaryColumn"),
  shiftN = require("./shiftN"),
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
    .filter((column) => !column.primary && !column.hidden)
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
          arrayMove(smartsheetColumnTitles, swapIndex - 1, index);
        } else {
          // If column does not exist in Smartsheet, create a new one
          await smartsheet.addColumn({
            sheetId: smartsheetSheetId,
            columnTitle: googleColumnTitle,
            columnIndex: index + 1,
          });

          smartsheetColumns.splice(index + 1, 0, googleColumnTitle);
          smartsheetColumnTitles.splice(index, 0, googleColumnTitle);
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
      .filter((cell, idx) => idx !== 0)
      .map((cell) => cell.displayValue || "")
  );

  smartsheetRowValues.forEach((row) => {
    while (row[row.length - 1] === "") {
      row.pop();
    }
    return row;
  });

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
    while (newRows.length > 500) {
      const groupOfRows = shiftN(newRows, 500);

      await smartsheet.addRows({
        sheetId: smartsheetSheetId,
        rows: groupOfRows,
      });
    }

    if (newRows.length) {
      await smartsheet.addRows({
        sheetId: smartsheetSheetId,
        rows: newRows,
      });
    }
  }

  if (updateRows.length) {
    while (updateRows.length > 500) {
      const groupOfRows = shiftN(updateRows, 500);

      await smartsheet.updateRows({
        sheetId: smartsheetSheetId,
        rows: groupOfRows,
      });
    }

    if (updateRows.length) {
      await smartsheet.updateRows({
        sheetId: smartsheetSheetId,
        rows: updateRows,
      });
    }
  }

  if (deleteRowIds.length) {
    while (deleteRowIds.length > 150) {
      const groupOfRows = shiftN(deleteRowIds, 150);

      await smartsheet.deleteRows({
        sheetId: smartsheetSheetId,
        rowIds: groupOfRows.toString(),
      });
    }

    if (deleteRowIds.length) {
      await smartsheet.deleteRows({
        sheetId: smartsheetSheetId,
        rowIds: deleteRowIds.toString(),
      });
    }
  }
};

module.exports = syncGoogleSheetToSmartsheet;
