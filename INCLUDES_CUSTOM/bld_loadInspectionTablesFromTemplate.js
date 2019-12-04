function bld_loadInspectionTablesFromTemplate() {
    if (wfStatus == "Load Inspection Template") {
        var templateName = AInfo["Template Name"];
        var templateCapIds = getCapsByTypeAndName("Building", "Template", "Inspection", null, templateName);
        if (templateCapIds.length) {
            copyASITables(templateCapIds[0], capId);
            logDebug("template table copied Successfully");
        }
    }
}




/*
** REUSABLE - LIBRARY FUNCTIONS
*/

//LIBRARY - returns array of CapIDModel matching group, type, subtype, category, & name
