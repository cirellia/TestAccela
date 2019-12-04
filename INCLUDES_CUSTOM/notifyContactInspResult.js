function notifyContactInspResult(conType){
    logDebug("notifyContactInspResult() started");
    var scriptEnded = "notifyContactInspResult() ended";
    try{
        var emlTemplate = "MESSAGE_NOTICE_RESULT_INSPECTION";
        var applicant = getContactByType("Applicant", capId);
        
        if(!applicant){
            logDebug(conType + " was not found.");
            logDebug(scriptEnded);
            return false;
        }
        
        var emailTo = applicant.getEmail();
        if(!emailTo){
            logDebug("No email for " + conType + " found.");
            logDebug(scriptEnded);
            return false;
        }
        
        var params = aa.util.newHashtable();
        addParameter(params, "$InspItem$", inspType);
        addParameter(params, "$capID$", capIDString);
        addParameter(params, "$InspResult$", inspResult);
        addParameter(params, "$InspComment$", inspComment);
        
        //emailTo = "Cirellia@deland.org"; // TO TEST. REMOVE WHEN MOVING TO ENVIRONMENT.
        
        if(emailTo){
            var sendRes = aa.document.sendEmailByTemplateName("", emailTo, "", emlTemplate, params, null);
            if(sendRes.getSuccess()) logDebug("-->Successfully sent email to " + emailTo);
            else logDebug("Unable to send emails: " + sendRes.getErrorMessage());
        }
        else
            logDebug("WARNING: There is no applicant email address.");
        
    }
    catch(err){
        showMessage = true;;
        comment("Error on custom function notifyContactInspResult(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber);
        logDebug("Error on custom function notifyContactInspResult(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug(scriptEnded);
}

