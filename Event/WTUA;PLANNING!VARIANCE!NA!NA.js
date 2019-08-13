logDebug("event WTUA:PLANNING/VARIANCE/NA/NA");
//assess Single Family Dwelling fees
if(wfTask == "Application Submittal" && wfStatus == "Fees Assessed"){
    PL_Variance_Application_Fees();
}