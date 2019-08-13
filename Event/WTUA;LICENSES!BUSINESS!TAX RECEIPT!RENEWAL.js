BTR_Renew_LateFees();
if (wfTask == "Receipt Issuance" && wfStatus == "Renewed") {
	BTR_Set_Renew_License(capId);
}
