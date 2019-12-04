function scheduleInspectionsValidationISB() {
    try {
        logDebug("Begin scheduleInspectionsValidationISB");
        loadASITablesBefore();
        var inspectionOrderTable = INSPECTIONORDER;
        //var inspectionGroup = "BD_Building";
        var reqInsp = inspType.toUpperCase();
        var inspFound = false;
        if (inspectionOrderTable && inspectionOrderTable.length > 0) {
            for (eachRow in inspectionOrderTable) {
                var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                //logDebug ("My inspection type in the ASIT is " + inspectionType + " and my inspFound is " + inspFound);
                var currentStatus = inspectionOrderTable[eachRow]["Current Status"].toString().toUpperCase();
                if (reqInsp ==inspectionType){
                logDebug("Does " + reqInsp + " = " + inspectionType + " . with status of: " + currentStatus);
                inspFound = true;
                    if (currentStatus != "AVAILABLE") {
                        cancel = true;
                        showMessage = true;
                        comment("The Inspection " + inspType + " is not available at this time, please see the Inspection Order Custom List");
                    }
                    if (currentStatus == "AVAILABLE"){
                        logDebug("Inspection Found and Available");
                        break;
                    }
                    if(inspFound ==false){
                    logDebug("finished one round of loops and true" + inspFound);
                    continue;
                    }
                }
            }
            if(inspFound == false){
                logDebug("We didn't find a match in the table");
                cancel = true;
                showMessage = true;
                comment("The Inspection " + inspType + " is not valid for this permit please see the Inspection Order Custom List");
            }

        }
        logDebug("End scheduleInspectionsValidationISB");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsValidationISB(), please contact administrator. Error: " + err);
    }
}

