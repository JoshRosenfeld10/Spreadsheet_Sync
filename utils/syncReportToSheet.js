const smartsheet = require("../modules/smartsheet"),
  isolatePrimaryColumn = require("../utils/isolatePrimaryColumn"),
  shiftN = require("./shiftN"),
  arrayMove = require("../utils/arrayMove");

const syncReportToSheet = async ({ smartsheetSheetId, smartsheetReportId }) => {
  const { columns: reportColumns, rows: reportRows } =
    await smartsheet.getReport(smartsheetReportId);

  const reportIgnoredColumnIds = reportColumns
    .filter((col) => col.hidden || col.primary)
    .map((col) => col.virtualId);

  const reportColumnValues = reportColumns
    .filter((col) => !reportIgnoredColumnIds.includes(col.virtualId))
    .map((col) => col.title);

  const { columns: sheetColumns } = await smartsheet.getSheet(
    smartsheetSheetId
  );

  const sheetIgnoredColumnIds = sheetColumns
    .filter((col) => col.hidden || col.primary)
    .map((col) => col.id);

  const sheetColumnValues = sheetColumns
    .filter((col) => !sheetIgnoredColumnIds.includes(col.id))
    .map((col) => col.title);

  // Isolate Primary Column
  await isolatePrimaryColumn(sheetColumns, smartsheetSheetId);

  // Compare Columns
  await (async () => {
    for (const [index, reportColumnValue] of reportColumnValues.entries()) {
      const sheetColumnValue = sheetColumnValues[index];

      if (!sheetColumnValue.includes(reportColumnValue)) {
        if (sheetColumnValues.slice(index).includes(reportColumnValue)) {
          // If column exists, change column index
          const swapIndex = sheetColumns
            .map((column) => column.title)
            .indexOf(reportColumnValue);

          await smartsheet.updateColumn({
            sheetId: smartsheetSheetId,
            columnId: sheetColumns[swapIndex].id,
            columnTitle: sheetColumns[swapIndex].title,
            columnIndex: index + 1,
          });

          arrayMove(sheetColumns, swapIndex, index + 1);
          arrayMove(sheetColumnValues, swapIndex - 1, index);
        } else {
          // If column does not exist in Smartsheet, create a new one

          let columnTitle = reportColumnValue;

          if (sheetColumnValues.includes(columnTitle)) {
            let increment = 1;
            columnTitle = `${reportColumnValue}${increment}`;
            while (sheetColumnValues.includes(columnTitle)) {
              increment++;
              columnTitle = `${reportColumnValue}${increment}`;
            }
          }

          await smartsheet.addColumn({
            sheetId: smartsheetSheetId,
            columnTitle: columnTitle,
            columnIndex: index + 1,
          });

          sheetColumns.splice(index + 1, 0, columnTitle);
          sheetColumnValues.splice(index, 0, columnTitle);
        }
      }
    }
  })();

  // Delete extra columns in sheet
  while (sheetColumns.length - 1 > reportColumnValues.length) {
    await smartsheet.deleteColumn({
      sheetId: smartsheetSheetId,
      columnId: sheetColumns[sheetColumns.length - 1].id,
    });
    sheetColumns.pop();
  }

  const { rows: sheetRows, columns: updatedSheetColumns } =
    await smartsheet.getSheet(smartsheetSheetId);

  const sheetColumnIds = updatedSheetColumns
    .filter((column) => !column.primary && !column.hidden)
    .map((column) => column.id);
  const sheetRowValues = sheetRows.map((row) =>
    row.cells
      .filter((cell, idx) => idx !== 0)
      .map((cell) => cell.displayValue || "")
  );

  const reportRowValues = reportRows.map((row) =>
    row.cells
      .filter((cell) => !reportIgnoredColumnIds.includes(cell.virtualColumnId))
      .map((cell) => cell.displayValue || cell.value || "")
  );

  let newRows = [],
    updateRows = [],
    deleteRowIds = [];

  // Compare Rows
  (() => {
    for (const [index, reportRow] of reportRowValues.entries()) {
      const sheetRow = sheetRowValues[index];

      if (JSON.stringify(reportRow) !== JSON.stringify(sheetRow)) {
        // If row doesn't exist, add new one
        if (sheetRow === undefined) {
          newRows.push({
            toBottom: true,
            cells: reportRow.map((cell, idx) => ({
              value: cell || "",
              columnId: sheetColumnIds[idx],
            })),
          });
        } else {
          // If row does exist, update existing
          updateRows.push({
            id: sheetRows[index].id,
            cells: reportRow.map((cell, idx) => ({
              value: cell || "",
              columnId: sheetColumnIds[idx],
            })),
          });
        }
      }
    }
  })();

  // Delete extra rows in Smartsheet
  while (sheetRows.length > reportRows.length) {
    deleteRowIds.push(sheetRows.pop().id);
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

module.exports = syncReportToSheet;
