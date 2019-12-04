function attachOwnerDisclosure(){
    if(AInfo["Owner Builder"] == "Yes") {
        logDebug("Attempting to attach Owner disclosure report");
        //runReportAttach(capId, "Owner Disclosure Statement", "RecordID", capId.getCustomID())
        var asyncScript = 'RUN_OWNER_DISC_ASYNC';

        var envParameters = aa.util.newHashMap();
        envParameters.put("ReportName", "Owner Disclosure Statement"); // add parameters needed for report
        envParameters.put("CapId", capId)
        envParameters.put("CustomCapId",capId.getCustomID());
        aa.runAsyncScript(asyncScript, envParameters);
    }
}

