function Code_Assign_Record(){
  try{
    logDebug("Begin Code_Assign_Record");
    var user4Script = currentUserID; //defaultUser
    var foundUser = false;
    if(wfTask == "Case Intake" && matches(wfStatus,"Proactive Case","Assigned - Reactive")){
      var workflowResult = aa.workflow.getTasks(capId);
      if(workflowResult.getSuccess()){
        var vwkObj = workflowResult.getOutput();
      }
      else{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); }

      for (i in vwkObj ){
        task = vwkObj[i];
            taskName = task.getTaskDescription();
            if(taskName == "Case Intake"){
              var vUser = task.getAssignedStaff(); logDebug("vUser: " + vUser);
              //for(i in vUser) { aa.print(i + " - " + vUser[i]) }
            }
      }
      if(vUser.lastName == null){
        user4Script = currentUserID;
      }
      else
      {
        var tmpUserResult = aa.person.getUser(vUser.firstName, vUser.middleName, vUser.lastName);
        if(tmpUserResult.getSuccess()) {
          tmpUser = tmpUserResult.getOutput(); aa.print(tmpUser.getUserID());
          if(tmpUser){
            foundUser = true;
            user4Script = tmpUser.getUserID(); logDebug("userID: " + tmpUser.getUserID());
          }
        }
      }
      logDebug("user to use: " + user4Script);
    assignCap(user4Script);
        assignTask("Initial Investigation", user4Script);
        assignTask("Follow Up", user4Script);
        assignTask("Magistrate", user4Script);
        assignTask("Abatement", user4Script);
        assignTask("Lien", user4Script);
        assignTask("Close", user4Script);
        scheduleInspectDate("Initial Investigation", dateAdd(jsDateToMMDDYYYY(new Date()),1,"Y"),user4Script,null,capName);


    }
    logDebug("End Code_Assign_Record");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Code_Assign_Record(), please contact administrator. Error: " + err);
  }
}

