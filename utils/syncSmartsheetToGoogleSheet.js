const smartsheet = require("../modules/smartsheet"),
  google = require("../modules/google");

const syncSmartsheetToGoogleSheet = async ({
  googleSheetId,
  smartsheetSheetId,
  googleSheetName,
}) => {
  const {
    columns: smartsheetColumns,
    rows: smartsheetRows,
    totalRowCount: smartsheetRowCount,
  } = await smartsheet.getSheet(smartsheetSheetId);

  // ColumnIds of columns to ignore
  const smartsheetHiddenColumnIds = smartsheetColumns
    .filter((col) => col.hidden || col.title === "Primary Column (IGNORE)")
    .map((col) => col.id);

  const smartsheetColumnCount = smartsheetColumns.filter(
    (col) => !smartsheetHiddenColumnIds.includes(col.id)
  ).length;

  // Collect Smartsheet values
  const smartsheetColumnValues = smartsheetColumns
    .filter((col) => !smartsheetHiddenColumnIds.includes(col.id))
    .map((col) => (col.title.includes("Column") ? "" : col.title));
  const smartsheetRowValues = smartsheetRows.map((row) =>
    row.cells
      .filter((cell) => !smartsheetHiddenColumnIds.includes(cell.columnId))
      .map((cell) => cell.displayValue || cell.value || "")
  );

  // Filter blank spaces off the end of each row
  smartsheetRowValues.forEach((row) => {
    while (row[row.length - 1] === "") {
      row.pop();
    }
  });

  // Update Google Sheet grid size
  await google.updateDimensions({
    spreadsheetId: googleSheetId,
    rowCount: smartsheetRowCount + 100,
    columnCount: smartsheetColumnCount + 10,
  });

  // Clear unnecessary cells in Google Sheet
  await google.batchClear({
    spreadsheetId: googleSheetId,
    ranges: [
      `${googleSheetName}!${smartsheetRowCount + 1}:${
        smartsheetRowCount + 100
      }`,
      `${googleSheetName}!R1C${
        smartsheetColumnCount + 1
      }:R${smartsheetRowCount}C${smartsheetColumnCount + 10}`,
    ],
  });

  // Collect Google Sheet values
  const { data: googleSheet } = await google.getSheetRange({
    spreadsheetId: googleSheetId,
    range: googleSheetName,
  });
  const { values: googleSheetValues } = googleSheet;
  const googleSheetColumnValues = googleSheetValues[0];
  const googleSheetRowValues = googleSheetValues.slice(1);

  let updateRows = [];

  // Compare Columns
  (() => {
    if (
      JSON.stringify(smartsheetColumnValues) !==
      JSON.stringify(googleSheetColumnValues)
    ) {
      updateRows.push({
        range: `${googleSheetName}!1:1`,
        majorDimension: "ROWS",
        values: [smartsheetColumnValues],
      });
    }
  })();

  // Compare Rows
  (() => {
    for (const [index, smartsheetRow] of smartsheetRowValues.entries()) {
      if (
        JSON.stringify(smartsheetRow) !==
        JSON.stringify(googleSheetRowValues[index])
      ) {
        updateRows.push({
          range: `${googleSheetName}!${index + 2}:${index + 2}`, // consider index offset (+2)
          majorDimension: "ROWS",
          values: [smartsheetRow],
        });
      }
    }
  })();

  // Update Google Sheet rows
  await google.batchUpdate({
    spreadsheetId: googleSheetId,
    data: updateRows,
  });
};

module.exports = syncSmartsheetToGoogleSheet;
