//To deactivate the other parallel tasks when Follow Up is initially activated
logDebug("Starting WTUA Script for workflow updates");
if (wfTask == "Follow Up" && matches(wfStatus, "First Magistrate Hearing Scheduled", "Second Magistrate Hearing Scheduled")) {
 		activateTask("Follow Up");
		}
if (matches(wfTask,"Follow Up","Initial Investigation","Case Intake") && matches(wfStatus, "No Violation", "Duplicate", "In-Compliance/Violation Corrected")) {
 		closeTask("Close", "Case-Closed", "Closed via script");
		}		

if(matches(wfTask, "Initial Inspection" ,"Follow Up") && wfStatus == "Print NOV") {
   Code_Generate_Reports();
}

Code_Assign_Record();

Code_Lien_Compliance();
