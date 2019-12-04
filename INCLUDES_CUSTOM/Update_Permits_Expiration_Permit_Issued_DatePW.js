function Update_Permits_Expiration_Permit_Issued_DatePW(){
  try{
    logDebug("Begin Update_Permits_Expiration_Permit_Issued_Date");
    if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
      //useAppSpecificGroupName = false;
      editAppSpecific("Permit Expiration Date", dateAdd(null, 365));
    }
    logDebug("End Update_Permits_Expiration_Permit_Issued_Date");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Update_Permits_Expiration_Permit_Issued_Date(), please contact administrator. Error: " + err);
  }
}

