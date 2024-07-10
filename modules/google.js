const { google: client } = require("googleapis"),
  constants = require("../constants/constants");

const google = () => {
  const createClient = () => {
    return client.sheets({
      version: "v4",
      auth: client.auth.fromJSON(constants.googleAuth),
    });
  };

  return {
    createClient: async () => {
      return createClient();
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/get
    getSheet: async (spreadsheetId) => {
      return await createClient().spreadsheets.get({
        spreadsheetId,
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
    getSheetRange: async ({ spreadsheetId, range }) => {
      return await createClient().spreadsheets.values.get({
        spreadsheetId,
        range,
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
    updateRange: async ({ spreadsheetId, range, values }) => {
      return await createClient().spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          range,
          majorDimension: "ROWS",
          values, // 2D array; each inner array represents a major dimension (row)
        },
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/clear
    clearRange: async ({ spreadsheetId, range }) => {
      return await createClient().spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchClear
    batchClear: async ({ spreadsheetId, ranges }) => {
      return await createClient().spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges, // array of ranges
        },
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
    // Adds to tables found within the range (range should be the headers of the table)
    appendRange: async ({ spreadsheetId, tableHeaderRange, values }) => {
      return await createClient().spreadsheets.values.append({
        spreadsheetId,
        range: tableHeaderRange,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          range: tableHeaderRange,
          majorDimension: "ROWS",
          values, // 2D array; each inner array represents a major dimension (row)
        },
      });
    },

    /**
     * data: [
     *    {
     *      range: ...,
     *      majorDimension: "ROWS",
     *      values: [
     *        {
     *          ...
     *        },
     *      ]
     *    },
     * ]
     */
    batchUpdate: async ({ spreadsheetId, data }) => {
      return await createClient().spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data, // array of ValueRanges
        },
      });
    },

    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request#UpdateSheetPropertiesRequest
    updateDimensions: async ({ spreadsheetId, rowCount, columnCount }) => {
      return await createClient().spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  gridProperties: {
                    rowCount,
                    columnCount,
                  },
                },
                fields: "gridProperties",
              },
            },
          ],
        },
      });
    },
  };
};

module.exports = google();
