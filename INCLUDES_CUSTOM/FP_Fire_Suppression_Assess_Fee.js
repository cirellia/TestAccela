function FP_Fire_Suppression_Assess_Fee(){
  try{
    logDebug("begin function FP_Fire_Suppression_Assess_Fee");

    if(wfTask == "Plan Check" && wfStatus == "Approved"){
      updateFee("FIRESUPP", "FP_SUPPRESSION", "FINAL", 1, "N");
      updateFee("FIRESUPINSP", "FP_SUPPRESSION", "FINAL", 1, "N");
      logDebug("Fee FIRESUPP assessed");
    }
    logDebug("End function FP_Fire_Suppression_Assess_Fee");
  }
  catch(err){
    showMessage = true;
        comment("Error on custom function FP_Fire_Suppression_Assess_Fee(). Please contact administrator. Err: " + err);
  }
}

