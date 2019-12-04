function Code_Generate_Reports() {
    try {
        loadASITables();
        var violationTable = VIOLATIONS;
        logDebug("begin Code_Generate_Reports");
        if (matches(wfTask, "Initial Inspection", "Follow Up") && wfStatus == "Print NOV") {
            if (violationTable && violationTable.length > 0) {
                var inVio = "N";
                for (x in violationTable) {
                    if (violationTable[x]["Status"] == "In Violation" && violationTable[x]["Initial Issued"] != "CHECKED")
                        inVio = "Y";
                    if (matches(violationTable[x]["Status"], "Resolved", "Rescinded") && violationTable[x]["Resolution Issued"] != "CHECKED")
                        inVio = "Y";
                }
                if (inVio == "Y") {
                    runReportAttach(capId, "Certificate of Occupancy", "altID", capId.getCustomID(), "AgencyID", "DELAND");
                    removeASITable("VIOLATIONS");
                    for (x in violationTable) {
                        if (violationTable[x]["Status"] == "In Violation" && violationTable[x]["Initial Issued"] != "CHECKED")
                            violationTable[x]["Initial Issued"] = "CHECKED";
                        if (matches(violationTable[x]["Status"], "Resolved", "Rescinded") && violationTable[x]["Resolution Issued"] != "CHECKED")
                            violationTable[x]["Resolution Issued"] = "CHECKED";
                    }
                    addASITable("VIOLATIONS", VIOLATIONS);
                }
            }
        }
        logDebug("End Code_Generate_Reports");
    }
    catch (err) {
        showMessage = true;
        comment("Error on WTUA:Enforcement/*/*/* custom function Code_Generate_Reports. Please contact administrator. Err: " + err);
    }
}

