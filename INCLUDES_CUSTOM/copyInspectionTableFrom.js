function copyInspectionTableFrom() {
    try {
        logDebug("Begin function copyInspectionTableFrom");
        if (matches(wfTask,"Architectural","Building") && wfStatus == "Load Inspection Template") {
            loadAppSpecific(AInfo, capId);
            var templateName = AInfo["Template Name"];
            //var inspTemplate = getAppIdByName("Building","Template","Inspection","NA",template);
            var getTemplateAltId = lookup("LKUP_Building_GetTemplateCapID", templateName);
            var getTempCapId = aa.cap.getCapID(getTemplateAltId).getOutput();
            if (getTempCapId) {
                //var vSourceCapID = aa.cap.getCapID(inspTemplate).getOutput(); aa.print(vSourceCapID);
                copyASITables(getTempCapId, capId);
                logDebug("template table copied Successfully");
            }
        }
        logDebug("End function copyInspectionTableFrom");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function copyInspectionTableFrom(), please contact administrator. Error: " + err);
    }
}

