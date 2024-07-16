const client = require("smartsheet"),
  constants = require("../constants/constants");

const smartsheet = () => {
  const createClient = () => {
    return client.createClient({
      accessToken: constants.smartsheetToken,
      logLevel: "info",
    });
  };

  return {
    getClient: async () => {
      return createClient();
    },
    getSheets: async () => {
      return await createClient().sheets.listSheets();
    },
    getSheet: async (id) => {
      return await createClient().sheets.getSheet({
        id,
        queryParameters: {
          pageSize: 10000,
        },
      });
    },
    getWebhooks: async () => {
      return await createClient().webhooks.listWebhooks({});
    },
    getWebhook: async (id) => {
      return await createClient().webhooks.getWebhook({
        webhookId: id,
      });
    },
    createWebhook: async (body) => {
      return await createClient().webhooks.createWebhook({
        body,
      });
    },
    updateWebhook: async (webhookId, body) => {
      return await createClient().webhooks.updateWebhook({
        webhookId,
        body,
      });
    },
    getRow: async (sheetId, rowId) => {
      return await createClient().sheets.getRow({
        sheetId,
        rowId,
      });
    },
    addColumn: async ({ sheetId, columnTitle, columnIndex }) => {
      return await createClient().sheets.addColumn({
        sheetId,
        body: [
          {
            title: columnTitle,
            type: "TEXT_NUMBER",
            index: columnIndex,
          },
        ],
      });
    },
    deleteColumn: async ({ sheetId, columnId }) => {
      return await createClient().sheets.deleteColumn({
        sheetId,
        columnId,
      });
    },
    listColumns: async (sheetId) => {
      return await createClient().sheets.getColumns({
        sheetId,
      });
    },
    updateColumn: async ({
      sheetId,
      columnId,
      columnTitle,
      columnIndex,
      hidden,
    }) => {
      return await createClient().sheets.updateColumn({
        sheetId,
        columnId,
        body: {
          index: columnIndex,
          title: columnTitle,
          hidden: hidden ? true : false,
        },
      });
    },
    /**
     * 500 row limit
     *
     * rows = [
     *    {
     *      toBottom: true,
     *      cells: [
     *        {
     *          columnId: ...,
     *          value: "..."
     *        },
     *      ]
     *    },
     * ]
     */
    addRows: async ({ sheetId, rows }) => {
      return await createClient().sheets.addRows({
        sheetId,
        body: rows,
      });
    },
    /**
     * 500 row limit
     *
     * rows = [
     *    {
     *      id: ...,
     *      cells: [
     *        {
     *          columnId: ...,
     *          value: "..."
     *        },
     *      ]
     *    },
     * ]
     */
    updateRows: async ({ sheetId, rows }) => {
      return await createClient().sheets.updateRow({
        sheetId,
        body: rows,
      });
    },
    deleteRows: async ({ sheetId, rowIds }) => {
      return await createClient().sheets.deleteRow({
        sheetId,
        rowId: rowIds, // array of rowIds
        queryParameters: {
          ignoreRowsNotFound: true,
        },
      });
    },

    /**
     * The Smartsheet node.js SDK's listReports & getReport methods are swapped
     */
    getReport: async (id) => {
      return await createClient().reports.listReports({
        id,
        queryParameters: {
          pageSize: 10000,
        },
      });
    },
  };
};

module.exports = smartsheet();
