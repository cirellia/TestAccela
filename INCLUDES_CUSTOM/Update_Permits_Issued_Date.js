function Update_Permits_Issued_Date(){
  try{
    logDebug("Begin Update_Permits_Issued_Date");
    if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
      //useAppSpecificGroupName = false;
      editAppSpecific("Permit Issued Date", dateAdd(null, 0));
    }
    logDebug("End Update_Permits_Issued_Date");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Update_Permits_Issued_Date(), please contact administrator. Error: " + err);
  }
}

