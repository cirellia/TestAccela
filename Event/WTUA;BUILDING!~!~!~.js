BD_Assess_Permit_Fees();
Update_Permits_Expiration_Permit_Issued_Date();
scheduleInspectionsFromTableWTUA();


if(wfTask == "Architectural"){
    bld_loadInspectionTablesFromTemplate();
}
