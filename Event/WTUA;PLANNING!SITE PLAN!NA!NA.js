logDebug("Event WTUA:Planning/Site Plan/NA/NA");
if(wfTask == "Application Submittal" && wfStatus == "Fees Assessed"){
    PL_DesignReviewFees();
	PL_SitePlan_Application_Fees();
}
