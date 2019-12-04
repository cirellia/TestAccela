function runBusinessTaxReceiptAsync(itemCapId, reportName){
    var asyncScript = 'RUN_REPORT_ASYNC';

    var envParameters = aa.util.newHashMap();
    envParameters.put("ReportName", reportName); // add parameters needed for report
    envParameters.put("CapId", itemCapId)
    envParameters.put("CustomCapId",itemCapId.getCustomID());
    aa.runAsyncScript(asyncScript, envParameters);
}

