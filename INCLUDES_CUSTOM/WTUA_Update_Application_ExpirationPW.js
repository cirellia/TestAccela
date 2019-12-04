function WTUA_Update_Application_ExpirationPW(){
  try{
    logDebug("begin function WTUA_Update_Application_Expiration");
    if((wfTask == "Application Submittal" || wfTask == "Application Acceptance") && matches(wfStatus,"Approved","Resubmittal Required","Completed", "Accepted","Accepted-OTC")){
      editAppSpecific("Application Expiration Date", dateAdd(null,365));
      logDebug("Application Expiration Date updated");
    }
    logDebug("End function WTUA_Update_Application_Expiration");
  }
  catch(err){
    showMessage = true;
        comment("Error on custom function WTUA_Update_Application_Expiration(). Please contact administrator. Err: " + err);
  }

}

