if ("ADMIN".indexOf(currentUserID) > -1) {
	showDebug = true;
}

if(wfTask == "Review Consolidation" && wfStatus == "Completed") {
   BD_Assess_Permit_Fees();
}

if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
   Update_Permits_Expiration_Permit_Issued_Date();
}

if(wfTask == "Review Consolidation" && matches(wfStatus,"Review Complete","Completed")){
   scheduleInspectionsFromTableWTUA();
}

WTUA_Update_Application_Expiration();



if(matches(wfTask,"Architectural","Building")){
    bld_loadInspectionTablesFromTemplate();
}


if(wfTask == "Permit Issuance" && wfStatus == "Ready to Issue"){
   BD_Ready_To_Issue();
}