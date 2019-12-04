function scheduleInspectionsFromTableWTUA() {
    try {
        logDebug("Begin scheduleInspectionsFromTableWTUA");
        if (wfTask == "Review Consolidation" && matches(wfStatus,"Review Complete","Completed")){
            loadASITables();
            var inspectionOrderTable = INSPECTIONORDER;
            var inspectionGroup = "BD_Building";
            if (inspectionOrderTable && inspectionOrderTable.length > 0) {
                for (eachRow in inspectionOrderTable) {
                    var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                    createPendingInspection(inspectionGroup, inspectionType);
                }
            }
        }
        logDebug("End scheduleInspectionsFromTableWTUA");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function scheduleInspectionsFromTableWTUA(), please contact administrator. Error: " + err);
    }
}
