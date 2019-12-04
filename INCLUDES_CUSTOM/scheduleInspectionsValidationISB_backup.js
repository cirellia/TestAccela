function scheduleInspectionsValidationISB_backup() {
    try {
        logDebug("Begin scheduleInspectionsValidationISB");
        loadASITablesBefore();
        var inspectionOrderTable = INSPECTIONORDER;
        var inspectionGroup = "BD_Building";
        if (inspectionOrderTable && inspectionOrderTable.length > 0) {
            for (eachRow in inspectionOrderTable) {
                var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                var currentStatus = inspectionOrderTable[eachRow]["Current Status"].toString().toUpperCase();
                logDebug(inspType.toUpperCase() + " = " + inspectionType + " . with status of: " + currentStatus);
                if (inspType.toUpperCase().equals(inspectionType) && currentStatus != "AVAILABLE") {
                    cancel = true;
                    showMessage = true;
                    comment("The Inspection " + inspType + " is not available at this time, please see the Inspection Order Custom List");
                }
                if (inspType.toUpperCase().equals(inspectionType) && currentStatus == "AVAILABLE") {
                    logDebug("Inspection Found and Available");
                    break;
                }
            }
        }

        logDebug("End scheduleInspectionsValidationISB");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsValidationISB(), please contact administrator. Error: " + err);
    }
}

