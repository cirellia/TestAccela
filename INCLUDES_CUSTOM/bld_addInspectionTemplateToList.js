function bld_addInspectionTemplateToList() {
    if (wfStatus == "Add to List") {
        editLookup('BD_InspTemplateList', capName, capName)
    }
}

//CALLED FROM WTUA:BUILDING/*/*/*