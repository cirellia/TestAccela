function PL_Rezoning_Application_Fees() {
    try {
        logDebug("Begin PL_Rezoning_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Zoning Change  Type"];
        var acres = AInfo["Acres"];
        //if ((wfTask == "Application Submittal" && wfStatus == "Fees Assessed", 'WF:Application Submittal/Fees Assessed')) {
            if ((applType == "Planned Development Concept", 'applType == "Planned Development Concept"')) {
                updateFee("PDC", "PL_MAIN", "FINAL", acres, "N");
            }
            if ((applType == "Change of Zoning", 'applType == "Change of Zoning"')) {
                updateFee("REZONE", "PL_MAIN", "FINAL", acres, "N");
            }
            if ((applType == "Text Amendment", 'applType == "Text Amendment"')) {
                updateFee("ZLDRTEXT", "PL_MAIN", "FINAL", 1, "N");
            }
        //}
        logDebug("End PL_Rezoning_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Rezoning_Application_Fees(), please contact administrator. Error: " + err);
    }
}

