if(matches(inspResult,"Passed","Approved","Partial")){
    editAppSpecific("Permit Expiration Date", dateAdd(null,180));
	scheduleInspectionsIRSA();
}
if (matches(inspResult, "Passed", "Approved")) {
	createPendingInspection(inspGroup, inspType);
}
BD_Failed_Penalty_Inspection();

if(aa.env.getValue("From") != "AA"){
    notifyContactInspResult("Applicant");
}


