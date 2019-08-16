/*------------------------------------------------------------------------------------------------------/
| Program : DELAND_INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be
        available to all master scripts
|
| Notes   : createRefLicProf - override to default the state if one is not provided
|
|         : createRefContactsFromCapContactsAndLink - testing new ability to link public users to new ref contacts
/------------------------------------------------------------------------------------------------------*/
var $iTrc = ifTracer;

eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));

function runReportTest(aaReportName) {
    x = "test param"
    currentUserID = "ADMIN";
    setCode = "X";
    var bReport = false;
    var reportName = aaReportName;
    report = aa.reportManager.getReportModelByName(reportName);
    report = report.getOutput();
    var permit = aa.reportManager.hasPermission(reportName, currentUserID);
    if (permit.getOutput().booleanValue()) {
        var parameters = aa.util.newHashMap();
        parameters.put("BatchNumber", setCode);
        //report.setReportParameters(parameters);
        var msg = aa.reportManager.runReport(parameters, report);
        aa.env.setValue("ScriptReturnCode", "0");
        aa.env.setValue("ScriptReturnMessage", msg.getOutput());
    }
}
function createRefLicProf(rlpId, rlpType, pContactType) {
    //Creates/updates a reference licensed prof from a Contact
    //06SSP-00074, modified for 06SSP-00238
    var updating = false;
    var capContResult = aa.people.getCapContactByCapID(capId);
    if (capContResult.getSuccess())
    { conArr = capContResult.getOutput(); }
    else
    {
        logDebug("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
        return false;
    }

    if (!conArr.length) {
        logDebug("**WARNING: No contact available");
        return false;
    }


    var newLic = getRefLicenseProf(rlpId)

    if (newLic) {
        updating = true;
        logDebug("Updating existing Ref Lic Prof : " + rlpId);
    }
    else
        var newLic = aa.licenseScript.createLicenseScriptModel();

    //get contact record
    if (pContactType == null)
        var cont = conArr[0]; //if no contact type specified, use first contact
    else {
        var contFound = false;
        for (yy in conArr) {
            if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType())) {
                cont = conArr[yy];
                contFound = true;
                break;
            }
        }
        if (!contFound) {
            logDebug("**WARNING: No Contact found of type: " + pContactType);
            return false;
        }
    }

    peop = cont.getPeople();
    addr = peop.getCompactAddress();

    newLic.setContactFirstName(cont.getFirstName());
    //newLic.setContactMiddleName(cont.getMiddleName());  //method not available
    newLic.setContactLastName(cont.getLastName());
    newLic.setBusinessName(peop.getBusinessName());
    newLic.setAddress1(addr.getAddressLine1());
    newLic.setAddress2(addr.getAddressLine2());
    newLic.setAddress3(addr.getAddressLine3());
    newLic.setCity(addr.getCity());
    newLic.setState(addr.getState());
    newLic.setZip(addr.getZip());
    newLic.setPhone1(peop.getPhone1());
    newLic.setPhone2(peop.getPhone2());
    newLic.setEMailAddress(peop.getEmail());
    newLic.setFax(peop.getFax());

    newLic.setAgencyCode(aa.getServiceProviderCode());
    newLic.setAuditDate(sysDate);
    newLic.setAuditID(currentUserID);
    newLic.setAuditStatus("A");

    if (AInfo["Insurance Co"]) newLic.setInsuranceCo(AInfo["Insurance Co"]);
    if (AInfo["Insurance Amount"]) newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
    if (AInfo["Insurance Exp Date"]) newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
    if (AInfo["Policy #"]) newLic.setPolicy(AInfo["Policy #"]);

    if (AInfo["Business License #"]) newLic.setBusinessLicense(AInfo["Business License #"]);
    if (AInfo["Business License Exp Date"]) newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));

    newLic.setLicenseType(rlpType);

    if (addr.getState() != null)
        newLic.setLicState(addr.getState());
    else
        newLic.setLicState("AK"); //default the state if none was provided

    newLic.setStateLicense(rlpId);

    if (updating)
        myResult = aa.licenseScript.editRefLicenseProf(newLic);
    else
        myResult = aa.licenseScript.createRefLicenseProf(newLic);

    if (myResult.getSuccess()) {
        logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
        logMessage("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
        return true;
    }
    else {
        logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
        logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
        return false;
    }
}


function createRefContactsFromCapContactsAndLink(pCapId, contactTypeArray, ignoreAttributeArray, replaceCapContact, overwriteRefContact, refContactExists) {

    // contactTypeArray is either null (all), or an array or contact types to process
    //
    // ignoreAttributeArray is either null (none), or an array of attributes to ignore when creating a REF contact
    //
    // replaceCapContact not implemented yet
    //
    // overwriteRefContact -- if true, will refresh linked ref contact with CAP contact data
    //
    // refContactExists is a function for REF contact comparisons.
    //
    // Version 2.0 Update:   This function will now check for the presence of a standard choice "REF_CONTACT_CREATION_RULES".
    // This setting will determine if the reference contact will be created, as well as the contact type that the reference contact will
    // be created with.  If this setting is configured, the contactTypeArray parameter will be ignored.   The "Default" in this standard
    // choice determines the default action of all contact types.   Other types can be configured separately.
    // Each contact type can be set to "I" (create ref as individual), "O" (create ref as organization),
    // "F" (follow the indiv/org flag on the cap contact), "D" (Do not create a ref contact), and "U" (create ref using transaction contact type).

    var standardChoiceForBusinessRules = "REF_CONTACT_CREATION_RULES";


    var ingoreArray = new Array();
    if (arguments.length > 1) ignoreArray = arguments[1];

    var defaultContactFlag = lookup(standardChoiceForBusinessRules, "Default");

    var c = aa.people.getCapContactByCapID(pCapId).getOutput()
    var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput()  // must have two working datasets

    for (var i in c) {
        var ruleForRefContactType = "U"; // default behavior is create the ref contact using transaction contact type
        var con = c[i];

        var p = con.getPeople();

        var contactFlagForType = lookup(standardChoiceForBusinessRules, p.getContactType());

        if (!defaultContactFlag && !contactFlagForType) // standard choice not used for rules, check the array passed
        {
            if (contactTypeArray && !exists(p.getContactType(), contactTypeArray))
                continue;  // not in the contact type list.  Move along.
        }

        if (!contactFlagForType && defaultContactFlag) // explicit contact type not used, use the default
        {
            ruleForRefContactType = defaultContactFlag;
        }

        if (contactFlagForType) // explicit contact type is indicated
        {
            ruleForRefContactType = contactFlagForType;
        }

        if (ruleForRefContactType.equals("D"))
            continue;

        var refContactType = "";

        switch (ruleForRefContactType) {
            case "U":
                refContactType = p.getContactType();
                break;
            case "I":
                refContactType = "Individual";
                break;
            case "O":
                refContactType = "Organization";
                break;
            case "F":
                if (p.getContactTypeFlag() && p.getContactTypeFlag().equals("organization"))
                    refContactType = "Organization";
                else
                    refContactType = "Individual";
                break;
        }

        var refContactNum = con.getCapContactModel().getRefContactNumber();

        if (refContactNum)  // This is a reference contact.   Let's refresh or overwrite as requested in parms.
        {
            if (overwriteRefContact) {
                p.setContactSeqNumber(refContactNum);  // set the ref seq# to refresh
                p.setContactType(refContactType);

                var a = p.getAttributes();

                if (a) {
                    var ai = a.iterator();
                    while (ai.hasNext()) {
                        var xx = ai.next();
                        xx.setContactNo(refContactNum);
                    }
                }

                var r = aa.people.editPeopleWithAttribute(p, p.getAttributes());

                if (!r.getSuccess())
                    logDebug("WARNING: couldn't refresh reference people : " + r.getErrorMessage());
                else
                    logDebug("Successfully refreshed ref contact #" + refContactNum + " with CAP contact data");
            }

            if (replaceCapContact) {
                // To Be Implemented later.   Is there a use case?
            }

        }
        else  // user entered the contact freehand.   Let's create or link to ref contact.
        {
            var ccmSeq = p.getContactSeqNumber();

            var existingContact = refContactExists(p);  // Call the custom function to see if the REF contact exists

            var p = cCopy[i].getPeople();  // get a fresh version, had to mangle the first for the search

            if (existingContact)  // we found a match with our custom function.  Use this one.
            {
                refPeopleId = existingContact;
            }
            else  // did not find a match, let's create one
            {

                var a = p.getAttributes();

                if (a) {
                    //
                    // Clear unwanted attributes
                    var ai = a.iterator();
                    while (ai.hasNext()) {
                        var xx = ai.next();
                        if (ignoreAttributeArray && exists(xx.getAttributeName().toUpperCase(), ignoreAttributeArray))
                            ai.remove();
                    }
                }

                p.setContactType(refContactType);
                var r = aa.people.createPeopleWithAttribute(p, a);

                if (!r.getSuccess())
                { logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage()); continue; }

                //
                // createPeople is nice and updates the sequence number to the ref seq
                //

                var p = cCopy[i].getPeople();
                var refPeopleId = p.getContactSeqNumber();

                logDebug("Successfully created reference contact #" + refPeopleId);

                // Need to link to an existing public user.

                var getUserResult = aa.publicUser.getPublicUserByEmail(con.getEmail())
                if (getUserResult.getSuccess() && getUserResult.getOutput()) {
                    var userModel = getUserResult.getOutput();
                    logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: " + userModel.getUserID());

                    if (refPeopleId) {
                        logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : " + refPeopleId);
                        aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refPeopleId);
                    }
                }
            }

            //
            // now that we have the reference Id, we can link back to reference
            //

            var ccm = aa.people.getCapContactByPK(pCapId, ccmSeq).getOutput().getCapContactModel();

            ccm.setRefContactNumber(refPeopleId);
            r = aa.people.editCapContact(ccm);

            if (!r.getSuccess())
            { logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage()); }
            else
            { logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq); }


        }  // end if user hand entered contact
    }  // end for each CAP contact
} // end function

function reversePayment() { logDebug("hello") }


function addToASITable(tableName, tableValues) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValues is an associative array of values.  All elements must be either a string or asiTableVal object
    itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess())
    { logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()); return false }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField();
    var col = tsm.getColumns();
    var fld_readonly = tsm.getReadonlyField(); //get ReadOnly property
    var coli = col.iterator();

    while (coli.hasNext()) {
        colname = coli.next();

        if (!tableValues[colname.getColumnName()]) {
            logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
            tableValues[colname.getColumnName()] = "";
        }

        if (typeof (tableValues[colname.getColumnName()].fieldValue) != "undefined") {
            fld.add(tableValues[colname.getColumnName()].fieldValue);
            fld_readonly.add(tableValues[colname.getColumnName()].readOnly);
        }
        else // we are passed a string
        {
            fld.add(tableValues[colname.getColumnName()]);
            fld_readonly.add(null);
        }
    }

    tsm.setTableField(fld);
    tsm.setReadonlyField(fld_readonly); // set readonly field

    addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
    if (!addResult.getSuccess())
    { logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()); return false }
    else
        logDebug("Successfully added record to ASI Table: " + tableName);
}

function addASITable(tableName, tableValueArray) // optional capId
{
    //  tableName is the name of the ASI table
    //  tableValueArray is an array of associative array values.  All elements MUST be either a string or asiTableVal object
    var itemCap = capId
    if (arguments.length > 2)
        itemCap = arguments[2]; // use cap ID specified in args

    var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap, tableName)

    if (!tssmResult.getSuccess()) {
        logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage());
        return false
    }

    var tssm = tssmResult.getOutput();
    var tsm = tssm.getAppSpecificTableModel();
    var fld = tsm.getTableField();
    var fld_readonly = tsm.getReadonlyField(); // get Readonly field

    for (thisrow in tableValueArray) {

        var col = tsm.getColumns()
        var coli = col.iterator();
        while (coli.hasNext()) {
            var colname = coli.next();

            if (!tableValueArray[thisrow][colname.getColumnName()]) {
                logDebug("addToASITable: null or undefined value supplied for column " + colname.getColumnName() + ", setting to empty string");
                tableValueArray[thisrow][colname.getColumnName()] = "";
            }

            if (typeof (tableValueArray[thisrow][colname.getColumnName()].fieldValue) != "undefined") // we are passed an asiTablVal Obj
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
                fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);
                //fld_readonly.add(null);
            } else // we are passed a string
            {
                fld.add(tableValueArray[thisrow][colname.getColumnName()]);
                fld_readonly.add(null);
            }
        }

        tsm.setTableField(fld);

        tsm.setReadonlyField(fld_readonly);

    }

    var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

    if (!addResult.getSuccess()) {
        logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage());
        return false
    } else
        logDebug("Successfully added record to ASI Table: " + tableName);

}


function getLatestScheduledDate() {
    var inspResultObj = aa.inspection.getInspections(capId);
    if (inspResultObj.getSuccess()) {
        inspList = inspResultObj.getOutput();
        var array = new Array();
        var j = 0;
        for (i in inspList) {
            if (inspList[i].getInspectionStatus().equals("Scheduled")) {
                array[j++] = aa.util.parseDate(inspList[i].getInspection().getScheduledDate());
            }
        }

        var latestScheduledDate = array[0];
        for (k = 0; k < array.length; k++) {
            temp = array[k];
            logDebug("----------array.k---------->" + array[k]);
            if (temp.after(latestScheduledDate)) {
                latestScheduledDate = temp;
            }
        }
        return latestScheduledDate;
    }
    return false;
}



function cntAssocGarageSales(strnum, strname, city, state, zip, cfname, clname) {
    logDebug("Begin cntAssocGarageSales");
    /***

    Searches for Garage-Yard Sale License records
    - Created in the current year
    - Matches address parameters provided
    - Matches the contact first and last name provided
    - Returns the count of records

    ***/

    // Create a cap model for search
    var searchCapModel = aa.cap.getCapModel().getOutput();

    // Set cap model for search. Set search criteria for record type DCA/*/*/*
    var searchCapModelType = searchCapModel.getCapType();
    searchCapModelType.setGroup("Licenses");
    searchCapModelType.setType("Temporary");
    searchCapModelType.setSubType("Garage Sale");
    searchCapModelType.setCategory("Permit");
    searchCapModel.setCapType(searchCapModelType);

    searchAddressModel = searchCapModel.getAddressModel();
    searchAddressModel.setStreetName(strname);

    gisObject = new com.accela.aa.xml.model.gis.GISObjects;
    qf = new com.accela.aa.util.QueryFormat;

    var toDate = aa.date.getCurrentDate();
    var fromDate = aa.date.parseDate("01/01/" + toDate.getYear());

    var recordCnt = 0;
    message = "The applicant has reached the Garage-Sale License limit of 2 per calendar year.<br>"

    capList = aa.cap.getCapListByCollection(searchCapModel, searchAddressModel, "", fromDate, toDate, qf, gisObject).getOutput();
    for (x in capList) {
        logDebug("iterating through capList");
        resultCap = capList[x];
        resultCapId = resultCap.getCapID();
        altId = resultCapId.getCustomID();
        //aa.print("Record ID: " + altId);
        resultCapIdScript = aa.cap.createCapIDScriptModel(resultCapId.getID1(), resultCapId.getID2(), resultCapId.getID3());
        contact = aa.cap.getCapPrimaryContact(resultCapIdScript).getOutput();

        contactFname = contact.getFirstName();
        contactLname = contact.getLastName();
        logDebug("New Garage Sale Contact: " + clname +" "+cfname + " Existing Garage Sale Contact: " + contactFname +" "+ contactLname);

        if (contactFname == cfname && contactLname == clname) {
            recordCnt++;
            message = message + recordCnt + ": " + altId + " - " + contactFname + " " + contactLname + " @ " + strnum + " " + strname + "<br>";
        }
    }
    logDebug("recordCnt: " + recordCnt);
    return recordCnt;
    logDebug("End cntAssocGarageSales");
}

function copyContactsWithAddress(pFromCapId, pToCapId) {
    // Copies all contacts from pFromCapId to pToCapId and includes Contact Address objects
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
    var copied = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var newContact = Contacts[yy].getCapContactModel();

            var newPeople = newContact.getPeople();
            // aa.print("Seq " + newPeople.getContactSeqNumber());

            var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
            newContact.setCapID(vToCapId);
            aa.people.createCapContact(newContact);
            newerPeople = newContact.getPeople();
            // contact address copying
            if (addressList) {
                for (add in addressList) {
                    var transactionAddress = false;
                    contactAddressModel = addressList[add].getContactAddressModel();

                    logDebug("contactAddressModel.getEntityType():" + contactAddressModel.getEntityType());

                    if (contactAddressModel.getEntityType() == "CAP_CONTACT") {
                        transactionAddress = true;
                        contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                    }
                    // Commit if transaction contact address
                    if (transactionAddress) {
                        var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
                        contactAddressModel.setContactAddressPK(newPK);
                        //aa.address.createCapContactAddress(vToCapId, contactAddressModel);
                    }
                        // Commit if reference contact address
                    else {
                        // build model
                        var Xref = aa.address.createXRefContactAddressModel().getOutput();
                        Xref.setContactAddressModel(contactAddressModel);
                        Xref.setAddressID(addressList[add].getAddressID());
                        Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                        Xref.setEntityType(contactAddressModel.getEntityType());
                        Xref.setCapID(vToCapId);
                        // commit address
                        commitAddress = aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
                        if (commitAddress.getSuccess()) {
                            commitAddress.getOutput();
                            logDebug("Copied contact address");
                        }
                    }
                }
            }
            // end if
            copied++;
            logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
}


function changeCapContactTypes(origType, newType) {
    // Renames all contacts of type origType to contact type of newType and includes Contact Address objects
    //
    var vCapId = capId;
    if (arguments.length == 3)
        vCapId = arguments[2];

    var capContactResult = aa.people.getCapContactByCapID(vCapId);
    var renamed = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var contact = Contacts[yy].getCapContactModel();

            var people = contact.getPeople();
            var contactType = people.getContactType();
            aa.print("Contact Type " + contactType);

            if (contactType == origType) {

                var contactNbr = people.getContactSeqNumber();
                var editContact = aa.people.getCapContactByPK(vCapId, contactNbr).getOutput();
                editContact.getCapContactModel().setContactType(newType)

                aa.print("Set to: " + people.getContactType());
                renamed++;

                var updContactResult = aa.people.editCapContact(editContact.getCapContactModel());
                logDebug("contact " + updContactResult);
                logDebug("contact.getSuccess() " + updContactResult.getSuccess());
                logDebug("contact.getOutput() " + updContactResult.getOutput());
                updContactResult.getOutput();
                logDebug("Renamed contact from " + origType + " to " + newType);
            }
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return renamed;
}

function checkWorkflowTaskAndStatus(capId, workflowTask, taskStatus) {
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else {
        aa.print("**ERROR: Failed to get workflow object: " + wfObj);
        return false;
    }

    for (i in wfObj) {
        fTask = wfObj[i];
        var status = fTask.getDisposition();
        var taskDesc = fTask.getTaskDescription();

        if (status != null && taskDesc != null && taskDesc.equals(workflowTask) && status.equals(taskStatus))
            return true;
    }

    return false;
}


function associatedRefContactWithRefLicProf(capIdStr, refLicProfSeq, servProvCode, auditID) {
    var contact = getLicenseHolderByLicenseNumber(capIdStr);
    if (contact && contact.getRefContactNumber()) {
        linkRefContactWithRefLicProf(parseInt(contact.getRefContactNumber()), refLicProfSeq, servProvCode, auditID)
    }
    else {
        logMessage("**ERROR:cannot find license holder of license");
    }
}

function linkRefContactWithRefLicProf(refContactSeq, refLicProfSeq, servProvCode, auditID) {

    if (refContactSeq && refLicProfSeq && servProvCode && auditID) {
        var xRefContactEntity = aa.people.getXRefContactEntityModel().getOutput();
        xRefContactEntity.setServiceProviderCode(servProvCode);
        xRefContactEntity.setContactSeqNumber(refContactSeq);
        xRefContactEntity.setEntityType("PROFESSIONAL");
        xRefContactEntity.setEntityID1(refLicProfSeq);
        var auditModel = xRefContactEntity.getAuditModel();
        auditModel.setAuditDate(new Date());
        auditModel.setAuditID(auditID);
        auditModel.setAuditStatus("A")
        xRefContactEntity.setAuditModel(auditModel);
        var xRefContactEntityBusiness = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.XRefContactEntityBusiness").getOutput();
        var existedModel = xRefContactEntityBusiness.getXRefContactEntityByUIX(xRefContactEntity);
        if (existedModel.getContactSeqNumber()) {
            //aa.print("The professional license have already linked to contact.");
            logMessage("License professional link to reference contact successfully.");
        }
        else {
            var XRefContactEntityCreatedResult = xRefContactEntityBusiness.createXRefContactEntity(xRefContactEntity);
            if (XRefContactEntityCreatedResult) {
                //aa.print("License professional link to reference contact successfully.");
                logMessage("License professional link to reference contact successfully.");
            }
            else {
                //aa.print("**ERROR:License professional failed to link to reference contact.  Reason: " +  XRefContactEntityCreatedResult.getErrorMessage());
                logMessage("**ERROR:License professional failed to link to reference contact.  Reason: " + XRefContactEntityCreatedResult.getErrorMessage());
            }
        }
    }
    else {
        //aa.print("**ERROR:Some Parameters are empty");
        logMessage("**ERROR:Some Parameters are empty");
    }

}


function getConatctAddreeByID(contactID, vAddressType) {
    var conArr = new Array();
    var capContResult = aa.people.getCapContactByContactID(contactID);

    if (capContResult.getSuccess()) {
        conArr = capContResult.getOutput();
        for (contact in conArr) {
            cont = conArr[contact];

            return getContactAddressByContact(cont.getCapContactModel(), vAddressType);
        }
    }
}

function getContactAddressByContact(contactModel, vAddressType) {
    var xrefContactAddressBusiness = aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.XRefContactAddressBusiness").getOutput();
    var contactAddressArray = xrefContactAddressBusiness.getContactAddressListByCapContact(contactModel);
    for (i = 0; i < contactAddressArray.size() ; i++) {
        var contactAddress = contactAddressArray.get(i);
        if (vAddressType.equals(contactAddress.getAddressType())) {
            return contactAddress;
        }
    }
}

function copyContactAddressToLicProf(contactAddress, licProf) {
    if (contactAddress && licProf) {
        licProf.setAddress1(contactAddress.getAddressLine1());
        licProf.setAddress2(contactAddress.getAddressLine2());
        licProf.setAddress3(contactAddress.getAddressLine3());
        licProf.setCity(contactAddress.getCity());
        licProf.setState(contactAddress.getState());
        licProf.setZip(contactAddress.getZip());
        licProf.getLicenseModel().setCountryCode(contactAddress.getCountryCode());
    }
}


function associatedLicensedProfessionalWithPublicUser(licnumber, publicUserID) {
    var mylicense = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(), licnumber);
    var puser = aa.publicUser.getPublicUserByPUser(publicUserID);
    if (puser.getSuccess())
        aa.licenseScript.associateLpWithPublicUser(puser.getOutput(), mylicense.getOutput());
}

function associatedRefContactWithRefLicProf(capIdStr, refLicProfSeq, servProvCode, auditID) {
    var contact = getLicenseHolderByLicenseNumber(capIdStr);
    if (contact && contact.getRefContactNumber()) {
        linkRefContactWithRefLicProf(parseInt(contact.getRefContactNumber()), refLicProfSeq, servProvCode, auditID)
    }
    else {
        logMessage("**ERROR:cannot find license holder of license");
    }
}

function taskCloseAllAdjustBranchtaskExcept(e, t) {
    var n = new Array;
    var r = false;
    if (arguments.length > 2) {
        for (var i = 2; i < arguments.length; i++)
            n.push(arguments[i])
    } else
        r = true;
    var s = aa.workflow.getTasks(capId);
    if (s.getSuccess())
        var o = s.getOutput();
    else {
        logMessage("**ERROR: Failed to get workflow object: " + s.getErrorMessage());
        return false
    }
    var u;
    var a;
    var f;
    var l = aa.date.getCurrentDate();
    var c = " ";
    var h;
    for (i in o) {
        u = o[i];
        h = u.getTaskDescription();
        a = u.getStepNumber();
        if (r) {
            aa.workflow.handleDisposition(capId, a, e, l, c, t, systemUserObj, "B");
            logMessage("Closing Workflow Task " + h + " with status " + e);
            logDebug("Closing Workflow Task " + h + " with status " + e)
        } else {
            if (!exists(h, n)) {
                aa.workflow.handleDisposition(capId, a, e, l, c, t, systemUserObj, "B");
                logMessage("Closing Workflow Task " + h + " with status " + e);
                logDebug("Closing Workflow Task " + h + " with status " + e)
            }
        }
    }
}

function getLicenseHolderByLicenseNumber(capIdStr) {
    var capContactResult = aa.people.getCapContactByCapID(capIdStr);
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var contact = Contacts[yy].getCapContactModel();
            var contactType = contact.getContactType();
            //if (contactType.toUpperCase().equals("LICENSE HOLDER") && contact.getRefContactNumber()) {
            if (contactType.toUpperCase().equals("APPLICANT") && contact.getRefContactNumber()) {
                return contact;
            }
        }
    }
}

function taskCloseAllExcept(pStatus, pComment) {
    // Closes all tasks in CAP with specified status and comment
    // Optional task names to exclude
    // 06SSP-00152
    //
    var taskArray = new Array();
    var closeAll = false;
    if (arguments.length > 2) //Check for task names to exclude
    {
        for (var i = 2; i < arguments.length; i++)
            taskArray.push(arguments[i]);
    }
    else
        closeAll = true;

    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
        return false;
    }

    var fTask;
    var stepnumber;
    var processID;
    var dispositionDate = aa.date.getCurrentDate();
    var wfnote = " ";
    var wftask;

    for (i in wfObj) {
        fTask = wfObj[i];
        wftask = fTask.getTaskDescription();
        stepnumber = fTask.getStepNumber();
        //processID = fTask.getProcessID();
        if (closeAll) {
            aa.workflow.handleDisposition(capId, stepnumber, pStatus, dispositionDate, wfnote, pComment, systemUserObj, "Y");
            logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
            logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
        }
        else {
            if (!exists(wftask, taskArray)) {
                aa.workflow.handleDisposition(capId, stepnumber, pStatus, dispositionDate, wfnote, pComment, systemUserObj, "Y");
                logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
                logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
            }
        }
    }
}

//check if there are fees on the record.
function feeItemsOnCap() {
    var itemCap = capId
    if (arguments.length > 0)
        itemCap = arguments[0]; // use cap ID specified in args
    var feeResult = aa.fee.getFeeItems(itemCap);
    if (feeResult.getSuccess()) {
        var feeObjArr = feeResult.getOutput();
        if (feeObjArr.length > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        logDebug("**ERROR: getting fee items: " + capContResult.getErrorMessage());
        return false
    }
}

function ifTracer (cond, msg) {
    cond = cond ? true : false;
    logDebug((cond).toString().toUpperCase() + ': ' + msg)
    return cond;
}

function FP_Fire_Sprinkler_Assess_Fee() {
    try {
        logDebug("begin function FP_Fire_Sprinkler_Assess_Fee");

        loadAppSpecific(AInfo, capId);
        var quantity = AInfo["Building Square Footage"];
        if (wfTask == "Plan Check" && wfStatus == "Approved") {
            updateFee("FIRESPRINK", "FP_SPRINKLER", "FINAL", quantity, "N");
            logDebug("Fee FIRESPRINK assessed");
        }
        logDebug("End function FP_Fire_Sprinkler_Assess_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function FP_Fire_Sprinkler_Assess_Fee(). Please contact administrator. Err: " + err);
    }
}

function ASA_Update_Application_Expiration() {
    try {
        logDebug("begin function ASA_Update_Application_Expiration");
        editAppSpecific("Application Expiration Date", dateAdd(null, 180));
        logDebug("End function ASA_Update_Application_Expiration");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function ASA_Update_Application_Expiration(). Please contact administrator. Err: " + err);
    }
}

function FP_Fire_Alarm_Assess_Fee() {
    try {
        logDebug("begin function FP_Fire_Alarm_Assess_Fee");

        loadAppSpecific(AInfo, capId);
        var quantity = AInfo["Building Square Footage"];
        if (wfTask == "Plan Check" && wfStatus == "Approved") {
            updateFee("FIREALARM", "FP_ALARM", "FINAL", quantity, "N");
            logDebug("Fee FIREALARM assessed");
        }
        logDebug("End function FP_Fire_Alarm_Assess_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function FP_Fire_Alarm_Assess_Fee(). Please contact administrator. Err: " + err);
    }
}

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

function WTUB_BD_Issue_Validation() {
    try {
        logDebug("begin function WTUB_BD_Issue_Validation");
        var cap = aa.cap.getCap(capId).getOutput();
        var condResult = aa.capCondition.getCapConditions(capId);
        var totalAppliedConds = 0;
        var totalConds = 0;
        var allCondsMet = false;
        if (wfTask == "Permit Issuance" && wfStatus == "Issued") {
            if (condResult.getSuccess()) {
                var capConds = condResult.getOutput();

                totalConds = capConds.length;
                totalAppliedConds = getConditions(null, "Applied", null, null).length;
            }

            //if there are no conditions or all conditions have been met
            if (totalConds == 0 || (totalConds > 0 && totalAppliedConds == 0)) {
                allCondsMet = true;
            }

            if (balanceDue > 0 || allCondsMet == false) {
                cancel = true;
                showMessage = true;
                comment("Cannot issue permit until all balance is paid and all conditions are met");
            }
        }
        logDebug("End function WTUB_BD_Issue_Validation");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function WTUB_BD_Issue_Validation(). Please contact administrator. Err: " + err);
    }
}

function autoInvoiceVoidedFees() {
    var feeSeqListString = aa.env.getValue("FeeItemsSeqNbrArray");  // invoicing fee item list in string type
    var feeSeqList = [];                    // fee item list in number type
    var xx;
    for (xx in feeSeqListString) {
        feeSeqList.push(Number(feeSeqListString[xx]));  // convert the string type array to number type array
    }

    var paymentPeriodList = []; // payment periods, system need not this parameter for daily side

    // The fee item should not belong to a POS before set the fee item status to "CREDITED".
    if (feeSeqList.length && !(capStatus == '#POS' && capType == '_PER_GROUP/_PER_TYPE/_PER_SUB_TYPE/_PER_CATEGORY')) {
        // the following method will set the fee item status from 'VOIDED' to 'CREDITED' after void the fee item;
        invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
        if (invoiceResult.getSuccess()) {
            logMessage("Invoicing assessed fee items is successful.");
        }
        else {
            logDebug("ERROR: Invoicing the fee items assessed to app # " + capId + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
}

function WTUA_Update_Application_Expiration(){
  try{
    logDebug("begin function WTUA_Update_Application_Expiration");
    if(matches(wfTask,"Application Submittal","Application Acceptance","Review Consolidation", "Building", "Zoning") && matches(wfStatus,"Approved","Resubmittal Required","Completed", "Accepted","Accepted-OTC")){
      editAppSpecific("Application Expiration Date", dateAdd(null,180));
      logDebug("Application Expiration Date updated");
    }
    logDebug("End function WTUA_Update_Application_Expiration");
  }
  catch(err){
    showMessage = true;
        comment("Error on custom function WTUA_Update_Application_Expiration(). Please contact administrator. Err: " + err);
  }

}


function capIdsGetByAddr4ServiceRequest4ASB(streetName, HouseNumberStart, StreetSuffix, Zip, StreetDirection) {
    //Gets CAPs with the same address as the current CAP, as capId (CapIDModel) object array (array includes current capId)
    //07SSP-00034/SP5015
    //

    //Get address(es) on current CAP
    /*var addrResult = aa.address.getAddressByCapId(capId);
    if (!addrResult.getSuccess()) {
        aa.print("**ERROR: getting CAP addresses: " + addrResult.getErrorMessage());
        return false;
    }

    var addrArray = new Array();
    var addrArray = addrResult.getOutput();
    if (addrArray.length == 0 || addrArray == undefined) {
        aa.print("The current CAP has no address.  Unable to get CAPs with the same address.")
        return false;
    }
    */
    //use 1st address for comparison
    var streetName = streetName;
    var hseNum = HouseNumberStart;
    var streetSuffix = StreetSuffix;
    var zip = Zip;
    var streetDir = StreetDirection;

    if (streetDir == "")
        streetDir = null;
    if (streetSuffix == "")
        streetSuffix = null;
    if (zip == "")
        zip = null;

    if (hseNum && !isNaN(hseNum)) {
        hseNum = parseInt(hseNum);
    } else {
        hseNum = null;
    }

    var capArray = new Array();
    // get caps with same address
    if (streetName != null || hseNum != null || streetSuffix != null || zip != null || streetDir != null) {
        var capAddResult = aa.cap.getCapListByDetailAddress(streetName, hseNum, streetSuffix, zip, streetDir, null);
        if (capAddResult.getSuccess())
            capArray = capAddResult.getOutput();
        else {
            aa.print("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());
            return false;
        }
    }

    var capIdArray = new Array();
    //convert CapIDScriptModel objects to CapIDModel objects
    for (i in capArray)
        capIdArray.push(capArray[i].getCapID());

    if (capIdArray)
        return (capIdArray);
    else
        return false;
}

function BTR_Garage_Sale_2_Per_Year() {
    logDebug("Begin BTR_Garage_Sale_2_Per_Year");
    try {
        var count = cntAssocGarageSales(AddressHouseNumber, AddressStreetName, AddressCity, AddressState, "", ApplicantFirstName, ApplicantLastName);
        logDebug("count: " + count);
        if (count > 2) {
            cancel = true;
            showMessage = true;
            comment("You have reached the max number of Garage Sale Permits, you are only allowed 2 per year");
        }
        logDebug("End BTR_Garage_Sale_2_Per_Year");
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASB custom function BTR_Garage_Sale_2_Per_Year(). Please contact administrator. Err: " + err);
    }
}

function BTR_Fire_Fee_Total() {
    try {
        var asiTableNam = "BTR FIRE";
        var TotalFireFees = "Total Fire Fees";
        var btrFireTable = loadASITable(asiTableNam);
        var finalFeeAmt = 0;
        if (btrFireTable) {
            var tableLength = btrFireTable.length;
            if (tableLength > 0) {
                for (eachRow in btrFireTable) {
                    var trade = parseFloat(btrFireTable[eachRow]["Fire Fee"]);
                    finalFeeAmt = parseFloat(finalFeeAmt + trade);
                }
            }
        }
        if (finalFeeAmt > 0) {
            editAppSpecific(TotalFireFees, finalFeeAmt, capId);
            aa.print("Total Fire Fees updated to : " + finalFeeAmt);
        }
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA custom function BTR_Fire_Fee_Total(). Please contact administrator. Err: " + err);
    }
}

function BTR_Total_Fee() {
    try {
        logDebug("begin BTR_Total_Fee");
        var asiTableNam = "BTR";
        var BTRTotalFireFees = "BTR Total License Fee";
        var btrTable = loadASITable(asiTableNam);
        var finalFeeAmt = 0;
        if (btrTable) {
            var tableLength = btrTable.length;
            if (tableLength > 0) {
                for (eachRow in btrTable) {
                    var baseFee = parseFloat(btrTable[eachRow]["Assessed Fee"]);
                    finalFeeAmt = parseFloat(finalFeeAmt + baseFee);
                }
            }
        }
        if (finalFeeAmt > 0) {
            editAppSpecific(BTRTotalFireFees, finalFeeAmt);
            aa.print("Total Fire Fees updated to : " + finalFeeAmt);
        }
        logDebug("End BTR_Total_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA custom function BTR_Total_Fee(). Please contact administrator. Err: " + err);
    }
}

// Evaluate Enforcement table.  Generate report if any row has status of In Violation and Initial Issued not checked
function Code_Generate_Reports() {
    try {
        loadASITables();
        var violationTable = VIOLATIONS;
        logDebug("begin Code_Generate_Reports");
        if (matches(wfTask, "Initial Inspection", "Follow Up") && wfStatus == "Print NOV") {
            if (violationTable && violationTable.length > 0) {
                var inVio = "N";
                for (x in violationTable) {
                    if (violationTable[x]["Status"] == "In Violation" && violationTable[x]["Initial Issued"] != "CHECKED")
                        inVio = "Y";
                    if (matches(violationTable[x]["Status"], "Resolved", "Rescinded") && violationTable[x]["Resolution Issued"] != "CHECKED")
                        inVio = "Y";
                }
                if (inVio == "Y") {
                    runReportAttach(capId, "Certificate of Occupancy", "altID", capId.getCustomID(), "AgencyID", "DELAND");
                    removeASITable("VIOLATIONS");
                    for (x in violationTable) {
                        if (violationTable[x]["Status"] == "In Violation" && violationTable[x]["Initial Issued"] != "CHECKED")
                            violationTable[x]["Initial Issued"] = "CHECKED";
                        if (matches(violationTable[x]["Status"], "Resolved", "Rescinded") && violationTable[x]["Resolution Issued"] != "CHECKED")
                            violationTable[x]["Resolution Issued"] = "CHECKED";
                    }
                    addASITable("VIOLATIONS", VIOLATIONS);
                }
            }
        }
        logDebug("End Code_Generate_Reports");
    }
    catch (err) {
        showMessage = true;
        comment("Error on WTUA:Enforcement/*/*/* custom function Code_Generate_Reports. Please contact administrator. Err: " + err);
    }
}

function BTR_Fire_Inspection_Scheduled() {
    try {
        logDebug("begin BTR_Fire_Inspection_Scheduled");
        if (wfTask == "Fire Review" && wfStatus == "Inspection Required") {
            scheduleInspection("BTR Fire Inspection", 1);
            logDebug("Fire Inspection Scheduled");
            var feeSchedule = "BTR_MAIN";
            var feeItem = "FIREOCCLIC";
            updateFee(feeItem, feeSchedule, 'FINAL', 1, "N");
        }
        logDebug("end BTR_Fire_Inspection_Scheduled");
    }
    catch (err) {
        showMessage = true;
        comment("Error on custom function BTR_Fire_Inspection_Scheduled(). Please contact administrator. Err: " + err);
    }
}

function BTR_Assess_BTR_Fee(){
    try{
        logDebug("begin BTR_Assess_BTR_Fee");
        var feeSchedule = "BTR_MAIN";
        var BTR = "BTRYEAR";
        var Fire = "BTRFIREPERM";
        loadAppSpecific(AInfo, capId);
        var BTRTotalLicFee = AInfo['BTR Total License Fee'];
        var TotalFireFee = AInfo['Total Fire Fees'];
        if(wfTask == "Building Review" && matches(wfStatus, 'Approved', 'Completed Change of Use Required', 'Completed No Issue')) {
            if (BTRTotalLicFee && BTRTotalLicFee > 0 && AInfo["Business Type of Organization"] != '501c3 Not for Profit'){
                updateFee(BTR, feeSchedule, 'FINAL', parseFloat(BTRTotalLicFee), "N");
            }

            if (TotalFireFee && TotalFireFee > 0){
                updateFee(Fire, feeSchedule, 'FINAL', TotalFireFee, "N");
            }

            logDebug("BTR and Fire Fees");
        }
        logDebug("end BTR_Assess_BTR_Fee");
    }
    catch(err){
        showMessage = true;
        comment("Error on custom function BTR_Assess_BTR_Fee(). Please contact administrator. Err: " + err);
    }
}

function BTR_Issue_License_SetExpDate(itemCap) {
    try {
        logDebug("BTR_Issue_License_SetExpDate() Started");
        if (appMatch("Licenses/Business/Tax Receipt/Application") || appMatch("Licenses/Business/Tax Receipt/Application")) {
            var currDate = new Date();
            var expDate = new Date();
            var year = currDate.getFullYear();
            var month = currDate.getMonth();
            var day = currDate.getDate();
            var expYear = year;
            var parentLicenseCAPID;
            loadAppSpecific(AInfo, capId);
            var prePay = AInfo['Pre-Pay Renewal Fee'];
            var halfYear = AInfo['Half Year License'];
            expDate.setMonth(8); //set expiration month to September
            expDate.setDate(30); //set expiration date to 30


            // if Jan - Jun
            if (month < 6)
            {
                logDebug("Month is between Jan-Jun");
                if ( ! matches(prePay,"Y","Yes","Checked","YES","CHECKED") )
                {
                    logDebug("PrePay is not set.");
                    // Sept 30 current year
                    expYear = expDate.getFullYear();
                    logDebug("Setting expiration year to this year.");
                }
                else
                {
                    logDebug("PrePay is set.");
                    // Sept 30 NEXT YEAR
                    expYear = expDate.getFullYear() + 1;
                    logDebug("Setting expiration year to next year.");
                }
            }
            else
            {
                logDebug("Month is between Jul-Dec");
                if ( ! matches(prePay,"Y","Yes","Checked","YES","CHECKED") )
                {
                    logDebug("PrePay is not set.");
                    // Sept 30 NEXT YEAR
                    expYear = expDate.getFullYear() + 1;
                    logDebug("Setting expiration year to next year.");
                }
                else
                {
                    logDebug("PrePay is set.");
                    // Sept 30 YEAR AFTER NEXT YEAR
                    expYear = expDate.getFullYear() + 2;
                    logDebug("Setting expiration year to the year after next.");
                }

            }

            expDate.setFullYear(expYear);

            var currDateString = currDate.getMonth() + 1 + "/" + currDate.getDate() + "/" + currDate.getFullYear();
            var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
            logDebug("Issuance Date: " + currDateString);
            logDebug("New Expiration Date: " + expDateString);

            editAppSpecific("Expiration Date",jsDateToMMDDYYYY(expDate));

            parentLicenseCAPID = getParentLicenseRecord(itemCap);
            if (!parentLicenseCAPID) {
                parentLicenseCAPID = getParent(itemCap);
            }

            if (parentLicenseCAPID) {
                parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
                var licCustID = parentLicenseCAPID.getCustomID();
                logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
                editAppSpecific("Expiration Date",jsDateToMMDDYYYY(expDate),parentLicenseCAPID);
                thisLic = new licenseObject(licCustID, parentLicenseCAPID);
                thisLic.setExpiration(expDateString);
                thisLic.setStatus("Active");
            }
            else
                logDebug("WARNING: Unable to get the parent license and set the expiration date")
        }
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Issue_License_SetExpDate(), please contact administrator. Error: " + err);
    }
}//END BTR_Issue_License_SetExpDate


function getParentLicenseRecord(childAppID)
{
    //Get the Cap Type
    var capScriptModel = aa.cap.getCap(childAppID).getOutput();
    var capTypeModel = capScriptModel.getCapType();
    var recordType = capTypeModel.getCategory();

    //If cap is a renewal then retrieve the parent using aa.cap.getProjectByChildCapID()
    if(recordType == "Renewal")
    {
        var parentListResult = aa.cap.getProjectByChildCapID(childAppID,"Renewal",null);
        if(parentListResult.getSuccess())
        {
            var parentList = parentListResult.getOutput();
            if(parentList.length){
                parentPrj= parentList[0].getProjectID();
                    parentCapId = aa.cap.getCapID(parentPrj.getID1(),parentPrj.getID2(),parentPrj.getID3()).getOutput();
                    return parentCapId;
            }
        }
        logDebug("Error Retrieving the Parent License Record for Child Record: "+childAppID+" "+parentListResult.getErrorMessage());
    }
    //Use aa.cap.getProjectParents() to retrieve the parent for non renewal records
    else
    {
        var i = 1;
        var parentListResult = aa.cap.getProjectParents(childAppID,i);
        if(parentListResult.getSuccess())
        {
            var parentList = parentListResult.getOutput();
            if (parentList.length)
                return parentList[0].getCapID();
        }
        else
        {
            logDebug("**WARNING: GetParent found no project parent for this application: "+childAppID+" "+parentListResult.getErrorMessage());
        }
    }
}

function BD_Submittal_Fee() {
    try {
        loadAppSpecific(AInfo, capId);
        var use = AInfo['Use'];
        if (feeExists('RESASUB')) updateFee('RESASUB', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('COMMASUB') && !appMatch("Building/Sign/NA/NA")) updateFee('COMMASUB', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (use) {
            if (use == "Commercial" || appMatch("Building/Sign/NA/NA")) {
                updateFee('COMMASUB', 'BD_PERMITS', 'FINAL', 1, "Y");
            }
            else {
                updateFee('RESASUB', 'BD_PERMITS', 'FINAL', 1, "Y");
            }
        }
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Submittal_Fee(), please contact administrator. Error: " + err);
    }
}

function BTR_Renew_LateFees() {
    try {
        logDebug("Begin BTR_Renew_LateFees");
        loadAppSpecific(AInfo, capId);
        var lateFeeAccrued = AInfo["Late Fees Accrued"];
        var expiredwithPenalty = AInfo["Expired with Penalty"];
        var feeSchedule = "BTR_MAIN";
        var feeItem = "BTRLATE";
        if (wfTask == "Licensing Review" && wfStatus == "Approved for Renewal") {
            if (expiredwithPenalty == "CHECKED") {
                updateFee(feeItem, feeSchedule, 'FINAL', lateFeeAccrued, "N");
                logDebug("BTR Late Fee BTRLATE Assessed");
            }
        }
        logDebug("End BTR_Renew_LateFees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Renew_LateFees(), please contact administrator. Error: " + err);
    }
}

function BD_Assess_Permit_Fees() {
    try {
        logDebug("Begin BD_Assess_Permit_Fees");
        loadAppSpecific(AInfo, capId);
        var use = AInfo['Use'];
        var feeSchedule = "BD_PERMITS";
        var feeItemCom = "BPFC";
        var feeItemRes = "BPFR";
        if (feeExists('BPFC')) updateFee('BPFC', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BPFR')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BLPERCER')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (feeExists('BLDSURCH')) updateFee('BPFR', 'BD_PERMITS', 'FINAL', 0, "Y");
        if (wfTask == "Review Consolidation" && wfStatus == "Completed") {
            if (use == "Commercial" || appMatch("Building/Sign/NA/NA")) {
                if (appMatch("Building/Solar/*/*"))
                {
                    updateFee("COMMPHOT", "BD_SOLAR", "FINAL", 1, "N");
                    logDebug("Solar Fee COMMPHOT Assessed");
                }
                else if (appMatch("Building/Reroof/NA/NA"))
                {
                    updateFee("COMMROOF", "BD_REROOF", "FINAL", 1, "N");
                    logDebug("Roofing Fee COMMROOF Assessed");
                }
                else if (appMatch("Building/Building/Accessory Structure/NA"))
                {
                    if (matches(AInfo["Structure Type"],"Pool/Spa"))
                    {
                        updateFee("COMMPOOL", "BD_PERMITS", "FINAL", 1, "N");
                        logDebug("Pool Fee COMMPOOL Assessed");
                    }
                    else{
                        if(!matches(AInfo["Structure Type"],"Fence")){
                            logDebug("Assessing fee for commercial permit");
                            aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                            updateFee(feeItemCom, feeSchedule, 'FINAL', 1, "N");
                        }
                    }
                }
                else if (appMatch("Building/Mechanical/NA/NA"))
                {
                //    updateFee("COMMMECH", "BD_PERMITS", "FINAL", parseInt(AInfo["Tons"]), "N");
                //    logDebug("Comm Mechanical Fee COMMMECH Assessed for " + AInfo["Tons"] + " tons.");
                }
                else if (appMatch("Building/Plumbing/NA/NA") && parseInt(AInfo["Gas Outlets"]))
                {
                    updateFee("GASFEE", "BD_PLUMBING", "FINAL", parseInt(AInfo["Gas Outlets"]), "N");
                    logDebug("Gas Fee GASFEE Assessed for " + AInfo["Gas Outlets"] + " gas outlets.");
                }
                else
                {
                    // Ensure an Electrical Permit Fee is not assessed before adding one for Building, and don't add one for fencing
                    if ( ! (feeExists('COMMELEC') || feeExists('COMELECT') || feeExists('COMELEC')) && !(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")) )
                    {
                        aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                        updateFee(feeItemCom, feeSchedule, 'FINAL', 1, "N");
                        logDebug("BD Fee BPFC Assessed");
                    }
                    else
                        logDebug("Skipping assessing the Building Permit Fee.");
                }
            }
            else if (use == "Residential") {
                if (appMatch("Building/Solar/*/*"))
                {
                    updateFee("RESPHOTO", "BD_SOLAR", "FINAL", 1, "N");
                    logDebug("Solar Fee RESPHOT Assessed");
                }
                else if (appMatch("Building/Reroof/NA/NA"))
                {
                    updateFee("RESROOF", "BD_REROOF", "FINAL", 1, "N");
                    logDebug("Roofing Fee RESROOF Assessed");
                }
                else if (appMatch("Building/Building/Accessory Structure/NA"))
                {
                    if (matches(AInfo["Structure Type"],"Pool/Spa"))
                    {
                        updateFee("REUNDGRD", "BD_PERMITS", "FINAL", 1, "N");
                        logDebug("Res Underground Pool Fee REUNDGRD Assessed");
                    }
                    else{
                        if(!matches(AInfo["Structure Type"],"Fence")){
                            logDebug("Adding Residential Permit fee")
                            aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                            updateFee(feeItemRes, feeSchedule, 'FINAL', 1, "N");
                        }
                    }
                }
                else if (appMatch("Building/Mechanical/NA/NA"))
                {
                    //updateFee("RESMECH", "BD_PERMITS", "FINAL", parseInt(AInfo["Tons"]), "N");
                    //logDebug("Res Mechanical Fee RESMECH Assessed for " + AInfo["Tons"] + " tons.");
                }
                else if (appMatch("Building/Plumbing/NA/NA") && parseInt(AInfo["Gas Outlets"]))
                {
                    updateFee("GASFEE", "BD_PLUMBING", "FINAL", parseInt(AInfo["Gas Outlets"]), "N");
                    logDebug("Gas Fee GASFEE Assessed for " + AInfo["Gas Outlets"] + " gas outlets.");
                }
                else
                {
                    // Ensure an Electrical Permit Fee is not assessed before adding one for Building
                    if ( ! (feeExists('RESELEC') || feeExists('RESELECL') || feeExists('RESELECH')) && !(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")) )
                    {
                        aa.finance.switchCalcFactor(capId,"CALC","ADMIN");
                        updateFee(feeItemRes, feeSchedule, 'FINAL', 1, "N");
                        logDebug("BD Fee BPFR Assessed");
                    }
                    else
                        logDebug("Skipping assessing the Building Permit Fee.");
                }
            }

            if (!(appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence")))
            {
                updateFee('BLPERCER', feeSchedule, 'FINAL', 1, "N");
                updateFee('BLDSURCH', feeSchedule, 'FINAL', 1, "N");
            }

            if (appMatch("Building/Sign/NA/NA") || (appMatch("Building/Building/Accessory Structure/NA") && !matches(AInfo["Structure Type"],"Fence","Retaining Wall","Shed","Slab / Driveway")) )
            {
                updateFee("ZREVBLDG", "BD_PERMITS", "FINAL", 1, "N");
                logDebug("Zoning Fee ZREVBLDG Assessed");
            }
            if (appMatch("Building/Building/Accessory Structure/NA") && matches(AInfo["Structure Type"],"Fence","Retaining Wall","Shed","Slab / Driveway"))
            {
                updateFee("ZREVFNCE", "BD_PERMITS", "FINAL", 1, "N");
                logDebug("Zoning Fee ZREVFNCE Assessed");
            }

        }
        logDebug("End BD_Assess_Permit_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Assess_Permit_Fees(), please contact administrator. Error: " + err);
    }
}

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

function BTR_Set_Renew_License(itemCap) {
    try {
        logDebug("Begin BTR_Set_Renew_License");
        var currDate = new Date();
        var expDate = new Date();
        var year = currDate.getFullYear();
        var month = currDate.getMonth();
        var day = currDate.getDate();
        var expYear = year;
        var parentLicenseCAPID;

        expDate.setMonth(8); //set expiration month to September
        expDate.setDate(30); //set expiration date to 30
        expYear = expDate.getFullYear() + 1;  //set expiration year to next year


        expDate.setFullYear(expYear);

        var currDateString = currDate.getMonth() + 1 + "/" + currDate.getDate() + "/" + currDate.getFullYear();
        var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
        logDebug("Issuance Date: " + currDateString);
        logDebug("New Expiration Date: " + expDateString);

        parentLicenseCAPID = getParentLicenseCapID(itemCap);
        if (!parentLicenseCAPID) {
            parentLicenseCAPID = getParent(itemCap);
        }
        if (parentLicenseCAPID) {
            parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
            var parentCap = aa.cap.getCap(parentLicenseCAPID).getOutput();
            var licCustID = parentLicenseCAPID.getCustomID();
            logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
            thisLic = new licenseObject(licCustID, parentLicenseCAPID);
            thisLic.setExpiration(expDateString);
            thisLic.setStatus("Active");
            updateAppStatus("Active", "License Renewed", parentLicenseCAPID);
            editAppName(parentCap.getSpecialText(), capId);
            
            renewalCapProject = getRenewalCapByParentCapID(parentLicenseCAPID);
            if (renewalCapProject != null) {
                renewalCapProject.setStatus("Complete");
                logDebug("license(" + parentLicenseCAPID + ") is activated.");
                aa.cap.updateProject(renewalCapProject);
            }
            else{
                logDebug("Unable to find renewal project for license " + parentLicenseCAPID.getCustomID());
            }
        }
        else {
            logDebug("WARNING: Unable to get the parent license and set the expiration date");
        }
        logDebug("End BTR_Set_Renew_License");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Set_Renew_License(), please contact administrator. Error: " + err);
    }
}

function BD_Electrical_Clearance() {
    try {
        logDebug("Begin BD_Electrical_Clearance");
        loadAppSpecific(AInfo, capId);
        var vReportFile = [];
        var templateName = "BD_ELEC CLEARANCE";
        //get address
        var addrResult = getPrimaryAddressLine();
        //
        //var emailTo = "floridamunicipalities@duke-energy.com";
        var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
        var altId = capId.getCustomID();
        var emailTo = "Cirellia@deland.org";
        var emailFrom = "no-reply@deland.gov";
        var iDate = inspResultDate;
        var emailParameters = aa.util.newHashtable();
        emailParameters.put("$$INSPDATE$$", iDate);
        emailParameters.put("$$CAPADDR$$", addrResult);
        emailParameters.put("$$CAPID$$", altId);
        var clearance = AInfo['Electric Clearance Needed'];

        if (matches(inspType, "Electrical Final", "Early Power (Pre-power)") && matches(inspResult, "Approved")) {
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    aa.print("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    aa.print("  *** Notification Failed to Send");
                }
            }
        }
        editAppSpecific("Electric Clearance Date", dateAdd(null, 0));
        logDebug("End BD_Electrical_Clearance");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Electrical_Clearance(), please contact administrator. Error: " + err);
    }
}

function getPrimaryAddressLine() { //optional capId parameter
    var itemCap = capId
    if (arguments.length > 1)
        itemCap = arguments[1]; // use cap ID specified in args

    var addResult = aa.address.getAddressByCapId(itemCap);

    if (addResult.getSuccess()) {
        var addArray = addResult.getOutput();
        for (var jj in addArray) {
            var thisAddress = addArray[jj];
            if (thisAddress.getPrimaryFlag() == "Y") {
                return thisAddress.getDisplayAddress();
            }
        }
    } else {
        logDebug("Could not return address: " + addResult.getErrorMessage());
        return false;
    }

    logDebug("Could not find primary address");
    return false;
}

function BTR_Declarations_Reviewed(itemCap) {
    try {
        logDebug("Begin BTR_Declarations_Reviewed");
        var parentLicenseCAPID;
        if (wfTask == "Declarations Review" && wfStatus == "Completed") {
            parentLicenseCAPID = getParent(itemCap);
            if (parentLicenseCAPID) {
                parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
                var licCustID = parentLicenseCAPID.getCustomID();
                logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
                //copyASIFields(itemCap, parentLicenseCAPID);
                copyAppSpecific(parentLicenseCAPID);
                copyASITables(itemCap, parentLicenseCAPID);
                copyAddresses(itemCap, parentLicenseCAPID);
                copyContacts(itemCap, parentLicenseCAPID);
                copyOwner(itemCap, parentLicenseCAPID);
                updateAppStatus("Active", "", parentLicenseCAPID);
            }
            else {
                logDebug("WARNING: Unable to get the parent license");
            }
        }
        logDebug("End BTR_Declarations_Reviewed");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Declarations_Reviewed(), please contact administrator. Error: " + err);
    }
}

function Code_Lien_Compliance() {
    try {
        logDebug("Begin Code_Lien_Compliance");
        var LienCompDate = "Lien Compliance Date";
        if (wfTask == "Lien" && wfStatus == "Lien Compliance") {
            editAppSpecific("Lien Compliance Date", dateAdd(null, 0));
        }
        logDebug("End Code_Lien_Compliance");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function Code_Lien_Compliance(), please contact administrator. Error: " + err);
    }
}

function PL_Land_Use_Record_Number_Prefix() {
    try {
        logDebug("Begin PL_Land_Use_Record_Number_Prefix");
        loadAppSpecific(AInfo, capId);
        var existingUse = AInfo["Application Type"];
        var prefix = "";
        var sequence = "";
        var newAltID = "";
        var currDate = new Date();
        var year = (currDate.getFullYear().toString().substr(-2));

        if (existingUse == "Comprehensive Plan Amendments") {
            prefix = "CPA";
        } else if (existingUse == "Large Scale Land Use") {
            prefix = "LU";
        } else if (existingUse == "Small Scale Land Use") {
            prefix = "SMLU";
        }
        oldAltID = capId.getCustomID();
        oldAltIDSplit = oldAltID.split("-");
        if (oldAltIDSplit) {
            sequence = oldAltIDSplit[1];
        }

        newAltID = "" + prefix + year + "-" + sequence;
        var updateCapAltIDResult = aa.cap.updateCapAltID(capId, newAltID);

        if (updateCapAltIDResult.getSuccess())
            logDebug(capId + " AltID changed from " + oldAltID + " to " + newAltID);
        else
            logDebug("**WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
        logDebug("End PL_Land_Use_Record_Number_Prefix");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Land_Use_Record_Number_Prefix(), please contact administrator. Error: " + err);
    }
}

function getPeople(capId) {
    capPeopleArr = null;
    var s_result = aa.people.getCapContactByCapID(capId);
    if (s_result.getSuccess()) {
        capPeopleArr = s_result.getOutput();
        if (capPeopleArr != null || capPeopleArr.length > 0) {
            for (loopk in capPeopleArr) {
                var capContactScriptModel = capPeopleArr[loopk];
                var capContactModel = capContactScriptModel.getCapContactModel();
                var peopleModel = capContactScriptModel.getPeople();
                var contactAddressrs = aa.address.getContactAddressListByCapContact(capContactModel);
                if (contactAddressrs.getSuccess()) {
                    var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
                    peopleModel.setContactAddressList(contactAddressModelArr);
                }
            }
        }
        else {
            aa.print("WARNING: no People on this CAP:" + capId);
            capPeopleArr = null;
        }
    }
    else {
        aa.print("ERROR: Failed to People: " + s_result.getErrorMessage());
        capPeopleArr = null;
    }
    return capPeopleArr;
}

//When workflows status "Fees Assessed" identified in Workflow task "Application Submittal" Task Invoice all fees,
//send email  to applicant with invoice attached advising fees must be paid before review can continue/start
//
function PL_Fees_Assessed_after_Intake() {
    logDebug("Begin PL_Fees_Assessed_after_Intake");
    try {
        var emailFrom;
        var emailTo;
        var templateName = "PL_APPICATIONACCEPTED_FEESDUE";

        var reportFile = [];
        var vFees = loadFees(capId);
        var feesAdded = false;
        var invoiceResult_L; //wfStatus = "Fees Assessed"
        if (wfStatus == "Fees Assessed") {
            for (i in vFees) {
                thisFee = vFees[i];
                logDebug("We have a fee " + thisFee.code + " with status of: " + thisFee.status);
                //only process fees that are not already invoiced
                if (thisFee.status == "NEW") {
                    //invoiceFee2(thisFee.code, thisFee.period);
                    invoiceResult_L = aa.finance.createInvoice(capId, thisFee.sequence, thisFee.period);
                    if (invoiceResult_L.getSuccess()) {
                        logDebug("Invoicing assessed fee items to specified CAP is successful.");
                        feesAdded = true;
                    }
                    else
                        logDebug("**ERROR: Invoicing the fee items assessed to specified CAP was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
                }
            }
            var thebalance = getBalance("", "", null, capId);
            if (thebalance) { thebalance = "$" + thebalance; }
            var emailParameters = aa.util.newHashtable();
            var contact = getContactByTypeAA("Applicant", capId); //balanceDue = 400;
            var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
            var altId = capId.getCustomID();
            var cap = aa.cap.getCap(capId).getOutput();
            var capAlias = cap.getCapType().getAlias();
            emailFrom = "no-reply@deland.gov";
            emailTo = contact.email;
            emailParameters.put("$$CAPID$$", altId);
            emailParameters.put("$$CAPNAME$$", capAlias);
            emailParameters.put("$$BALANCE$$", thebalance);
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    logDebug("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    logDebug("  *** Notification Failed to Send");
                }
            }
        }
        logDebug("End PL_Fees_Assessed_after_Intake");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Fees_Assessed_after_Intake(), please contact administrator. Error: " + err);
    }
}

function getBalance(feestr, feeSch, invoicedOnly, capId) {
    var amtFee = 0,
       amtPaid = 0,
       ff;

    invoicedOnly = (invoicedOnly == undefined || invoicedOnly == null) ? false : invoicedOnly;

    var feeResult = aa.fee.getFeeItems(capId, feestr, null);
    if (feeResult.getSuccess()) {
        var feeObjArr = feeResult.getOutput();
    }
    else {
        logDebug("**ERROR: getting fee items: " + capContResult.getErrorMessage());
        return 999999;
    }

    for (ff in feeObjArr)
        if ((!feestr || feestr.equals(feeObjArr[ff].getFeeCod())) && (!feeSch || feeSch.equals(feeObjArr[ff].getF4FeeItemModel().getFeeSchudle()))) {
            if (!(matches(feeObjArr[ff].feeitemStatus, "VOIDED", "CREDITED"))) {  //if fee is voided or credited - exclude
                if (!invoicedOnly || feeObjArr[ff].feeitemStatus == "INVOICED") {
                    amtFee += feeObjArr[ff].getFee();
                    var pfResult = aa.finance.getPaymentFeeItems(capId, null);
                    if (pfResult.getSuccess()) {
                        var pfObj = pfResult.getOutput();
                        for (ij in pfObj) {
                            if (feeObjArr[ff].getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr()) {
                                amtPaid += pfObj[ij].getFeeAllocation()
                            }
                        }
                        logDebug("feestr=" + feestr + " - " + "status=" + feeObjArr[ff].feeitemStatus + " - " + "amtFee=" + amtFee + " - " + "amtPaid=" + amtPaid);
                    }
                }
                else {
                    logDebug("feestr=" + feestr + ' ---- NOT  Invoiced');
                }
            }
            else {
                logDebug("feestr=" + feestr + ' ---- Voided/Credited');
            }
        }
    return amtFee - amtPaid;
};

//get contact by contact type for given capId
function getContactByTypeAA(conType, capId) {
    var contactArray = getPeople(capId);
    for (thisContact in contactArray) {
        if ((contactArray[thisContact].getCapContactModel().getContactType()).toUpperCase() == conType.toUpperCase())
            return contactArray[thisContact].getCapContactModel();
    }
    return false;
}

function PL_Land_Use_Application_Fees() {
    try {
        aa.print("Begin PL_Land_Use_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Application Type"];
        var acres = 1;
        var acresValue = AInfo["Acres"];
        var vFeeSched = "PL_MAIN";

        if($iTrc(acresValue != "" && acresValue != undefined && acresValue != null, 'acres is not null'))
            acres = parseFloat(AInfo["Acres"]);

        if ($iTrc(applType == "Text Change", 'applType == "Text Change"')) {
            updateFee("CLUPCHANGE", vFeeSched, "FINAL", 1, "N");
        }
        if ($iTrc(applType == "Large Scale Land Use", 'applType == "Large Scale Land Use"')) {
            updateFee("LUAPP", vFeeSched, "FINAL", acres, "N");
        }
        if ($iTrc(applType == "Small Scale Land Use", 'applType == "Small Scale Land Use"')) {
            updateFee("SMLUAPP", vFeeSched, "FINAL", acres, "N");
        }
        aa.print("End PL_Land_Use_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Land_Use_Application_Fees(), please contact administrator. Error: " + err);
    }
}

function PL_SitePlan_Application_Fees() {
    try {
        logDebug("Begin PL_SitePlan_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Site Plan Class"];
        var acres = 1;
        var acresValue = AInfo["Acres"];
        var gfa = AInfo["Gross Floor Area"];
        var propUse = AInfo["Proposed Project Type"];
        var NumofUnit = 1;
        var NumofUnitValue = AInfo["Number of Units"];

        if($iTrc(acresValue != "" && acresValue != undefined && acresValue != null, 'acres is not null'))
            acres = parseFloat(AInfo["Acres"]);

        if($iTrc(NumofUnitValue != "" && NumofUnitValue != undefined && NumofUnitValue != null, 'NumofUnitValue is not null'))
            NumofUnit = parseFloat(NumofUnitValue);

        if ($iTrc(applType == "Concept Plan",'applType == "Concept Plan"')) {
            updateFee("CPAPP", "PL_MAIN", "FINAL", 1, "N");
        }
        if ($iTrc(applType == "Class II",'applType == "Class II"')) {
            updateFee("SPCLASS2", "PL_MAIN", "FINAL", 1, "N");
        }
        if ($iTrc(propUse != "Multi-Family", 'propUse != "Multi-Family"')) {
            if ($iTrc(applType == "Class III",'applType == "Class III"')) {
                updateFee("SPCLASS3", "PL_MAIN", "FINAL", gfa, "N");
            }
            if ($iTrc(applType == "Class IV",'applType == "Class IV"')) {
                updateFee("SPCLASS4", "PL_MAIN", "FINAL", gfa, "N");
            }
        }
        if ($iTrc(propUse == "Multi-Family", 'propUse == "Multi-Family"')) {
            if ($iTrc(applType == "Class III",'applType == "Class III"')) {
                updateFee("SPMULTI", "PL_MAIN", "FINAL", NumofUnit, "N");
            }
            if ($iTrc(applType == "Class IV",'applType == "Class IV"')) {
                updateFee("SPMULTI", "PL_MAIN", "FINAL", NumofUnit, "N");
            }
        }
        logDebug("End PL_SitePlan_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_SitePlan_Application_Fees(), please contact administrator. Error: " + err);
    }
}

function PL_Rezoning_Application_Fees() {
    try {
        logDebug("Begin PL_Rezoning_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var applType = AInfo["Zoning Change  Type"];
        var acres = AInfo["Acres"];
        //if ($iTrc(wfTask == "Application Submittal" && wfStatus == "Fees Assessed", 'WF:Application Submittal/Fees Assessed')) {
            if ($iTrc(applType == "Planned Development Concept", 'applType == "Planned Development Concept"')) {
                updateFee("PDC", "PL_MAIN", "FINAL", acres, "N");
            }
            if ($iTrc(applType == "Change of Zoning", 'applType == "Change of Zoning"')) {
                updateFee("REZONE", "PL_MAIN", "FINAL", acres, "N");
            }
            if ($iTrc(applType == "Text Amendment", 'applType == "Text Amendment"')) {
                updateFee("ZLDRTEXT", "PL_MAIN", "FINAL", 1, "N");
            }
        //}
        logDebug("End PL_Rezoning_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Rezoning_Application_Fees(), please contact administrator. Error: " + err);
    }
}

function PL_PreliminarySubdivision_Application_Fees() {
    try {
        logDebug("Begin PL_PreliminarySubdivision_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var propNumOfLots = AInfo["Proposed Number of Lots"];
        updateFee("PSBAPP", "PL_SUBDIVISION", "FINAL", propNumOfLots, "N");
        logDebug("End PL_PreliminarySubdivision_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_PreliminarySubdivision_Application_Fees(), please contact administrator. Error: " + err);
    }
}
function PL_FinalPlat_Application_Fees() {
    try {
        logDebug("Begin PL_FinalPlat_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var propNumOfLots = AInfo["Proposed Number of Lots"];
        updateFee("FSBAPP", "PL_SUBDIVISION", "FINAL", propNumOfLots, "N");
        logDebug("End PL_FinalPlat_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_FinalPlat_Application_Fees(), please contact administrator. Error: " + err);
    }
}

function PL_Combined_Subdivision_Application_Fees() {
    try {
        logDebug("Begin PL_Combined_Subdivision_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var propNumOfLots = AInfo["Proposed Number of Lots"];
        if (propNumOfLots > 0) {
            updateFee("CSBAPP", "PL_SUBDIVISION", "FINAL", propNumOfLots, "N");
        }
        logDebug("End PL_Combined_Subdivision_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Combined_Subdivision_Application_Fees(), please contact administrator. Error: " + err);
    }
}

function Update_Permits_Expiration_Permit_Issued_Date() {
    try {
        logDebug("Begin Update_Permits_Expiration_Permit_Issued_Date");
        if (wfTask == "Permit Issuance" && wfStatus == "Issued") {
            useAppSpecificGroupName = false;
            editAppSpecific("Permit Expiration Date", dateAdd(null, 180));
        }
        logDebug("End Update_Permits_Expiration_Permit_Issued_Date");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function Update_Permits_Expiration_Permit_Issued_Date(), please contact administrator. Error: " + err);
    }
}

function PL_Rezoning_Record_Number_Prefix() {
    try {
        aa.print("Begin PL_Rezoning_Record_Number_Prefix");
        loadAppSpecific(AInfo, capId);
        var zoningType = AInfo["Zoning Change  Type"];
        var prefix = "";
        var sequence = "";
        var newAltID = "";
        var currDate = new Date();
        var year = (currDate.getFullYear().toString().substr(-2));

        if (zoningType == "Planned Development Concept") {
            prefix = "PDC";
        } else if (zoningType == "Text Amendment") {
            prefix = "LDRA";
        }
        if (prefix != "") {
            oldAltID = capId.getCustomID();
            oldAltIDSplit = oldAltID.split("-");
            if (oldAltIDSplit) {
                sequence = oldAltIDSplit[1];
            }

            newAltID = "" + prefix + year + "-" + sequence;
            var updateCapAltIDResult = aa.cap.updateCapAltID(capId, newAltID);

            if (updateCapAltIDResult.getSuccess())
                aa.print(capId + " AltID changed from " + oldAltID + " to " + newAltID);
            else
                aa.print("**WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
        }

        aa.print("End PL_Rezoning_Record_Number_Prefix");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Rezoning_Record_Number_Prefix(), please contact administrator. Error: " + err);
    }
}

function BTR_Renewal_StateLicenseAttached() {
    try {
        logDebug("Begin BTR_Renewal_StateLicenseAttached");
        if (!publicUser) {
            if (!docCheck4ASB("State License")) {
                cancel = true;
                showMessage = true;
                comment("State License document must be attached in order to submit the Renewal application.");
            }
        }
        logDebug("End BTR_Renewal_StateLicenseAttached");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function BTR_Renewal_StateLicenseAttached(), please contact administrator. Error: " + err);
    }
}

// check for document in ASB event
function docCheck4ASB(docName) {
    try {
        var docAttached = false;

        if (!publicUser) // only works in AA, not ACA
        {
            var documentList = aa.env.getValue("DocumentModelList");
            if (!documentList) {
                return false;
            } else {
                for (var counter = 0; counter < documentList.size() ; counter++) {
                    var doc = documentList.get(counter);
                    if (doc.getDocCategory() == docName) {
                        docAttached = true;
                        break;
                    }
                }
            }
        } else {
            docAttached = true;
        }
        return docAttached;
    } catch (error) {
        cancel = true;
        showMessage = true;
        comment(error.message);
        comment("An error occurred while retrieving the document array");
    }
}

function BD_Mechanical_Permit_Fee() {
    try {
        logDebug("Begin BD_Mechanical_Permit_Fee");
        loadAppSpecific(AInfo, capId);
        var vUse = AInfo["Use"];
        var tons = AInfo["Tons"];
        var vFeeItemCom = "COMMMECH";
        var vFeeItemRes = "RESMECH";
        var vFeeSched = "BD_MECHANICAL";
        if (wfTask == "Mechanical" && wfStatus == "Approved") {
        
          if(!tons || tons == 0) tons = -1;
          if (tons)
          {
            if (vUse == "Commercial") {
                updateFee(vFeeItemCom, vFeeSched, "FINAL", tons, "N");
            } else if (vUse == "Residential") {
                updateFee(vFeeItemRes, vFeeSched, "FINAL", tons, "N");
            }
          }
          else
          {
            if (vUse == "Commercial") {
                updateFee("BPFC", "BD_PERMITS", "FINAL", 1, "N");
            } else if (vUse == "Residential") {
                updateFee("BPFR", "BD_PERMITS", "FINAL", 1, "N");
            }
          }
        }
        logDebug("End BD_Mechanical_Permit_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Mechanical_Permit_Fee(), please contact administrator. Error: " + err);
    }
}
function BD_Electrical_Permit_Fee() {
    try {
        logDebug("Begin BD_Electircal_Permit_Fee");
        loadAppSpecific(AInfo, capId);
        var vUse = AInfo["Use"];
        var vPhasing = AInfo["Phasing"];
        var existingServiceAmps = parseInt(AInfo["Existing Service Amps"]);
        var newServiceAmps = parseInt(AInfo["Amps"]);
        var changeInAmps = newServiceAmps - existingServiceAmps;
        var vFeeItemCom = "COMMELEC";
        var vFeeItemRes = "RESELEC";
        var vFeeSched = "BD_ELEC";
        if (wfTask == "Electrical" && wfStatus == "Approved") {
            if (vUse == "Commercial") {
                if (changeInAmps > 0)
                {
                    updateFee(vFeeItemCom, vFeeSched, "FINAL", 1, "N");
                }
            } else if (vUse == "Residential") {
                if (changeInAmps > 0)
                {
                    updateFee(vFeeItemRes, vFeeSched, "FINAL", 1, "N");
                }
            }
        }
        logDebug("End BD_Electrical_Permit_Fee");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Electrical_Permit_Fee(), please contact administrator. Error: " + err);
    }
}

function assessImpactFees() {
    try {
        logDebug("Begin assessImpactFees");
        loadAppSpecific(AInfo, capId);
        var calcImpactFees = AInfo["Calculate Impact Fees"];
        var waterFixtureCount = AInfo["Water Fixture Count"];
        var sewerFixtureCount = AInfo["Sewer Fixture Count"];
        var policeImpactCat = AInfo["Police Impact Category"];
        var fireImpactCat = AInfo["Fire Impact Category"];
        var retailImpactCat = AInfo["Retail Impact Category"];
        var instituionImpactCat = AInfo["Institution Impact Category"];
        var industrialImpactCat = AInfo["Industrial Impact Category"];
        var recreationalImpactCat = AInfo["Recreational Impact Category"];
        var transientAssistedHomeCat = AInfo["TAH Category"];
        var parkRecImpactFee = AInfo["Park and Rec Category"];
        //var residentialGovernment = AInfo["Use"];
        var officeImpact = AInfo["Office Impact Category"];
        var impactUnits = AInfo["Impact Units"];
        var officeSquareFeet = AInfo["Office Square Feet"];
        var retailSquareFeet = AInfo["Retail Square Feet"];
        var institutionSquareFeet = AInfo["Institution Square Feet"];
        var industrialSquareFeet = AInfo["Industrial Square Feet"];
        var recreationalQuantity = AInfo["Recreational Quantity"];
        var numberOfPumps = AInfo["Retail Quantity"];
        var numberOfStudents = AInfo["Students"];
        var numberOfBeds = AInfo["TAH Quantity"];

        if (wfTask == "Review Consolidation" && wfStatus == "Completed") {
            if (calcImpactFees == "Yes") {
                //assess water fixture fee
                if (waterFixtureCount && parseFloat(waterFixtureCount) > 0) {
                    updateFee("NEWWIF", "IMPACT", "FINAL", waterFixtureCount, "N");
                }
                //assess sewer fixture fee
                if (sewerFixtureCount && parseFloat(sewerFixtureCount) > 0) {
                    updateFee("NEWSIF", "IMPACT", "FINAL", sewerFixtureCount, "N");
                }
                //assess police impact cat fee
                if (policeImpactCat) {
                    var policeLookUpFee = lookup("BD_Impact_PoliceCategory", policeImpactCat);
                    if (policeLookUpFee) {
                        //updateFee(policeLookUpFee, "IMPACT", "FINAL", impactUnits, "N");
                        updateFee(policeLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess fire impact cat fee
                if (fireImpactCat) {
                    var fireLookUpFee = lookup("Fire_Impact_Category", fireImpactCat);
                    if (fireLookUpFee) {
                        //updateFee(fireLookUpFee, "IMPACT", "FINAL", impactUnits, "N");
                        updateFee(fireLookUpFee, "IMPACT", "FINAL", 1, "N");
                    }
                }
                if (parkRecImpactFee) {
                    if (parkRecImpactFee == "Multi-Family") {
                        updateFee("MFPKREC", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Mobile Home") {
                        updateFee("MHPKREC", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Single Family Attached") {
                        updateFee("PARKRECSFA", "IMPACT", "FINAL", 1, "N");
                    }
                    if (parkRecImpactFee == "Single Family Detached") {
                        updateFee("PARKRECSFD", "IMPACT", "FINAL", 1, "N");
                    }
                }
                //assess Residential Government Impact Fee
                if (AInfo["Use"] == "Residential") {
                    updateFee("GOVIMP", "IMPACT","FINAL", 1, "N");
                }
                //assess office impact
                if (officeImpact == "Office") {
                    updateFee("OFFICE", "IMPACT", "FINAL", officeSquareFeet / 1000, "N");
                }
                if (officeImpact == "Medical Office") {
                    updateFee("OFFICMED", "IMPACT", "FINAL", officeSquareFeet / 1000, "N");
                }
                //assess Retail impact cat fee
                if (retailImpactCat) {
                    var retailImpactCatFee = lookup("BD_Impact_RetailCategory", retailImpactCat);
                    var totalFee = parseFloat(retailSquareFeet / 1000);
                        if (retailImpactCatFee == "RTLGASIM") {
                            updateFee(retailImpactCatFee, "IMPACT", "FINAL", numberOfPumps, "N");
                        }

                        if (retailImpactCatFee == "RETLIMP") {
                            var totalFeeLimp = 0;
                            if (retailImpactCat == "Retail - up to 50,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 547.59);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }

                            if (retailImpactCat == "Retail - 50,000 - 200,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 520.64);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }

                            if (retailImpactCat == "Retail - over 200,000 sf") {
                                totalFeeLimp = parseFloat((retailSquareFeet / 1000) * 445.19);
                                updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFeeLimp, "N");
                            }
                        }
                     else {
                        updateFee(retailImpactCatFee, "IMPACT", "FINAL", totalFee, "N");
                    }
                }
                //assess institution impact cat  fee
                if (instituionImpactCat) {
                    var totalInstFee = parseFloat(institutionSquareFeet / 1000);
                    var institutionImpactCatFee = lookup("BD_Impact_Institutions", instituionImpactCat);
                    if (matches(institutionImpactCatFee, "INSCHR", "INSHOSP")) {
                        updateFee(institutionImpactCatFee, "IMPACT", "FINAL", totalInstFee, "N");
                    }
                    else {
                        updateFee(institutionImpactCatFee, "IMPACT", "FINAL", numberOfStudents, "N");
                    }
                }

                //assess Industrial Impact Cat Fee
                if (industrialImpactCat) {
                    var totalIndFee = parseFloat(industrialSquareFeet / 1000);
                    var industrialImpactCatFee = lookup("BD_Impact_IndustrialCategory", industrialImpactCat);
                    if (industrialImpactCatFee) {
                        updateFee(industrialImpactCatFee, "IMPACT", "FINAL", totalIndFee, "N");
                    }
                }

                //assess Recreatinal Impact Cat
                if (recreationalImpactCat) {
                    var totalIndFee = parseFloat(recreationalQuantity);
                    var recreationalImpactCatFee = lookup("BD_Impact_Recreational", recreationalImpactCat);
                    if (recreationalImpactCatFee) {
                        updateFee(recreationalImpactCatFee, "IMPACT", "FINAL", totalIndFee, "N");
                    }
                }

                //assess Transient Assiste Impact Fee transientAssistedHomeCat
                if (transientAssistedHomeCat) {
                    var totalTranFee = parseFloat(numberOfBeds);
                    var transientImpactCatFee = lookup("BD_Impact_TAHCategory", transientAssistedHomeCat);
                    if (transientImpactCatFee) {
                        updateFee(transientImpactCatFee, "IMPACT", "FINAL", totalTranFee, "N");
                    }
                }
            }
        }
        logDebug("End assessImpactFees");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function assessImpactFees(), please contact administrator. Error: " + err);
    }
}

function scheduleInspectionsFromTableWTUA() {
    try {
        logDebug("Begin scheduleInspectionsFromTableWTUA");
        if (wfTask == "Review Consolidation" && matches(wfStatus,"Review Complete","Completed")){
            loadASITables();
            var inspectionOrderTable = INSPECTIONORDER;
            var inspectionGroup = "BD_Building";
            if (inspectionOrderTable && inspectionOrderTable.length > 0) {
                for (eachRow in inspectionOrderTable) {
                    var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                    createPendingInspection(inspectionGroup, inspectionType);
                }
            }
        }
        logDebug("End scheduleInspectionsFromTableWTUA");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function scheduleInspectionsFromTableWTUA(), please contact administrator. Error: " + err);
    }
}
function scheduleInspectionsValidationISB() {
    try {
        logDebug("Begin scheduleInspectionsValidationISB");
        loadASITablesBefore();
        var inspectionOrderTable = INSPECTIONORDER;
        //var inspectionGroup = "BD_Building";
        var reqInsp = inspType.toUpperCase();
        var inspFound = false;
        if (inspectionOrderTable && inspectionOrderTable.length > 0) {
            for (eachRow in inspectionOrderTable) {
                var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                //logDebug ("My inspection type in the ASIT is " + inspectionType + " and my inspFound is " + inspFound);
                var currentStatus = inspectionOrderTable[eachRow]["Current Status"].toString().toUpperCase();
                if (reqInsp ==inspectionType){
                logDebug("Does " + reqInsp + " = " + inspectionType + " . with status of: " + currentStatus);
                inspFound = true;
                    if (currentStatus != "AVAILABLE") {
                        cancel = true;
                        showMessage = true;
                        comment("The Inspection " + inspType + " is not available at this time, please see the Inspection Order Custom List");
                    }
                    if (currentStatus == "AVAILABLE"){
                        logDebug("Inspection Found and Available");
                        break;
                    }
                    if(inspFound ==false){
                    logDebug("finished one round of loops and true" + inspFound);
                    continue;
                    }
                }
            }
            if(inspFound == false){
                logDebug("We didn't find a match in the table");
                cancel = true;
                showMessage = true;
                comment("The Inspection " + inspType + " is not valid for this permit please see the Inspection Order Custom List");
            }

        }
        logDebug("End scheduleInspectionsValidationISB");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsValidationISB(), please contact administrator. Error: " + err);
    }
}

function scheduleInspectionsValidationISB_backup() {
    try {
        logDebug("Begin scheduleInspectionsValidationISB");
        loadASITablesBefore();
        var inspectionOrderTable = INSPECTIONORDER;
        var inspectionGroup = "BD_Building";
        if (inspectionOrderTable && inspectionOrderTable.length > 0) {
            for (eachRow in inspectionOrderTable) {
                var inspectionType = inspectionOrderTable[eachRow]["Inspection Type"].toString().toUpperCase();
                var currentStatus = inspectionOrderTable[eachRow]["Current Status"].toString().toUpperCase();
                logDebug(inspType.toUpperCase() + " = " + inspectionType + " . with status of: " + currentStatus);
                if (inspType.toUpperCase().equals(inspectionType) && currentStatus != "AVAILABLE") {
                    cancel = true;
                    showMessage = true;
                    comment("The Inspection " + inspType + " is not available at this time, please see the Inspection Order Custom List");
                }
                if (inspType.toUpperCase().equals(inspectionType) && currentStatus == "AVAILABLE") {
                    logDebug("Inspection Found and Available");
                    break;
                }
            }
        }

        logDebug("End scheduleInspectionsValidationISB");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsValidationISB(), please contact administrator. Error: " + err);
    }
}

function BLD_Permit_Extension() {
    try {
        var tester = docCheck4ASB("Permit Extension Request");
        logDebug("Begin BLD_Permit_Extension");
        if (!publicUser) {
            if (tester) {
                delandTaskAssign("Review Consolidation", "Building");
            }
        }
        logDebug("End BLD_Permit_Extension");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function BLD_Permit_Extension(), please contact administrator. Error: " + err);
    }
}

function delandTaskAssign(vTask, assignToUser) {
    if (assignToUser.indexOf("/") > -1) {
        //value contains a / is is a department
        updateTaskDepartment(vTask, assignToUser);
    }
    else {
        //value is a user id
        assignTask(vTask, assignToUser);
    }

    logDebug(vTask + " task has been assigned to " + assignToUser);
}
function scheduleInspectionsIssuedStatusISB() {
    try {
        if (!matches(capStatus, "Issued")) {
            cancel = true;
            showMessage = true;
            comment("No inspections can be scheduled until permit has been issued. Please contact Permit Clerks at 386-626-7006 to get more information");
        }
        if (balanceDue > 0) {
            cancel = true;
            showMessage = true;
            comment("All fees must be paid prior to scheduling inspections. Please contact Permit Clerks at 386-626-7006 to get more information");
        }
        logDebug("End scheduleInspectionsIssuedStatusISB()");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ISB function scheduleInspectionsIssuedStatusISB(), please contact administrator. Error: " + err);
    }
}

function copyInspectionTableFrom() {
    try {
        logDebug("Begin function copyInspectionTableFrom");
        if (matches(wfTask,"Architectural","Building") && wfStatus == "Load Inspection Template") {
            loadAppSpecific(AInfo, capId);
            var templateName = AInfo["Template Name"];
            //var inspTemplate = getAppIdByName("Building","Template","Inspection","NA",template);
            var getTemplateAltId = lookup("LKUP_Building_GetTemplateCapID", templateName);
            var getTempCapId = aa.cap.getCapID(getTemplateAltId).getOutput();
            if (getTempCapId) {
                //var vSourceCapID = aa.cap.getCapID(inspTemplate).getOutput(); aa.print(vSourceCapID);
                copyASITables(getTempCapId, capId);
                logDebug("template table copied Successfully");
            }
        }
        logDebug("End function copyInspectionTableFrom");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function copyInspectionTableFrom(), please contact administrator. Error: " + err);
    }
}

function addLayersAttributes() {
    try {
        var airport = getGISInfo("Accela/Accela_Basemap", "Airport Zoning Overlay", "AIRPORTOVERLAYNAME");
        var downtown = getGISInfo("Accela/Accela_Basemap", "Downtown Support Design District", "PLANDISTNAME");
        var futureLandUse = getGISInfo("Accela/Accela_Basemap", "Future Land Use", "FLU_NAME");
        var historic = getGISInfo("Accela/Accela_Basemap", "Historic Overlay", "Overlay");
        var institution = getGISInfo("Accela/Accela_Basemap", "Institutional Overlay", "Overlay");
        var medical = getGISInfo("Accela/Accela_Basemap", "Community Health Overlay", "Overlay");
        var recreation = getGISInfo("Accela/Accela_Basemap", "Recreational Overlay", "Overlay");
        var zoned = getGISInfoArray("Accela/Accela_Basemap", "Zoning District Boundaries", "Zoning_Dis", -1, "feet");

        logDebug("Airport: " + airport +"; downtown: " + downtown+ "Future Land Use: " + futureLandUse + "; Historic Overlay: " + historic + "; Institution: " + institution + "; Medical: " + medical + "; Recreation: " + recreation + "Zoning: " + zoned);

        if (airport){
            editAppSpecific("Airport", airport);
            } else
            editAppSpecific("Airport","N/A");
        if (futureLandUse)  {
            editAppSpecific("Future Land Use Designation", futureLandUse);
            } else
            editAppSpecific("Future Land Use Designation","N/A");
        if (historic) {
            editAppSpecific("Historic District", historic);
            } else
            editAppSpecific("Historic District",  "N/A");
        if (downtown) {
                editAppSpecific("Historic Support", downtown);
            } else
                editAppSpecific("Historic Support",  "N/A");
        if (institution) {
            editAppSpecific("Institutional", institution);
            } else
                editAppSpecific("Institutional",  "N/A");
        if (medical) {
            editAppSpecific("Medical", medical);
            } else
                editAppSpecific("Medical",  "N/A");
        if (recreation) {
            editAppSpecific("Recreational", recreation);
            } else
                editAppSpecific("Recreational",  "N/A");
        if (zoned) {
            editAppSpecific("Zoned", zoned);
            } else
                editAppSpecific("Zoned",  "N/A");

    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA Event custom function addLayersAttributes(). Please contact administrator. Err: " + err);
    }
}





/*
** TASK ORIENTATED - NORMALLY CALLED BY EVENT HANDLERS
*/


//CALLED FROM IRSA:BUILDING/*/*/*
function scheduleInspectionsIRSA() {
    var inspectionOrderTable,
        maxCompletedMax = 0,
        minNonCompletedMin = 0;

    try {
        logDebug("Begin scheduleInspectionsIRSA");
        inspectionOrderTable = loadASITable("INSPECTION ORDER");
        if (typeof (inspectionOrderTable) == "object") {
            updateInspTableWithLatestInspResult();
            maxCompletedMax = getMaxCompletedMax();
            aa.print('maxCompletedMax - ' + maxCompletedMax);
            minNonCompletedMin = getMinNonCompletedMin();
            aa.print('minNonCompletedMin - ' + minNonCompletedMin);
            if (!doAvailablesExists() && getMinNonCompletedMax() > minNonCompletedMin) {
                maxCompletedMax = getMinNonCompletedMax();
                aa.print('maxCompletedMax2 - ' + maxCompletedMax);
                minNonCompletedMin = getMinNonCompletedMin();
                aa.print('minNonCompletedMin2 - ' + minNonCompletedMin);
            }
            setAvailables();

            aa.print('maxCompletedMax - ' + maxCompletedMax);
            aa.print('minNonCompletedMin - ' + minNonCompletedMin);

            removeASITable('INSPECTION ORDER');
            addASITable('INSPECTION ORDER', inspectionOrderTable);
        }
        logDebug("End scheduleInspectionsIRSA");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: IRSA function scheduleInspectionsIRSA(), please contact administrator. Error: " + err);
    }



    function updateInspTableWithLatestInspResult() {
        for (var x in inspectionOrderTable) {
            if (inspType.toUpperCase().equals(inspectionOrderTable[x]["Inspection Type"].toString().toUpperCase()) && inspectionOrderTable[x]["Current Status"] == "Available") {
                inspectionOrderTable[x]["Approved Date"] = inspResultDate;
                inspectionOrderTable[x]["Current Status"] = "Complete";
            }
        }
    }

    function getMaxCompletedMax() {
        var min = null,
            max = null,
            biggestMinCompletedMax = 0;

        for (var x in inspectionOrderTable) {
            min = max = null;
            if (inspectionOrderTable[x]["Current Status"] == "Complete") {
                max = inspectionOrderTable[x]["Max"];
                if (max && parseInt(max) > biggestMinCompletedMax) {
                    biggestMinCompletedMax = parseInt(inspectionOrderTable[x]["Max"]);
                }
            }
        }
        return biggestMinCompletedMax;
    }

    function getMinNonCompletedMin() {
        var min = null,
            max = null,
            smallestMinApprovedMin = 9999999;

        minNonCompletedMin = maxCompletedMax;
        for (var x in inspectionOrderTable) {
            min = max = null;
            if (inspectionOrderTable[x]["Current Status"] != "Complete") {
                var min = inspectionOrderTable[x]["Min"];
            }
            if (min && parseInt(min) < smallestMinApprovedMin && parseInt(min) >= minNonCompletedMin) {
                smallestMinApprovedMin = parseInt(min);
            }
        }
        return smallestMinApprovedMin;
    }

    function getMinNonCompletedMax() {
        //checks to see if an upcomming min=max, if not, it calls getMinApprovedMin() again
        var min = null,
            max = null,
            nextLowestMax = 9999999;

        for (var x in inspectionOrderTable) {
            min = max = null;
            if (inspectionOrderTable[x]["Current Status"] != "Complete") {
                min = inspectionOrderTable[x]["Min"];
                max = inspectionOrderTable[x]["Max"];
            }
            if (min & max && parseInt(min) == minNonCompletedMin) {
                if (parseInt(max) < nextLowestMax) {
                    nextLowestMax = parseInt(max);
                }
            }
        }
        return nextLowestMax;
    }

    function setAvailables() {
        var min = null,
            max = null;

        for (var x in inspectionOrderTable) {
            min = max = null;

            if (inspectionOrderTable[x]["Current Status"] != "Complete") {
                aa.print(inspectionOrderTable[x]["Inspection Type"] + ' is not complete');
                min = inspectionOrderTable[x]["Min"];
                max = inspectionOrderTable[x]["Max"];
            }
            if (min && parseInt(min) <= minNonCompletedMin) {
                aa.print('setting ' + inspectionOrderTable[x]["Inspection Type"] + ' to avail');
                inspectionOrderTable[x]["Current Status"] = 'Available';
            }
        }
    }

    function doAvailablesExists() {
        for (var x in inspectionOrderTable) {
            if (inspectionOrderTable[x]["Current Status"] == "Available") {
                return true;
            }
        }
        return false;
    }

}

//CALLED FROM WTUA:BUILDING/TEMPLATE/INSPECTION/NA
function bld_addInspectionTemplateToList() {
    if (wfStatus == "Add to List") {
        editLookup('BD_InspTemplateList', capName, capName)
    }
}

//CALLED FROM WTUA:BUILDING/*/*/*
function bld_loadInspectionTablesFromTemplate() {
    if (wfStatus == "Load Inspection Template") {
        var templateName = AInfo["Template Name"];
        var templateCapIds = getCapsByTypeAndName("Building", "Template", "Inspection", null, templateName);
        if (templateCapIds.length) {
            copyASITables(templateCapIds[0], capId);
            logDebug("template table copied Successfully");
        }
    }
}




/*
** REUSABLE - LIBRARY FUNCTIONS
*/

//LIBRARY - returns array of CapIDModel matching group, type, subtype, category, & name
function getCapsByTypeAndName(grp, typ, subTyp, cat, name) {
    var matchingCapIds = [];
    if (!grp || !typ) {
        throw "ERROR: getCapsByTypeAndName() - group  type are mandatory";
    }

    getCapResult = aa.cap.getByAppType(grp, typ);
    if (getCapResult.getSuccess()) {
        var apsArray = getCapResult.getOutput();
        for (var aps in apsArray) {
            var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();    //CapScriptModel
            var myTypeArray = myCap.getCapType().getValue().split("/");
            if ((!subTyp || myTypeArray[2] == subTyp) && (!cat || myTypeArray[3] == cat)) {
                if (myCap.getSpecialText() && myCap.getSpecialText().toUpperCase() == name.toUpperCase()) {
                    matchingCapIds.push(apsArray[aps].getCapID());
                }
            }
        }
    }
    return matchingCapIds;
}

function PreventSubmission_taxDistrictNum() {
    try {
        logDebug("Begin PreventSubmission_taxDistrictNum");
        var taxDist = getGISInfo_v3_ASB("Accela/Accela_Basemap", "Parcels", "TAXDIST"); logDebug("taxDist: " + taxDist);
        //if(!taxDist) { taxDist = parArr["ParcelAttribute.supervisorDistrict"]; }
        if (taxDist) {
            if (taxDist != "012") {
                cancel = true;
                showMessage = true;
                comment("this parcel is not in the City of DeLand City Limits, please see other jurisdiction or select another parcel.");
            }

        }

        logDebug("End PreventSubmission_taxDistrictNum");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PreventSubmission_taxDistrictNum. Contact your system administrator. " + err.message);
    }
}

function PL_Variance_Application_Fees() {
    try {
        logDebug("Begin PL_Variance_Application_Fees");
        loadAppSpecific(AInfo, capId);
        var existingUse = AInfo["Existing Use"];
        var vFeeSched = "PL_MAIN";
        var vFeeItem = "VARSFR";
        var vFeeItemothers = "VAR";
        if ($iTrc(existingUse == "Single-family dwellings", 'existingUse == "Single-family dwellings"')) {
            updateFee(vFeeItem, vFeeSched, "FINAL", 1, "N");
        }
        else {
            if(!publicUser) updateFee(vFeeItemothers, vFeeSched, "FINAL", 1, "N");
        }

        logDebug("End PL_Variance_Application_Fees");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PL_Variance_Application_Fees. Contact your system administrator. " + err.message);
    }
}

function BD_Gas_Clearance() {
    try {
        logDebug("Begin BD_Gas_Clearance");
        loadAppSpecific(AInfo, capId);
        var vReportFile = [];
        var templateName = "BD_GAS_CLEARANCE";
        //get address
        var addrResult = getPrimaryAddressLine();
        //
        //var emailTo = "floridamunicipalities@duke-energy.com";
        var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
        var altId = capId.getCustomID();
        var emailTo = "Cirellia@deland.org";
        var emailFrom = "no-reply@deland.gov";
        var iDate = inspResultDate;
        var emailParameters = aa.util.newHashtable();
        emailParameters.put("$$INSPDATE$$", iDate);
        emailParameters.put("$$CAPADDR$$", addrResult);
        emailParameters.put("$$CAPID$$", altId);
        var clearance = AInfo['Gas Clearance Needed'];

        if (matches(inspType, "Gas Final") && matches(inspResult, "Approved")) {
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    aa.print("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    aa.print("  *** Notification Failed to Send");
                }
            }
        }
        editAppSpecific("Gas Clearance Date", dateAdd(null, 0));
        logDebug("End BD_Gas_Clearance");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Gas_Clearance(), please contact administrator. Error: " + err);
    }
}

function BD_Ready_To_Issue() {
    logDebug("Begin BD_Ready_To_Issue");
    try {
        var emailFrom;
        var emailTo;
        var templateName = "BD_APPLICATIONREADYTOISSUE";

        var reportFile = [];
        var vFees = loadFees(capId);
        var feesAdded = false;
        var invoiceResult_L; //wfStatus = "Fees Assessed"

        var feeSeqArray = []; //test
        var feePerArray = []; //test
        if (wfTask == "Permit Issuance" && wfStatus == "Ready to Issue") {
            for (i in vFees) {
                thisFee = vFees[i];
                logDebug("We have a fee " + thisFee.code + " with status of: " + thisFee.status);
                //only process fees that are not already invoiced
                if (thisFee.status == "NEW") {
                    //invoiceFee2(thisFee.code, thisFee.period);
                    feeSeqArray.push(thisFee.sequence); //test
                    feePerArray.push(thisFee.period);   //test
                }
                    /*//invoiceResult_L = aa.finance.createInvoice(capId, thisFee.sequence, thisFee.period);
                    invoiceResult_L = aa.finance.createInvoice(capId, feeSeqArray, feePerArray);
                    if (invoiceResult_L.getSuccess()) {
                        logDebug("Invoicing assessed fee items to specified CAP is successful.");
                        feesAdded = true;
                    }
                    else
                        logDebug("**ERROR: Invoicing the fee items assessed to specified CAP was not successful.  Reason: " + invoiceResult.getErrorMessage());
                //}*/
            }

            //invoiceResult_L = aa.finance.createInvoice(capId, thisFee.sequence, thisFee.period);
            invoiceResult_L = aa.finance.createInvoice(capId, feeSeqArray, feePerArray);
            if (invoiceResult_L.getSuccess()) {
                logDebug("Invoicing assessed fee items to specified CAP is successful.");
                feesAdded = true;
            }
            else
                logDebug("**ERROR: Invoicing the fee items assessed to specified CAP was not successful.  Reason: " + invoiceResult.getErrorMessage());

            var thebalance = getBalance("", "", null, capId);
            if (thebalance) { thebalance = "$" + thebalance; }
            var emailParameters = aa.util.newHashtable();
            var contact = getContactByTypeAA("Applicant", capId); //balanceDue = 400;
            var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
            var altId = capId.getCustomID();
            var cap = aa.cap.getCap(capId).getOutput();
            var capAlias = cap.getCapType().getAlias();
            emailFrom = "no-reply@deland.gov";
            emailTo = contact.email;
            emailParameters.put("$$CAPID$$", altId);
            emailParameters.put("$$CAPNAME$$", capAlias);
            emailParameters.put("$$BALANCE$$", thebalance);
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    logDebug("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    logDebug("  *** Notification Failed to Send");
                }
            }
        }
        logDebug("End BD_Ready_To_Issue");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Ready_To_Issue(), please contact administrator. Error: " + err);
    }
}

function BD_Ready_To_Issue2() {
    logDebug("Begin BD_Ready_To_Issue");
    try {
        var emailFrom;
        var emailTo;
        var templateName = "BD_APPLICATIONREADYTOISSUE";

        var reportFile = [];
        var vFees = loadFees(capId);
        var feesAdded = false;
        var invoiceResult_L; //wfStatus = "Fees Assessed"
        if (wfTask == "Permit Issuance" && wfStatus == "Ready to Issue") {
            for (i in vFees) {
                thisFee = vFees[i];
                logDebug("We have a fee " + thisFee.code + " with status of: " + thisFee.status);
                //only process fees that are not already invoiced
                if (thisFee.status == "NEW") {
                    //invoiceFee2(thisFee.code, thisFee.period);
                    invoiceResult_L = aa.finance.createInvoice(capId, thisFee.sequence, thisFee.period);
                    if (invoiceResult_L.getSuccess()) {
                        logDebug("Invoicing assessed fee items to specified CAP is successful.");
                        feesAdded = true;
                    }
                    else
                        logDebug("**ERROR: Invoicing the fee items assessed to specified CAP was not successful.  Reason: " + invoiceResult.getErrorMessage());
                }
            }
            var thebalance = getBalance("", "", null, capId);
            if (thebalance) { thebalance = "$" + thebalance; }
            var emailParameters = aa.util.newHashtable();
            var contact = getContactByTypeAA("Applicant", capId); //balanceDue = 400;
            var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
            var altId = capId.getCustomID();
            var cap = aa.cap.getCap(capId).getOutput();
            var capAlias = cap.getCapType().getAlias();
            emailFrom = "no-reply@deland.gov";
            emailTo = contact.email;
            emailParameters.put("$$CAPID$$", altId);
            emailParameters.put("$$CAPNAME$$", capAlias);
            emailParameters.put("$$BALANCE$$", thebalance);
            if (emailTo) {
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", templateName, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) {
                    logDebug("  *** Notification sent to " + emailTo + " for record " + altId);
                }
                else {
                    logDebug("  *** Notification Failed to Send");
                }
            }
        }
        logDebug("End BD_Ready_To_Issue");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BD_Ready_To_Issue(), please contact administrator. Error: " + err);
    }
}

function Update_Permits_Issued_Date(){
  try{
    logDebug("Begin Update_Permits_Issued_Date");
    if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
      //useAppSpecificGroupName = false;
      editAppSpecific("Permit Issued Date", dateAdd(null, 0));
    }
    logDebug("End Update_Permits_Issued_Date");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Update_Permits_Issued_Date(), please contact administrator. Error: " + err);
  }
}

function WTUA_Update_Application_ExpirationPW(){
  try{
    logDebug("begin function WTUA_Update_Application_Expiration");
    if((wfTask == "Application Submittal" || wfTask == "Application Acceptance") && matches(wfStatus,"Approved","Resubmittal Required","Completed", "Accepted","Accepted-OTC")){
      editAppSpecific("Application Expiration Date", dateAdd(null,365));
      logDebug("Application Expiration Date updated");
    }
    logDebug("End function WTUA_Update_Application_Expiration");
  }
  catch(err){
    showMessage = true;
        comment("Error on custom function WTUA_Update_Application_Expiration(). Please contact administrator. Err: " + err);
  }

}

function Update_Permits_Expiration_Permit_Issued_DatePW(){
  try{
    logDebug("Begin Update_Permits_Expiration_Permit_Issued_Date");
    if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
      //useAppSpecificGroupName = false;
      editAppSpecific("Permit Expiration Date", dateAdd(null, 365));
    }
    logDebug("End Update_Permits_Expiration_Permit_Issued_Date");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Update_Permits_Expiration_Permit_Issued_Date(), please contact administrator. Error: " + err);
  }
}

function Update_Permits_Issued_DatePW(){
  try{
    logDebug("Begin Update_Permits_Issued_Date");
    if(wfTask == "Permit Issuance" && wfStatus == "Issued"){
      useAppSpecificGroupName = false;
      editAppSpecific("Permit Issued Date", dateAdd(null, 0));
    }
    logDebug("End Update_Permits_Issued_Date");
  }
  catch(err){
    showMessage = true;
    comment("ERROR: WTUA function Update_Permits_Issued_Date(), please contact administrator. Error: " + err);
  }
}

function PL_DesignReviewFees(){
    try {
        logDebug("Begin SitePlan_Design Review");
        loadAppSpecific(AInfo, capId);
        var assessStdRevFee = AInfo["Assess Standards Review Fees"];
        var typeSite=AInfo["Type of Site Plan"];
        var sitPlanClass = AInfo["Site Plan Class"]
        var acreDRFee=AInfo["DR Per Acre Fee"];
        var repetitiveDRFee=AInfo["Repetitive Design Review Fee"];
        var exteriorPlanFee=AInfo["Site Plan Exterior Plan Fee"];
        var existingUse = AInfo["Existing Use"];

        //var vFeeSched = "PL_SITEPLAN";
        var vFeeSched = "PL_MAIN";
        
        if($iTrc(typeSite == "Concept Plan", 'typeSite == "Concept Plan"')){
            updateFee("CPAPP", vFeeSched, "FINAL", 1, "N");
        }
        
        if($iTrc(sitPlanClass == "Class II", 'sitPlanClass == "Class II"')){
            updateFee("SPCLASS2", vFeeSched, "FINAL", 1, "N");
        }
        
        if($iTrc(sitPlanClass == "Class III" && existingUse != "Multiple-family dwellings", 'sitPlanClass == "Class III" && existingUse != "Multiple-family dwellings"')){
            if(AInfo["Acres"] != null) updateFee("SPCLASS3", vFeeSched, "FINAL", parseFloat(AInfo["Acres"]), "N");
        }
        
        if($iTrc(sitPlanClass == "Class IV" && existingUse != "Multiple-family dwellings", 'sitPlanClass == "Class IV" && existingUse != "Multiple-family dwellings"')){
            if(AInfo["Acres"] != null) updateFee("SPCLASS4", vFeeSched, "FINAL", parseFloat(AInfo["Acres"]), "N");
        }
        
        if($iTrc(matches(sitPlanClass, "Class III","Class IV") && existingUse == "Multiple-family dwellings",
                 'matches(sitPlanClass, "Class III","Class IV") && existingUse == "Multiple-family dwellings"')){
            if(AInfo["Number of Units"] != null) updateFee("SPMULTI", vFeeSched, "FINAL", parseFloat(AInfo["Number of Units"]), "N");
        }
        
        //if ($iTrc(assessStdRevFee == "Yes", 'assessStdRevFee == "Yes"')) {
        //    updateFee("STDREVSP", vFeeSched, "FINAL", acreDRFee, "N");
        //    if(exteriorPlanFee != 0 || extPerimTotal !=null)
        //        updateFee("STDREVEXTER",vFeeSched,"FINAL", exteriorPlanFee,"N");
        //    if(repetitiveDRFee != 0 || repetitiveDRFee !=null)
        //        updateFee("STDREVCLUST", vFeeSched,"FINAL", repetitiveDRFee,"N");
        //    if(typeSite = "Class II"){
        //        updateFee("PBCDSR12", vFeeSched, "FINAL",1, "N");
        //    }
        //    else {
        //        updateFee("PBCDSR34", vFeeSched, "FINAL", 1, "N");
        //    }
        //}
        logDebug("End PL_SitePlan_Design Review");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PL_SitePlan_Design Review Fees. Contact your system administrator. " + err.message);
    }
}
function BD_Failed_Penalty_Inspection(){
try {
        logDebug("Begin BD_Failed_Penalty_Inspection");
        var feeSchedule = "BD_PERMITS";
        var feeItem = "REINSP";
    if(matches(inspResult,"Failed - Penalty Assessed")){
            addFeeWithExtraData(feeItem, feeSchedule, 'FINAL', 1,"Y",capId,inspType);
                logDebug("BD Fee BPFC Assessed");
            }

        logDebug("End BD_Failed_Penalty_Inspection");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: IRSA function BD_Failed_Penalty_Inspection(), please contact administrator. Error: " + err);
    }
}

function scheduleInspFromDocumentUpload(capId){
    try{
        logDebug("Begin Function: scheduleInspFromDocumentUpload(capId:" + capId + ")");

        //if (publicUser) // only works in AA, not ACA
        //{

            var documentList = documentModelArray;
            if (!documentList) {
                aa.sendEmail("DoNotReply@DeLand.org", "Cirellia@deland.org", "", "DUA:BUILDING/*/*/* Event", "Message: " + message + " Debug: " + debug + " DocList was null!", null);
                return false;
            } else {

                for (var counter = 0; counter < documentList.size() ; counter++) {
                    var doc = documentList.get(counter);
                    if (doc.getDocCategory() != "") {
                        logDebug("document category: " + doc.getDocCategory());
                        scheduleInspection(doc.getDocCategory(), 1);
                    }
                }
            }
        //}

        logDebug("End Function: scheduleInspFromDocumentUpload(capId:" + capId + ")");
    }
    catch(err){
        showMessage = true;
        logDebug("Error on DUA Event custom function scheduleInspFromDocumentUpload(). Please contact administrator. Err: " + err);
    }

    aa.sendEmail("DoNotReply@DeLand.org", "Cirellia@deland.org", "", "DUA:BUILDING/*/*/* Event", "Message: " + message + " Debug: " + debug, null);

}

function getGISInfo_v3(svc,layer,attributename)
    {
    // use buffer info to get info on the current object by using distance 0
    // usage:
    //
    // x = getGISInfo("flagstaff","Parcels","LOT_AREA");
    //

    var distanceType = "feet";
    var retString;

    var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
    if (bufferTargetResult.getSuccess())
        {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(attributename);
        }
    else
        { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

    var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
        { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

    for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
        {
        var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-1", distanceType, buf);

        if (bufchk.getSuccess())
            var proxArr = bufchk.getOutput();
        else
            { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

        for (a2 in proxArr)
            {
            var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
            for (z1 in proxObj)
                {
                var v = proxObj[z1].getAttributeValues(); aa.print("RET: " + v[v.length -1]);
                retString = v[0];
                }

            }
        }
    return retString
    }

function setContactTypePrimary(pContactType,pPrimary) {
    var itemCapId = (arguments.length == 3) ? arguments[2] : capId;
    var vPrimary = matches(pPrimary,"Y",true,"true") ? true : false;

    var vContactObj = new getContactObj(itemCapId, pContactType);

    vContactObj.primary = vPrimary;
    vContactObj.save();
}

function getGISInfo_v3_ASB(svc,layer,attributename)
{
    // use buffer info to get info on the current object by using distance 0
    // usage:
    //
    // x = getGISInfo("flagstaff","Parcels","LOT_AREA");
    //
    // to be used with ApplicationSubmitBefore only

    var distanceType = "feet";
    var retString;

    var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
    if (bufferTargetResult.getSuccess())
    {
        var buf = bufferTargetResult.getOutput();
        buf.addAttributeName(attributename);
    }
    else
    { logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

    var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
    if (gisObjResult.getSuccess())
        var fGisObj = gisObjResult.getOutput();
    else
        { logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

    for (a1 in fGisObj) // for each GIS object on the Parcel.  We'll only send the last value
    {
        var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-1", distanceType, buf);

        if (bufchk.getSuccess())
            var proxArr = bufchk.getOutput();
        else
            { logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

        for (a2 in proxArr)
        {
            var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
            for (z1 in proxObj)
            {
                var v = proxObj[z1].getAttributeValues()
                retString = v[0];
            }
        }
    }

    return retString
}

function getGISInfoArray(svc,layer,attributename) // optional: numDistance, distanceType
{
    try{
        var numDistance = 0;
        if (arguments.length >= 4) numDistance = arguments[3]; // use numDistance in arg list
        var distanceType = "feet";
        if (arguments.length == 5) distanceType = arguments[4]; // use distanceType in arg list
        var retArray = new Array();

        var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
        if (bufferTargetResult.getSuccess())
            {
            var buf = bufferTargetResult.getOutput();
            buf.addAttributeName(attributename);
            }
        else
            { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

        var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
        if (gisObjResult.getSuccess())
            var fGisObj = gisObjResult.getOutput();
        else
            { logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

        for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
            {
            var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

            if (bufchk.getSuccess())
                var proxArr = bufchk.getOutput();
            else
                { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

            for (a2 in proxArr)
                {
                var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
                for (z1 in proxObj)
                    {
                    var v = proxObj[z1].getAttributeValues();
                    for (vi in v) {
                        if (!exists(v[vi], retArray))
                            retArray.push(v[vi]);
                    }
                }

                }
            }
        return retArray;
    }
    catch (err) {
        logDebug("A JavaScript Error occurred: function getGISInfoArray2: " + err.message);
        logDebug(err.stack);
    }
}


function loadASITables4ACAXX(tname) {
    //
    // Loads App Specific tables into their own array of arrays.  Creates global array objects
    //
    // Optional parameter, cap ID to load from.  If no CAP Id specified, use the capModel
    //
    var itemCap = capId;
    if (arguments.length == 2) {
       itemCap = arguments[1]; // use cap ID specified in args
       var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
    } else {
       var gm = cap.getAppSpecificTableGroupModel()
    }
    var tempArray = [];
    if(gm){
        var ta = gm.getTablesMap();
        var tai = ta.values().iterator();
        while (tai.hasNext()) {
            var tsm = tai.next();
            if (tsm.rowIndex.isEmpty()) continue; // empty table

            var tempObject = new Array();
            var tempArray = new Array();
            var tn = tsm.getTableName();

            if (!tn.equals(tname)) continue;

            if (tsm.rowIndex.isEmpty())
            {
                logDebug("Couldn't load ASI Table " + tname + " it is empty");
                return false;
            }

            var tempObject = new Array();
            var tempArray = new Array();

            var tsmfldi = tsm.getTableField().iterator();
            var tsmcoli = tsm.getColumns().iterator();
            //var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
            var numrows = 1;
            while (tsmfldi.hasNext()) // cycle through fields
            {
                if (!tsmcoli.hasNext()) // cycle through columns
                {
                    var tsmcoli = tsm.getColumns().iterator();
                    tempArray.push(tempObject); // end of record
                    var tempObject = new Array(); // clear the temp obj
                    numrows++;
                }

                var tcol = tsmcoli.next();
                var tval = tsmfldi.next();
                var readOnly = 'N';
                //if (readOnlyi.hasNext()) {
                //    readOnly = readOnlyi.next();
                //}
                var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
                tempObject[tcol.getColumnName()] = fieldInfo;
            }

            tempArray.push(tempObject);  // end of record
        }
        return tempArray;
    }
    return tempArray;
}


function validateAdditionalParcels(custListName, custListColName){
    var invalidParcels = [];
    var additionalPrcls = [];
    if(publicUser){
        additionalPrcls = loadASITables4ACAXX(custListName);
    }
    else{
        additionalPrcls = loadASITable(custListName);
    }

    for(j in additionalPrcls){
        var aPrclNum = additionalPrcls[j][custListColName];
        var prclGISRes = aa.gis.getParcelGISObjects(aPrclNum);

        prclGISRes = aa.parcel.getParceListForAdmin(aPrclNum, "", "", "", "", "", "", "", "", "")

        if(prclGISRes.getSuccess()){
            var prclGIS = prclGISRes.getOutput();

            if(prclGIS.length <= 0) invalidParcels.push(aPrclNum);
        }
        else{
            logDebug("Unable to get parcel list, err: " + prclGISRes.getErrorMessage());
            invalidParcels.push(aPrclNum);
        }
    }

    return invalidParcels;
}//END validateAdditionalParcels()

function getAssignedCapUser(){
    var itemCap = capId
    if (arguments.length > 0) itemCap = arguments[0]; // use cap ID specified in args

    var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
    if (!cdScriptObjResult.getSuccess())
        { logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

    var cdScriptObj = cdScriptObjResult.getOutput();

    if (!cdScriptObj)
        { logDebug("**ERROR: No cap detail script object") ; return false; }

    cd = cdScriptObj.getCapDetailModel();

    return cd.getAsgnStaff();

}//END getAssignedCapUser()

function docUploadedNotification_ACA(){
    if(publicUser){
        var workDesc = workDescGet(capId) == null ? "" : workDescGet(capId);
        var altId = capId.getCustomID();
        var addressLine = "";
        var docCats = "";
        var docFileNams = "";
        var docDescs    = "";

        var adResult = aa.address.getPrimaryAddressByCapID(capId,"Y");
        if (adResult.getSuccess())
            addressLine = adResult.getOutput().getAddressModel();


        var docArray = documentModelArray.toArray();
        for(each in docArray){
            var aDoc = docArray[each];
            docCats = aDoc.getDocCategory();
            docFileNams = aDoc.getFileName();
            docDescs = aDoc.getDocDescription();
        }

        emailParameters = aa.util.newHashtable();
        emailParameters.put("$$PERMITID$$", altId);
        emailParameters.put("$$APPTYPEALIAS$$", cap.getCapType().getAlias());
        emailParameters.put("$$PERMITWRKDESC$$", workDesc);
        emailParameters.put("$$PERMITADDR$$", addressLine);
        emailParameters.put("$$DOCCATEGORY$$", docCats);
        emailParameters.put("$$FILENAME$$", docFileNams);
        emailParameters.put("$$DOCDESC$$", docDescs);


        var userObj = null;
        var asgnUserEmail = null;
        var asgnUser = getAssignedCapUser();
        if($iTrc(asgnUser, 'asgnUser')) userObj  = aa.person.getUser(asgnUser).getOutput();
        if($iTrc(userObj, 'userObj')) asgnUserEmail = userObj.getEmail();

        logDebug("asgnUserEmail = " + asgnUserEmail);
        if($iTrc(asgnUserEmail, 'asgnUserEmail')){
            sendNotification("", asgnUserEmail, "", "DOC_UPLOADED", emailParameters, null);
        }
    }
}//END docUploadedNotification_ACA()


function doScriptActions() {
    include(prefix + ":" + "*/*/*/*");
    if (typeof(appTypeArray) == "object") {
        include(prefix + ":" + appTypeArray[0] + "/*/*/*");
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/*");
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/*");
        include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/*");
        include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/*/*/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);
    }
}

function doScriptActionsCustom() {
    include(prefix + ":" + "*/*/*/*");
    if (typeof(appTypeArray) == "object") {
        include(prefix + ":" + appTypeArray[0] + "/*/*/*");
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/*");
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/*");
        include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/*");
        include(prefix + ":" + appTypeArray[0] + "/*/" + appTypeArray[2] + "/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/*/*/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/*/" + appTypeArray[3]);
        include(prefix + ":" + appTypeArray[0] + "/" + appTypeArray[1] + "/" + appTypeArray[2] + "/" + appTypeArray[3]);
    }
}

function issueLicense(){
    logDebug("issueLicense() started");
    try{
        var newLic = null,
            newLicId = null,
            newLicIdString = null,
            newLicenseType = "Business",
            monthsToInitialExpire = 12;

        newLicId = createParent(appTypeArray[0], appTypeArray[1], appTypeArray[2], "License",null);  // create the license record
        if(newLicId){
            newLicIdString = newLicId.getCustomID(); updateAppStatus("Active","Originally Issued",newLicId); editAppName(capName,newLicId);
            var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*");
            var ignoreArr = new Array();
            if(ignore != null) ignoreArr = ignore.split("|");

            copyAppSpecific(newLicId,ignoreArr);
            /*var tmpNewDate = dateAddMonths(null, monthsToInitialExpire);
            thisLic = new licenseObject(newLicIdString,newLicId);
            thisLic.setExpiration(dateAdd(tmpNewDate,0));
            thisLic.setStatus("Active");*/
            
            //Commented line below because it was requested to not display the word license in the system.
            //changeCapContactTypes("Applicant","License Holder", newLicId);
            copyASITables(capId,newLicId);

            return newLicId;
        }
    }
    catch(err){
        showMessage = true;
        comment("Error on custom function issueLicense(). Err: " + err + ". Line Number: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("issueLicense() ended");
}//END issueLicense()

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

function runBusinessTaxReceiptAsync(itemCapId, reportName){
    var asyncScript = 'RUN_REPORT_ASYNC';

    var envParameters = aa.util.newHashMap();
    envParameters.put("ReportName", reportName); // add parameters needed for report
    envParameters.put("CapId", itemCapId)
    envParameters.put("CustomCapId",itemCapId.getCustomID());
    aa.runAsyncScript(asyncScript, envParameters);
}

function attachOwnerDisclosure(){
    if(AInfo["Owner Builder"] == "Yes") {
        logDebug("Attempting to attach Owner disclosure report");
        //runReportAttach(capId, "Owner Disclosure Statement", "RecordID", capId.getCustomID())
        var asyncScript = 'RUN_OWNER_DISC_ASYNC';

        var envParameters = aa.util.newHashMap();
        envParameters.put("ReportName", "Owner Disclosure Statement"); // add parameters needed for report
        envParameters.put("CapId", capId)
        envParameters.put("CustomCapId",capId.getCustomID());
        aa.runAsyncScript(asyncScript, envParameters);
    }
}

function getPrimaryCapParcel()
{
  try{
            var capParcelModel = cap.getParcelModel();
            if(capParcelModel == null) return;

            var parcelModel = capParcelModel.getParcelModel();
            if(parcelModel == null) return;

            return parcelModel.getParcelNumber();
   }
  catch (err){
    logDebug("A JavaScript Error occurred in custom function getPrimaryCapParcel(): " + err.message);
    //aa.print("A JavaScript Error occurred in custom function getPrimaryCapParcel(): " + err.message);
  }
 }

function getGISInfoByParcel_DELAND(pParcelNo,svc,layer,attributename)
{
  try{
    var distanceType = "feet";
    var retString;

    //get layer
    var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
    if (bufferTargetResult.getSuccess())
      {
      var buf = bufferTargetResult.getOutput();
      buf.addAttributeName(attributename);
      }
    else
      { logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

    //get parcel GIS object
    //aa.print("Looking at parcel " + pParcelNo);
    var gisObjResult = aa.gis.getParcelGISObjects(pParcelNo); // get gis objects on the parcel number
    if (gisObjResult.getSuccess())
    {
      var fGisObj = gisObjResult.getOutput();
    }
    else
    {
      logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false
    }

    for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
    {
      var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-1", distanceType, buf);

      if (bufchk.getSuccess())
        var proxArr = bufchk.getOutput();
      else
        { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

      for (a2 in proxArr)
      {
        var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
        for (z1 in proxObj)
        {
          var v = proxObj[z1].getAttributeValues()
          retString = v[0];
        }
      }
    }
    return retString;
  }
  catch (err){
    logDebug("A JavaScript Error occurred in custom function getGISInfoByParcel(): " + err.message);
    //aa.print("A JavaScript Error occurred in custom function getGISInfoByParcel(): " + err.message);
  }
}

function getRenewalCapByParentCapID(parentCapid){

    if (parentCapid == null || aa.util.instanceOfString(parentCapid)){
        return null;
    }

    var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Incomplete");

    if(result.getSuccess()){
        projectScriptModels = result.getOutput();
        if (projectScriptModels == null || projectScriptModels.length == 0){
            logDebug("(getRenewalCapByParentCapID) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")");
            return null;
        }
        
        projectScriptModel = projectScriptModels[0];

        return projectScriptModel;
    }  
    else{
        logDebug("(getRenewalCapByParentCapID) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")" + result.getErrorMessage());
        return null;
    }
}

function setRenewal2Incomplete(itemCap){
    logDebug("setRenewal2Incomplete() started");
    try{
        var parentCapid = getParentLicenseCapID(itemCap);
        var thisRes = aa.cap.getProjectByMasterID(parentCapid, "Renewal", null);
        
        if(thisRes.getSuccess()){
            projectScriptModels = thisRes.getOutput();
            if (projectScriptModels == null || projectScriptModels.length == 0){
                logDebug("(setRenewal2Incomplete) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")");
                return null;
            }
            
            for(each in projectScriptModels){
                var aModel = projectScriptModels[each];
                if(aModel.capID.toString() == itemCap.toString()){
                    aModel.setStatus("Incomplete");
                    var updateRes = aa.cap.updateProject(aModel);
                    if(updateRes.getSuccess()){
                        logDebug("Updated status to imcomplete for altId: " + itemCap.getCustomID());
                        logDebug("setRenewal2Incomplete() ended");
                        return true;
                    }
                    else{
                        logDebug("ERROR: Unable to update status for altId: " + itemCap.getCustomID() + ". Error: " + updateRes.getErrorMessage());
                        logDebug("setRenewal2Incomplete() ended");
                        return false;
                    }
                }
            }
        }  
        else{
            logDebug("(setRenewal2Incomplete) : ERROR: Failed to get renewal CAP by parent CAPID(" + parentCapid + ")" + thisRes.getErrorMessage());
            return null;
        }
    }
    catch(err){
        showMessage = true;;
        comment("Error on custom function (). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber);
        logDebug("Error on custom function (). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("setRenewal2Incomplete() ended");
}//END setRenewal2Incomplete()

function docCheckByCategory4AA(docCategory){
    var attachedDocs = getDocumentList();
    for(idx in attachedDocs){
        var aDoc = attachedDocs[idx];
        
        if(aDoc.getDocCategory() == docCategory) 
            return true;
    }
    
    return false;
}


/**
 * Notification to Applicant when Inspection is resulted
 * @conType (String) Contact type to be notified.
 */
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

function addResFees(){
    logDebug("addResFees() started.");
    try{
        var use = AInfo["Use"];
        var fixturesCount = AInfo["Plumbing Fixture Count"];
        
        if(use == "Residential"){
            if(fixturesCount && parseInt(fixturesCount) > 0){
                updateFee("RESPLFIX", "BD_PERMITS", "FINAL", parseInt(fixturesCount), "N")
            }
            
            updateFee("RESTPOLE", "BD_PERMITS", "FINAL", 1, "N");
            updateFee("DRIVEUSE", "BD_PERMITS", "FINAL", 1, "N");
            updateFee("ZREVBLDG", "BD_PERMITS", "FINAL", 1, "N");
            
            updateFee("WRMETFEE", "IMPACT", "FINAL", 1, "N");
            updateFee("SEWCON", "IMPACT", "FINAL", 1, "N");
        }
    }
    catch(err){
        showMessage = true;;
        comment("Error on custom function addResFees(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber);
        logDebug("Error on custom function addResFees(). Please contact administrator. Err: " + err + ". Line: " + err.lineNumber + ". Stack: " + err.stack);
    }
    logDebug("addResFees() ended.");
}

function getGISInfoArrayByParcel_DELAND(pParcelNo,svc,layer,attributename)
{
    try{
        var distanceType = "feet";
        var retArray = new Array();
        
        var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
        if (bufferTargetResult.getSuccess()){
            var buf = bufferTargetResult.getOutput();
            buf.addAttributeName(attributename);
        }
        else{
            logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ;
            return false;
        }

        var gisObjResult = aa.gis.getParcelGISObjects(pParcelNo); // get gis objects on the parcel number
        if (gisObjResult.getSuccess())
            var fGisObj = gisObjResult.getOutput();
        else{
            logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage());
            return false;
        }

        for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
        {
            var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-1", distanceType, buf);

            if (bufchk.getSuccess())
                var proxArr = bufchk.getOutput();
            else{
                logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ;
                return false;
            }

            for (a2 in proxArr)
            {
                var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
                for (z1 in proxObj)
                {
                    logDebug("Found GIS Object, getting attribute.");
                    var v = proxObj[z1].getAttributeValues()
                    for (vi in v) {
                        if (!exists(v[vi], retArray))
                            retArray.push(v[vi]);
                    }
                }
            }
        }
    
        return retArray;
    }
    catch (err){
        logDebug("A JavaScript Error occurred in custom function getGISInfoArrayByParcel(): " + err.message);
    }
}
