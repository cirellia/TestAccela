BTR_Fire_Inspection_Scheduled();

BTR_Assess_BTR_Fee();

if(wfTask == "Receipt Issuance" && wfStatus == "Issued"){
   BTR_Issue_License_SetExpDate(capId);
}