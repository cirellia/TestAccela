function bld_addInspectionTemplateToList() {
    if(wfStatus == "Add to List"){
      editLookup('BD_InspTemplateList', capName, capName)        
    }
}

if(wfTask == "Inspection Template"){
    bld_addInspectionTemplateToList();
}

