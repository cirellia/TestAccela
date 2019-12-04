function establishLinks2RefContacts(){
    logDebug("establishLinks2RefContacts() started");
    try{
        iArr = new Array();
        contactTypeArray = new Array("Applicant","Business Owner","Corporate Officer","Director","Manager","Officer","Partner","President","Respondent","Shareholder","Building Owner","Emergency Contact");
        if(!feeEstimate){
            createRefContactsFromCapContactsAndLink(capId,contactTypeArray,iArr,false,false,comparePeopleGeneric);
        }
    }
    catch(err){
        showMessage = true;
        comment("Error on custom function establishLinks2RefContacts(). Err: " + err + ". Line Number: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("establishLinks2RefContacts() ended");
}//END establishLinks2RefContacts()

