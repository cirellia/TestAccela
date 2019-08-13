/*------------------------------------------------------------------------------------------------------/
| Program: LIC_RENEWAL_PROCESS_SET.js  Trigger: Batch
| Client:
|
| Version 1.0 - Base Version. 02/05/2014
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| BEGIN Initialize Variables
/------------------------------------------------------------------------------------------------------*/

//  SCRIPT TEST PARAMETERS
/*var mySetID = "LIC_RENEWAL-06202019061740";
var setMemberArray = new Array(); 
var setMemberResult = aa.set.getCAPSetMembersByPK(mySetID);
if (setMemberResult.getSuccess()) 
{
    setMemberArray = setMemberResult.getOutput().toArray();
    aa.env.setValue("SetMemberArray",setMemberArray);
    aa.env.setValue("SetId",mySetID);
    aa.env.setValue("ScriptName","LIC_RENEWAL_PROCESS_SET");
} 
else 
{
    logDebug("Error: Could not find set by PK: " + mySetID);
}*/


var debug = ""; 
var br = "<BR>";
var message =   "";
var emailText = "";

var currentUserID = aa.env.getValue("CurrentUserID");
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

var SetMemberArray= aa.env.getValue("SetMemberArray");
var SetId =  aa.env.getValue("SetID");
var ScriptName =  aa.env.getValue("ScriptName");

/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 3.0;

function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode) servProvCode = aa.getServiceProviderCode();
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        if (useProductScripts) {
            var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
        } else {
            var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
        }
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}

var useCustomScriptFile = false;  // if true, use Events->Custom Script, else use Events->Scripts->INCLUDES_CUSTOM
var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
    useSA = true;
    SA = bzr.getOutput().getDescription();
    bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
    if (bzr.getSuccess()) {
        SAScript = bzr.getOutput().getDescription();
    }
}

if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA, useCustomScriptFile));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS", SA, useCustomScriptFile));
    eval(getScriptText(SAScript, SA));
} else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useCustomScriptFile));
    eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, useCustomScriptFile));
}

eval(getScriptText("INCLUDES_CUSTOM", null, useCustomScriptFile));
/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
sysDate = aa.date.getCurrentDate();
wfObjArray = null;

/*----------------------------------------------------------------------------------------------------/
|
| Start: SCRIPT PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var configStdChoice = "LIC_RENEWAL_CONFIG";  // the standard choice that contains the batch renewal configuration information
var showDebug = lookup(configStdChoice, "showDebug");   //debug level

logDebug("Processing Set: " + SetId);

var newExpStatus = lookup(configStdChoice, "newExpStatus")              //   update to this expiration status
var newAppStatus = lookup(configStdChoice, "newAppStatus")              //   update the CAP to this status
var gracePeriodDays = lookup(configStdChoice, "gracePeriodDays")                //  bump up expiration date by this many days
var inspSched = lookup(configStdChoice, "inspSched");                           //   Schedule Inspection
var emailAddress = lookup(configStdChoice, "emailAddress");                 // email to send report
var sendEmailToContactTypes = lookup(configStdChoice, "sendEmailToContactTypes");// send out emails?
var emailTemplate = lookup(configStdChoice, "emailTemplate");                   // email Template
var deactivateLicense = lookup(configStdChoice, "deactivateLicense");           // deactivate the LP
var createRenewalRecord = lookup(configStdChoice, "createTempRenewalRecord");   // create a temporary record
var feeSched = lookup(configStdChoice, "feeSched");                             //
var feeList = lookup(configStdChoice, "feeList");                               // comma delimted list of fees to add
var feePeriod = lookup(configStdChoice, "feePeriod");                           // fee period to use {LICENSE}
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var mailFrom = lookup("ACA_EMAIL_TO_AND_FROM_SETTING","RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
var acaSite = lookup("ACA_CONFIGS","ACA_SITE");
acaSite = acaSite.substr(0,acaSite.toUpperCase().indexOf("/ADMIN"));

var startDate = new Date();
var startTime = startDate.getTime();            // Start timer
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

emailText = debug;

if (emailAddress.length)
    aa.sendMail("noreply@accela.com", emailAddress, "", ScriptName + " Results", emailText);


/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


function mainProcess(){
    
    var capCount = 0;
    var inspDate;
    var setName;
    var setDescription;
    
    var set = aa.set.getSetByPK(SetId).getOutput();
    var setStatus = set.getSetStatus();
    if(setStatus == "Completed") {
        logMessage("Set has been processed and marked as complete.");
        
        aa.env.setValue("ScriptReturnCode","0");
        aa.env.setValue("ScriptReturnMessage", message);
        return false;
    }
    /*------------------------------------------------------------------------------------------------------/
    | <===========Main=Loop================>
    |
    /-----------------------------------------------------------------------------------------------------*/
    for(var i=0; i < SetMemberArray.length; i++) {
        var id= SetMemberArray[i];
      
        capId = aa.cap.getCapID(id.getID1(), id.getID2(),id.getID3()).getOutput();
        var renewalCapId = null;

        if (!capId){
            logDebug("Could not get a Cap ID for " + id.getID1() + "-" + id.getID2() + "-" + id.getID3());
            continue;
        }
        
        altId = capId.getCustomID();
        
        // get expiration info
        var expResult = aa.expiration.getLicensesByCapID(capId);
        if(!expResult){
            logDebug(altId + ": ERROR Could not get Renewal Information");
            continue;
        }
        
        var b1Exp = expResult.getOutput();
        var b1Status = b1Exp.getExpStatus();
        var expDate = b1Exp.getExpDate();
        var b1ExpDate;
        if (expDate){
            b1ExpDate = expDate.getMonth() + "/" + expDate.getDayOfMonth() + "/" + expDate.getYear();
        }
        logMessage("Processing " + altId);
        logDebug(altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);
        logMessage("--> " + altId + ": Renewal Status : " + b1Status + ", Expires on " + b1ExpDate);

        var cap = aa.cap.getCap(capId).getOutput();

        var capStatus = cap.getCapStatus();
        
        appTypeResult = cap.getCapType();       //create CapTypeModel object
        appTypeString = appTypeResult.toString();
        appTypeArray = appTypeString.split("/");

        capCount++;

        // Actions start here:
        
        var refLic = getRefLicenseProf(altId); // Load the reference License Professional
        if (refLic && deactivateLicense.substring(0,1).toUpperCase().equals("Y")){
            refLic.setAuditStatus("I");
            aa.licenseScript.editRefLicenseProf(refLic);
            logDebug(altId + ": deactivated linked License");
        }

        // update expiration status
        if (newExpStatus.length > 0 && newExpStatus != null){
            b1Exp.setExpStatus(newExpStatus);
            aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
            logDebug(altId + ": Update expiration status: " + newExpStatus);
            logMessage("--> " + altId + ": Update expiration status: " + newExpStatus);
        }

        // update expiration date based on interval

        if (parseInt(gracePeriodDays) != 0 && gracePeriodDays != null){
            newExpDate = dateAdd(b1ExpDate,parseInt(gracePeriodDays));
            b1Exp.setExpDate(aa.date.parseDate(newExpDate));
            aa.expiration.editB1Expiration(b1Exp.getB1Expiration());

            logDebug(altId + ": updated CAP expiration to " + newExpDate);
            if (refLic)
            {
                refLic.setLicenseExpirationDate(aa.date.parseDate(newExpDate));
                aa.licenseScript.editRefLicenseProf(refLic);
                logDebug(altId + ": updated License expiration to " + newExpDate);
            }
        }


        if(appTypeString != "Licenses/Business/Tax Receipt/License"){
            if (sendEmailToContactTypes.length > 0 && emailTemplate.length > 0) {
                var conTypeArray = sendEmailToContactTypes.split(",");
                var conArray = getContactArrayCustom(capId);
            
                //logDebug("Have the contactArray");
                for (thisCon in conArray){
                    conEmail = null;
                    b3Contact = conArray[thisCon];
                    
                    if (exists(b3Contact["contactType"],conTypeArray))
                        conEmail = b3Contact["email"];
                        
                    logDebug("Contact Email: " + conEmail);
            
                    if (conEmail) {
                        emailParameters = aa.util.newHashtable();
                        addParameter(emailParameters,"$$altId$$",altId);
                        addParameter(emailParameters,"$$acaUrl$$",acaSite + getACAUrl());
                        addParameter(emailParameters,"$$businessName$$",cap.getSpecialText());
                        addParameter(emailParameters,"$$expirationDate$$",b1ExpDate);
                        addParameter(emailParameters,"$$capType$$", cap.getCapType().getAlias());
            
                        var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());
            
                        var fileNames = [];
            
                        var emlRes = aa.document.sendEmailAndSaveAsDocument(mailFrom,conEmail,"" , emailTemplate, emailParameters, capId4Email, fileNames);
                        if(emlRes.getSuccess()){
                            logDebug(altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
                            logMessage("--> " + altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
                        }
                        else{
                            logDebug("Unable to send email to contact " + b3Contact["contactType"] + " : " + conEmail + ". Error: " + emlRes.getErrorMessage());
                            logMessage("--> Unable to send email to contact " + b3Contact["contactType"] + " : " + conEmail);
                        }
                    }
                    else{
                        logMessage("--> Contact Email is blank, not sending email");
                    }
                }
            }
        }
        
        // schedule Inspection
        if (inspSched.length > 0 && inspSched != null){
            scheduleInspection(inspSched,"1");
            inspId = getScheduledInspId(inspSched);
            if (inspId) autoAssignInspection(inspId);
            //logDebug(altId + ": Scheduled " + inspSched + ", Inspection ID: " + inspId);
        }
        // update CAP status
        if (newAppStatus.length > 0 && newAppStatus != null && newAppStatus != "null"){
            updateAppStatus(newAppStatus, "", capId);
        }

        // create renewal record and add fees
        
        if (createRenewalRecord && createRenewalRecord.substring(0,1).toUpperCase().equals("Y")) {
            if(appTypeString == "Licenses/Business/Tax Receipt/License"){
                logDebug("processing a BTR License");
                logMessage("--> License is a BTR, creating a full renewal and assessing fees.");
                var incompleteRenExists = false;
                var renewalCapProject = getRenewalCapByParentCapID(capId);
                if (renewalCapProject != null) {
                    var capRes = aa.cap.getCap(renewalCapProject.getCapID());
                    var renCapStatus = "";
                    if(capRes.getSuccess()){
                        renCapStatus = capRes.getOutput().getCapStatus();
                    }
                    else{
                        logDebug("WARNING: Unable to get renewal cap status. Err: " + capRes.getErrorMessage());
                    }
                    
                    if(renewalCapProject.getRelationShip() == "Renewal" && (renewalCapProject.getStatus() == "Incomplete" || renCapStatus == "Pending")){
                        logDebug("There is an incomplete renewal in process. Please complete the current renewal first before processing a new one.");
                        logMessage("--> There is an incomplete renewal in process. Please complete the current renewal first before processing a new one.");
                        incompleteRenExists = true;
                    }
                }
                
                if(!incompleteRenExists){
                  logDebug("Creating a new record of type renewal");
                  var renewalCapId = createRecord("Licenses","Business","Tax Receipt","Renewal");
                  if(renewalCapId){
                      var renewalAltId = renewalCapId.getCustomID();
                      logDebug("Created capId " + renewalCapId);
                      logDebug("Created Renewal Record " + renewalAltId);
                      logMessage("--> Created capId " + renewalCapId);
                      logMessage("--> Created Renewal Record " + renewalAltId);
                      var result = aa.cap.createRenewalCap(capId, renewalCapId, false);
                      
                      if(result.getSuccess()){
                            logDebug("Added " + renewalAltId + " as renewal of " + capId.getCustomID());
                            logMessage("--> Added " + renewalAltId + " as renewal of " + capId.getCustomID());
                            setRenewal2Incomplete(renewalCapId);
                            //Copy data fields
                            copyKeyInfo(capId, renewalCapId);
                            //Copy DBA Name
                            editAppName(cap.getSpecialText(), renewalCapId);
                            //Add fees
                            
                            var AInfo = [];
                            loadAppSpecific(AInfo);
                            var BTRTotalLicFee = AInfo['BTR Total License Fee'];
                            var TotalFireFee = AInfo['Total Fire Fees'];
                            var feeSchedule = "BTR_MAIN";
                            var BTR = "BTRYEAR";
                            var Fire = "BTRFIREPERM";
                            var feeAdded = false;
                            if (BTRTotalLicFee && BTRTotalLicFee > 0 && AInfo["Business Type of Organization"] != '501c3 Not for Profit'){
                                var feeAmt = parseFloat(BTRTotalLicFee);
                                if(getAppSpecific("Half Year License Fee", capId) == "CHECKED") feeAmt = feeAmt * 2;
                                
                                addFee(BTR, feeSchedule, 'FINAL', feeAmt, "Y", renewalCapId);
                                feeAdded = true;
                            }
                            
                            if (TotalFireFee && TotalFireFee > 0){
                                addFee(Fire, feeSchedule, 'FINAL', TotalFireFee, "Y", renewalCapId);
                                feeAdded = true;
                            }
                            
                            if(!feeAdded){
                                BTR_Set_Renew_License(renewalCapId);
                                logMessage("-->No Fees were added. Renewal was auto approved.");
                                closeTaskCustom("Receipt Issuance", "Renewed", "Renewed via script on payment", "Renewed via script on payment", renewalCapId);
                                runBusinessTaxReceiptAsync(renewalCapId, "Business Tax Receipt");
                            }
                            
                            if (sendEmailToContactTypes.length > 0 && emailTemplate.length > 0) {
                                var conTypeArray = sendEmailToContactTypes.split(",");
                                var conArray = getContactArrayCustom(capId);
                            
                                //logDebug("Have the contactArray");
                                for (thisCon in conArray){
                                    conEmail = null;
                                    b3Contact = conArray[thisCon];
                                    
                                    if (exists(b3Contact["contactType"],conTypeArray))
                                        conEmail = b3Contact["email"];
                                        
                                    logDebug("Contact Email: " + conEmail);
                                    logMessage("-->Attempting to email contact " + b3Contact["contactType"] + " to email: " + conEmail);
                            
                                    if (conEmail) {
                                        emailParameters = aa.util.newHashtable();
                                        addParameter(emailParameters,"$$altId$$",altId);
                                        addParameter(emailParameters,"$$acaUrl$$",acaSite + getACAUrlCustom(renewalCapId));
                                        addParameter(emailParameters,"$$businessName$$",cap.getSpecialText());
                                        addParameter(emailParameters,"$$expirationDate$$",b1ExpDate);
                                        addParameter(emailParameters,"$$capType$$", cap.getCapType().getAlias());
                            
                                        var capId4Email = aa.cap.createCapIDScriptModel(capId.getID1(),capId.getID2(),capId.getID3());
                            
                                        var fileNames = [];
                            
                                        var emlRes = aa.document.sendEmailAndSaveAsDocument(mailFrom,conEmail,"" , emailTemplate, emailParameters, capId4Email, fileNames);
                                        if(emlRes.getSuccess()){
                                            logDebug(altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
                                            logMessage("--> " + altId + ": Sent Email template " + emailTemplate + " to " + b3Contact["contactType"] + " : " + conEmail);
                                        }
                                        else{
                                            logDebug("Unable to send email to contact " + b3Contact["contactType"] + " : " + conEmail + ". Error: " + emlRes.getErrorMessage());
                                            //logMessage("--> Unable to send email to contact " + b3Contact["contactType"] + " : " + conEmail);
                                        }
                                    }
                                    else{
                                        logMessage("--> Contact Email is blank, not sending email");
                                    }
                                }
                            }
                      }
                      else{
                          logDebug("ERROR adding " + renewalAltId + " as renewal of " + capId.getCustomID() + ". Error: " + result.getErrorMessage());
                      }
                  }
                  else{
                      logDebug("Unable to create renewal record.");
                  }
                }
                
            }
            else{
                logMessage("--> License is not a BTR, creating an incomplete renewal record");
                createResult = aa.cap.createRenewalRecord(capId);
                
                if (!createResult.getSuccess()){
                    logDebug("Could not create renewal record : " + createResult.getErrorMessage());
                    logMessage("--> Could not create renewal record : " + createResult.getErrorMessage());
                }
                else {
                    renewalCapId = createResult.getOutput();
                    logDebug("Created renewal record: " + renewalCapId.getCustomID());
                    renewalCap = aa.cap.getCap(renewalCapId).getOutput();
                    if (renewalCap.isCompleteCap()) {
                        logDebug(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
                        logMessage("--> " + altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
                    }
                    else {          
                        logDebug(altId + ": created Renewal Record " + renewalCapId.getCustomID());
                        logMessage("--> " + altId + ": created Renewal Record " + renewalCapId.getCustomID());
                        
                        //Load app specific info
                        var rAInfo = [];
                        loadAppSpecific(rAInfo, renewalCapId);
                        for(x in rAInfo) aa.print(x + " : " + rAInfo);
                        // add fees 
                       
                        if (feeList.length > 0) {
                            logMessage("--> Adding fees " + feeList);
                            for (var fe in feeList.split(",")){
                                  
                                  var feObj = addFee(feeList.split(",")[fe],feeSched,feePeriod,1,"Y",renewalCapId);
                            }
                        }
                    }
                }
            }
        }
    }

    // update set type and status
    setScriptResult = aa.set.getSetByPK(SetId);
    if (setScriptResult.getSuccess()){
      setScript = setScriptResult.getOutput();
      setScript.setSetStatus("Completed");
      updSet = aa.set.updateSetHeader(setScript).getOutput();
    }
            
    logDebug("Total Records in set: " + SetMemberArray.length);
    logMessage("Total Records in set: " + SetMemberArray.length);
    logDebug("Total Records processed: " + capCount);
    logMessage("Total Records processed: " + capCount);
    
    aa.env.setValue("ScriptReturnCode","0");
    logDebug("Update Set successful - License Renewal Process Script");
    logMessage("Update Set successful - License Renewal Process Script");
    aa.env.setValue("ScriptReturnMessage", message);
    
} 

function getContactArrayCustom(capId){
    // Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
    // optional capid
    var thisCap = capId;

    var cArray = new Array();

    var capContactResult = aa.people.getCapContactByCapID(thisCap);
    if (capContactResult.getSuccess()){
        var capContactArray = capContactResult.getOutput();
        for (yy in capContactArray){
            var aArray = new Array();
            
            aArray["lastName"] = capContactArray[yy].getPeople().lastName;
            aArray["firstName"] = capContactArray[yy].getPeople().firstName;
            aArray["businessName"] = capContactArray[yy].getPeople().businessName;
            aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
            aArray["contactType"] =capContactArray[yy].getPeople().contactType;
            aArray["relation"] = capContactArray[yy].getPeople().relation;
            aArray["phone1"] = capContactArray[yy].getPeople().phone1;
            aArray["phone2"] = capContactArray[yy].getPeople().phone2;
            aArray["phone2countrycode"] = capContactArray[yy].getCapContactModel().getPeople().getPhone2CountryCode();
            aArray["email"] = capContactArray[yy].getCapContactModel().getPeople().getEmail();
            aArray["preferredChannel"] = capContactArray[yy].getCapContactModel().getPreferredChannel();
         
            // var capcontact = capContactArray[yy].getCapContactModel();
            //for (xxx in capcontact) aa.print(capcontact[xxx]);

            var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
            for (xx1 in pa)
                aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
         
            cArray.push(aArray);
        }
    } 
    
    return cArray;
}


function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}

function copyKeyInfo(srcCapId, targetCapId)
{
    //copy ASI infomation
    copyAppSpecificInfo(srcCapId, targetCapId);
    //copy License infomation
    copyLicenseProfessional(srcCapId, targetCapId);
    //copy Address infomation
    //copyAddress(srcCapId, targetCapId);
    //copy AST infomation
    copyAppSpecificTable(srcCapId, targetCapId);
    //copy Parcel infomation
    //copyParcel(srcCapId, targetCapId);
    //copy People infomation
    //copyPeople(srcCapId, targetCapId);
    //copyContactsWithAddress(srcCapId, targetCapId);
    //copy Owner infomation
    copyOwner(srcCapId, targetCapId);
    //Copy CAP condition information
    copyCapCondition(srcCapId, targetCapId);
    //Copy additional info.
    copyAdditionalInfo(srcCapId, targetCapId);
    //Copy Education information.
    copyEducation(srcCapId, targetCapId);
    //Copy Continuing Education information.
    copyContEducation(srcCapId, targetCapId);
    //Copy Examination information.
    copyExamination(srcCapId, targetCapId);
        //Copy documents information
    var currentUserID = aa.env.getValue("CurrentUserID");
    copyRenewCapDocument(srcCapId, targetCapId ,currentUserID);
}

function copyRenewCapDocument(srcCapId, targetCapId,currentUserID)
{
    if(srcCapId != null && targetCapId != null)
    {
        aa.cap.copyRenewCapDocument(srcCapId, targetCapId,currentUserID);
    }
}



function copyEducation(srcCapId, targetCapId)
{
    if(srcCapId != null && targetCapId != null)
    {
        aa.education.copyEducationList(srcCapId, targetCapId);
    }
}

function copyContEducation(srcCapId, targetCapId)
{
    if(srcCapId != null && targetCapId != null)
    {
        aa.continuingEducation.copyContEducationList(srcCapId, targetCapId);
    }
}

function copyExamination(srcCapId, targetCapId)
{
    if(srcCapId != null && targetCapId != null)
    {
        aa.examination.copyExaminationList(srcCapId, targetCapId);
    }
}

function copyAppSpecificInfo(srcCapId, targetCapId)
{
    //1. Get Application Specific Information with source CAPID.
    var  appSpecificInfo = getAppSpecificInfo(srcCapId);
    if (appSpecificInfo == null || appSpecificInfo.length == 0)
    {
        return;
    }
    //2. Set target CAPID to source Specific Information.
    for (loopk in appSpecificInfo)
    {
        var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
        
        sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
        sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
        sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());  
        //3. Edit ASI on target CAP (Copy info from source to target)
        aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
    }
}


function getAppSpecificInfo(capId)
{
    capAppSpecificInfo = null;
    var s_result = aa.appSpecificInfo.getByCapID(capId);
    if(s_result.getSuccess())
    {
        capAppSpecificInfo = s_result.getOutput();
        if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0)
        {
            aa.print("WARNING: no appSpecificInfo on this CAP:" + capId);
            capAppSpecificInfo = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
        capAppSpecificInfo = null;  
    }
    // Return AppSpecificInfoModel[] 
    return capAppSpecificInfo;
}

function copyLicenseProfessional(srcCapId, targetCapId)
{
    //1. Get license professionals with source CAPID.
    var capLicenses = getLicenseProfessional(srcCapId);
    if (capLicenses == null || capLicenses.length == 0)
    {
        return;
    }
    //2. Get license professionals with target CAPID.
    var targetLicenses = getLicenseProfessional(targetCapId);
    //3. Check to see which licProf is matched in both source and target.
    for (loopk in capLicenses)
    {
        sourcelicProfModel = capLicenses[loopk];
        //3.1 Set target CAPID to source lic prof.
        sourcelicProfModel.setCapID(targetCapId);
        targetLicProfModel = null;
        //3.2 Check to see if sourceLicProf exist.
        if (targetLicenses != null && targetLicenses.length > 0)
        {
            for (loop2 in targetLicenses)
            {
                if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2]))
                {
                    targetLicProfModel = targetLicenses[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched licProf model.
        if (targetLicProfModel != null)
        {
            //3.3.1 Copy information from source to target.
            aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
            //3.3.2 Edit licProf with source licProf information. 
            aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
        }
        //3.4 It is new licProf model.
        else
        {
            //3.4.1 Create new license professional.
            aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
        }
    }
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2)
{
    if (licProfScriptModel1 == null || licProfScriptModel2 == null)
    {
        return false;
    }
    if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
        && licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr()))
    {
        return true;
    }
    return  false;
}

function getLicenseProfessional(capId)
{
    capLicenseArr = null;
    var s_result = aa.licenseProfessional.getLicenseProf(capId);
    if(s_result.getSuccess())
    {
        capLicenseArr = s_result.getOutput();
        if (capLicenseArr == null || capLicenseArr.length == 0)
        {
            aa.print("WARNING: no licensed professionals on this CAP:" + capId);
            capLicenseArr = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
        capLicenseArr = null;   
    }
    return capLicenseArr;
}


function copyAddress(srcCapId, targetCapId)
{
    //1. Get address with source CAPID.
    var capAddresses = getAddress(srcCapId);
    if (capAddresses == null || capAddresses.length == 0)
    {
        return;
    }
    //2. Get addresses with target CAPID.
    var targetAddresses = getAddress(targetCapId);
    //3. Check to see which address is matched in both source and target.
    for (loopk in capAddresses)
    {
        sourceAddressfModel = capAddresses[loopk];
        //3.1 Set target CAPID to source address.
        sourceAddressfModel.setCapID(targetCapId);
        targetAddressfModel = null;
        //3.2 Check to see if sourceAddress exist.
        if (targetAddresses != null && targetAddresses.length > 0)
        {
            for (loop2 in targetAddresses)
            {
                if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2]))
                {
                    targetAddressfModel = targetAddresses[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched address model.
        if (targetAddressfModel != null)
        {
        
            //3.3.1 Copy information from source to target.
            aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
            //3.3.2 Edit address with source address information. 
            aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
        }
        //3.4 It is new address model.
        else
        {   
            //3.4.1 Create new address.
            aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
        }
    }
}

function isMatchAddress(addressScriptModel1, addressScriptModel2)
{
    if (addressScriptModel1 == null || addressScriptModel2 == null)
    {
        return false;
    }
    var streetName1 = addressScriptModel1.getStreetName();
    var streetName2 = addressScriptModel2.getStreetName();
    if ((streetName1 == null && streetName2 != null) 
        || (streetName1 != null && streetName2 == null))
    {
        return false;
    }
    if (streetName1 != null && !streetName1.equals(streetName2))
    {
        return false;
    }
    return true;
}

function getAddress(capId)
{
    capAddresses = null;
    var s_result = aa.address.getAddressByCapId(capId);
    if(s_result.getSuccess())
    {
        capAddresses = s_result.getOutput();
        if (capAddresses == null || capAddresses.length == 0)
        {
            aa.print("WARNING: no addresses on this CAP:" + capId);
            capAddresses = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to address: " + s_result.getErrorMessage());
        capAddresses = null;    
    }
    return capAddresses;
}

function copyAppSpecificTable(srcCapId, targetCapId)
{
    var tableNameArray = getTableName(srcCapId);
    if (tableNameArray == null)
    {
        return;
    }
    for (loopk in tableNameArray)
    {
        var tableName = tableNameArray[loopk];
        //1. Get appSpecificTableModel with source CAPID
        var targetAppSpecificTable = getAppSpecificTable(srcCapId,tableName);
        
        //2. Edit AppSpecificTableInfos with target CAPID
        var aSTableModel = null;
        if(targetAppSpecificTable == null)
        {
            return;
        }
        else
        {
            aSTableModel = targetAppSpecificTable.getAppSpecificTableModel();
        }
        aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,
                                targetCapId,
                                null);
    }
    
}

function getTableName(capId)
{
    var tableName = null;
    var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
    if(result.getSuccess())
    {
        tableName = result.getOutput();
        if(tableName!=null)
        {
            return tableName;
        }
    }
    return tableName;
}

function getAppSpecificTable(capId,tableName)
{
    appSpecificTable = null;
    var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(capId,tableName);
    if(s_result.getSuccess())
    {
        appSpecificTable = s_result.getOutput();
        if (appSpecificTable == null || appSpecificTable.length == 0)
        {
            aa.print("WARNING: no appSpecificTable on this CAP:" + capId);
            appSpecificTable = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to appSpecificTable: " + s_result.getErrorMessage());
        appSpecificTable = null;    
    }
    return appSpecificTable;
}

function copyParcel(srcCapId, targetCapId)
{
    //1. Get parcels with source CAPID.
    var copyParcels = getParcel(srcCapId);
    if (copyParcels == null || copyParcels.length == 0)
    {
        return;
    }
    //2. Get parcel with target CAPID.
    var targetParcels = getParcel(targetCapId);
    //3. Check to see which parcel is matched in both source and target.
    for (i = 0; i < copyParcels.size(); i++)
    {
        sourceParcelModel = copyParcels.get(i);
        //3.1 Set target CAPID to source parcel.
        sourceParcelModel.setCapID(targetCapId);
        targetParcelModel = null;
        //3.2 Check to see if sourceParcel exist.
        if (targetParcels != null && targetParcels.size() > 0)
        {
            for (j = 0; j < targetParcels.size(); j++)
            {
                if (isMatchParcel(sourceParcelModel, targetParcels.get(j)))
                {
                    targetParcelModel = targetParcels.get(j);
                    break;
                }
            }
        }
        //3.3 It is a matched parcel model.
        if (targetParcelModel != null)
        {
            //3.3.1 Copy information from source to target.
            var tempCapSourceParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput();
            var tempCapTargetParcel = aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, targetParcelModel).getOutput();
            aa.parcel.copyCapParcelModel(tempCapSourceParcel, tempCapTargetParcel);
            //3.3.2 Edit parcel with sourceparcel. 
            aa.parcel.updateDailyParcelWithAPOAttribute(tempCapTargetParcel);
        }
        //3.4 It is new parcel model.
        else
        {
            //3.4.1 Create new parcel.
            aa.parcel.createCapParcelWithAPOAttribute(aa.parcel.warpCapIdParcelModel2CapParcelModel(targetCapId, sourceParcelModel).getOutput());
        }
    }
}

function isMatchParcel(parcelScriptModel1, parcelScriptModel2)
{
    if (parcelScriptModel1 == null || parcelScriptModel2 == null)
    {
        return false;
    }
    if (parcelScriptModel1.getParcelNumber().equals(parcelScriptModel2.getParcelNumber()))
    {
        return true;
    }
    return  false;
}

function getParcel(capId)
{
    capParcelArr = null;
    var s_result = aa.parcel.getParcelandAttribute(capId, null);
    if(s_result.getSuccess())
    {
        capParcelArr = s_result.getOutput();
        if (capParcelArr == null || capParcelArr.length == 0)
        {
            aa.print("WARNING: no parcel on this CAP:" + capId);
            capParcelArr = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to parcel: " + s_result.getErrorMessage());
        capParcelArr = null;    
    }
    return capParcelArr;
}

function copyPeople(srcCapId, targetCapId)
{
    //1. Get people with source CAPID.
    var capPeoples = getPeople(srcCapId);
    if (capPeoples == null || capPeoples.length == 0)
    {
        return;
    }
    //2. Get people with target CAPID.
    var targetPeople = getPeople(targetCapId);
    //3. Check to see which people is matched in both source and target.
    for (loopk in capPeoples)
    {
        sourcePeopleModel = capPeoples[loopk];
        //3.1 Set target CAPID to source people.
        sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
        targetPeopleModel = null;
        //3.2 Check to see if sourcePeople exist.
        if (targetPeople != null && targetPeople.length > 0)
        {
            for (loop2 in targetPeople)
            {
                if (isMatchPeople(sourcePeopleModel, targetPeople[loop2]))
                {
                    targetPeopleModel = targetPeople[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched people model.
        if (targetPeopleModel != null)
        {
            //3.3.1 Copy information from source to target.
            aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
            //3.3.2 Edit People with source People information. 
            aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
        }
        //3.4 It is new People model.
        else
        {
            //3.4.1 Create new people.
            aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
        }
    }
}

function isMatchPeople(capContactScriptModel, capContactScriptModel2)
{
    if (capContactScriptModel == null || capContactScriptModel2 == null)
    {
        return false;
    }
    var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
    var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
    var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
    var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
    var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
    var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
    var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
    var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();
    if ((contactType1 == null && contactType2 != null) 
        || (contactType1 != null && contactType2 == null))
    {
        return false;
    }
    if (contactType1 != null && !contactType1.equals(contactType2))
    {
        return false;
    }
    if ((firstName1 == null && firstName2 != null) 
        || (firstName1 != null && firstName2 == null))
    {
        return false;
    }
    if (firstName1 != null && !firstName1.equals(firstName2))
    {
        return false;
    }
    if ((lastName1 == null && lastName2 != null) 
        || (lastName1 != null && lastName2 == null))
    {
        return false;
    }
    if (lastName1 != null && !lastName1.equals(lastName2))
    {
        return false;
    }
    if ((fullName1 == null && fullName2 != null) 
        || (fullName1 != null && fullName2 == null))
    {
        return false;
    }
    if (fullName1 != null && !fullName1.equals(fullName2))
    {
        return false;
    }
    return  true;
}

function getPeople(capId)
{
    capPeopleArr = null;
    var s_result = aa.people.getCapContactByCapID(capId);
    if(s_result.getSuccess())
    {
        capPeopleArr = s_result.getOutput();
        if (capPeopleArr == null || capPeopleArr.length == 0)
        {
            aa.print("WARNING: no People on this CAP:" + capId);
            capPeopleArr = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to People: " + s_result.getErrorMessage());
        capPeopleArr = null;    
    }
    return capPeopleArr;
}

function copyOwner(srcCapId, targetCapId)
{
    //1. Get Owners with source CAPID.
    var capOwners = getOwner(srcCapId);
    if (capOwners == null || capOwners.length == 0)
    {
        return;
    }
    //2. Get Owners with target CAPID.
    var targetOwners = getOwner(targetCapId);
    //3. Check to see which owner is matched in both source and target.
    for (loopk in capOwners)
    {
        sourceOwnerModel = capOwners[loopk];
        //3.1 Set target CAPID to source Owner.
        sourceOwnerModel.setCapID(targetCapId);
        targetOwnerModel = null;
        //3.2 Check to see if sourceOwner exist.
        if (targetOwners != null && targetOwners.length > 0)
        {
            for (loop2 in targetOwners)
            {
                if (isMatchOwner(sourceOwnerModel, targetOwners[loop2]))
                {
                    targetOwnerModel = targetOwners[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched owner model.
        if (targetOwnerModel != null)
        {
            //3.3.1 Copy information from source to target.
            aa.owner.copyCapOwnerModel(sourceOwnerModel, targetOwnerModel);
            //3.3.2 Edit owner with source owner information. 
            aa.owner.updateDailyOwnerWithAPOAttribute(targetOwnerModel);
        }
        //3.4 It is new owner model.
        else
        {
            //3.4.1 Create new Owner.
            aa.owner.createCapOwnerWithAPOAttribute(sourceOwnerModel);
        }
    }
}

function isMatchOwner(ownerScriptModel1, ownerScriptModel2)
{
    if (ownerScriptModel1 == null || ownerScriptModel2 == null)
    {
        return false;
    }
    var fullName1 = ownerScriptModel1.getOwnerFullName();
    var fullName2 = ownerScriptModel2.getOwnerFullName();
    if ((fullName1 == null && fullName2 != null) 
        || (fullName1 != null && fullName2 == null))
    {
        return false;
    }
    if (fullName1 != null && !fullName1.equals(fullName2))
    {
        return false;
    }
    return  true;
}

function getOwner(capId)
{
    capOwnerArr = null;
    var s_result = aa.owner.getOwnerByCapId(capId);
    if(s_result.getSuccess())
    {
        capOwnerArr = s_result.getOutput();
        if (capOwnerArr == null || capOwnerArr.length == 0)
        {
            aa.print("WARNING: no Owner on this CAP:" + capId);
            capOwnerArr = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to Owner: " + s_result.getErrorMessage());
        capOwnerArr = null; 
    }
    return capOwnerArr;
}
function copyCapCondition(srcCapId, targetCapId)
{
    //1. Get Cap condition with source CAPID.
    var capConditions = getCapConditionByCapID(srcCapId);
    if (capConditions == null || capConditions.length == 0)
    {
        return;
    }
    //2. Get Cap condition with target CAPID.
    var targetCapConditions = getCapConditionByCapID(targetCapId);
    //3. Check to see which Cap condition is matched in both source and target.
    for (loopk in capConditions)
    {
        sourceCapCondition = capConditions[loopk];
        //3.1 Set target CAPID to source Cap condition.
        sourceCapCondition.setCapID(targetCapId);
        targetCapCondition = null;
        //3.2 Check to see if source Cap condition exist in target CAP. 
        if (targetCapConditions != null && targetCapConditions.length > 0)
        {
            for (loop2 in targetCapConditions)
            {
                if (isMatchCapCondition(sourceCapCondition, targetCapConditions[loop2]))
                {
                    targetCapCondition = targetCapConditions[loop2];
                    break;
                }
            }
        }
        //3.3 It is a matched Cap condition model.
        if (targetCapCondition != null)
        {
            //3.3.1 Copy information from source to target.
            sourceCapCondition.setConditionNumber(targetCapCondition.getConditionNumber());
            //3.3.2 Edit Cap condition with source Cap condition information. 
            aa.capCondition.editCapCondition(sourceCapCondition);
        }
        //3.4 It is new Cap condition model.
        else
        {
            //3.4.1 Create new Cap condition.
            aa.capCondition.createCapCondition(sourceCapCondition);
        }
    }
}

function isMatchCapCondition(capConditionScriptModel1, capConditionScriptModel2)
{
    if (capConditionScriptModel1 == null || capConditionScriptModel2 == null)
    {
        return false;
    }
    var description1 = capConditionScriptModel1.getConditionDescription();
    var description2 = capConditionScriptModel2.getConditionDescription();
    if ((description1 == null && description2 != null) 
        || (description1 != null && description2 == null))
    {
        return false;
    }
    if (description1 != null && !description1.equals(description2))
    {
        return false;
    }
    var conGroup1 = capConditionScriptModel1.getConditionGroup();
    var conGroup2 = capConditionScriptModel2.getConditionGroup();
    if ((conGroup1 == null && conGroup2 != null) 
        || (conGroup1 != null && conGroup2 == null))
    {
        return false;
    }
    if (conGroup1 != null && !conGroup1.equals(conGroup2))
    {
        return false;
    }
    return true;
}

function getCapConditionByCapID(capId)
{
    capConditionScriptModels = null;
    
    var s_result = aa.capCondition.getCapConditions(capId);
    if(s_result.getSuccess())
    {
        capConditionScriptModels = s_result.getOutput();
        if (capConditionScriptModels == null || capConditionScriptModels.length == 0)
        {
            aa.print("WARNING: no cap condition on this CAP:" + capId);
            capConditionScriptModels = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to get cap condition: " + s_result.getErrorMessage());
        capConditionScriptModels = null;    
    }
    return capConditionScriptModels;
}
function copyAdditionalInfo(srcCapId, targetCapId)
{
    //1. Get Additional Information with source CAPID.  (BValuatnScriptModel)
    var  additionalInfo = getAdditionalInfo(srcCapId);
    if (additionalInfo == null)
    {
        return;
    }
    //2. Get CAP detail with source CAPID.
    var  capDetail = getCapDetailByID(srcCapId);
    //3. Set target CAP ID to additional info.
    additionalInfo.setCapID(targetCapId);
    if (capDetail != null)
    {
        capDetail.setCapID(targetCapId);
    }
    //4. Edit or create additional infor for target CAP.
    aa.cap.editAddtInfo(capDetail, additionalInfo);
}

//Return BValuatnScriptModel for additional info.
function getAdditionalInfo(capId)
{
    bvaluatnScriptModel = null;
    var s_result = aa.cap.getBValuatn4AddtInfo(capId);
    if(s_result.getSuccess())
    {
        bvaluatnScriptModel = s_result.getOutput();
        if (bvaluatnScriptModel == null)
        {
            aa.print("WARNING: no additional info on this CAP:" + capId);
            bvaluatnScriptModel = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to get additional info: " + s_result.getErrorMessage());
        bvaluatnScriptModel = null; 
    }
    // Return bvaluatnScriptModel
    return bvaluatnScriptModel;
}

function getCapDetailByID(capId)
{
    capDetailScriptModel = null;
    var s_result = aa.cap.getCapDetail(capId);
    if(s_result.getSuccess())
    {
        capDetailScriptModel = s_result.getOutput();
        if (capDetailScriptModel == null)
        {
            aa.print("WARNING: no cap detail on this CAP:" + capId);
            capDetailScriptModel = null;
        }
    }
    else
    {
        aa.print("ERROR: Failed to get cap detail: " + s_result.getErrorMessage());
        capDetailScriptModel = null;    
    }
    // Return capDetailScriptModel
    return capDetailScriptModel;
}


function getCapId()  
{
    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapIDModel(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
    {
      return s_capResult.getOutput();
    }  
    else 
    {
      aa.print("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
}

// Get partial cap id
function getPartialCapID(capid)
{
    if (capid == null || aa.util.instanceOfString(capid))
    {
        return null;
    }
    //1. Get original partial CAPID  from related CAP table.
    var result = aa.cap.getProjectByChildCapID(capid, "EST", null);
    if(result.getSuccess())
    {
        projectScriptModels = result.getOutput();
        if (projectScriptModels == null || projectScriptModels.length == 0)
        {
            aa.print("ERROR: Failed to get partial CAP with CAPID(" + capid + ")");
            return null;
        }
        //2. Get original partial CAP ID from project Model
        projectScriptModel = projectScriptModels[0];
        return projectScriptModel.getProjectID();
    }  
    else 
    {
        aa.print("ERROR: Failed to get partial CAP by child CAP(" + capid + "): " + result.getErrorMessage());
        return null;
    }
}

function copyContactsWithAddress(pFromCapId, pToCapId)
{
   // Copies all contacts from pFromCapId to pToCapId and includes Contact Address objects
   //
   if (pToCapId == null)
   var vToCapId = capId;
   else
   var vToCapId = pToCapId;

   var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
   var copied = 0;
   if (capContactResult.getSuccess())
   {
      var Contacts = capContactResult.getOutput();
      for (yy in Contacts)
      {
         var newContact = Contacts[yy].getCapContactModel();

         var newPeople = newContact.getPeople();
         // aa.print("Seq " + newPeople.getContactSeqNumber());

         var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
         newContact.setCapID(vToCapId);
         aa.people.createCapContact(newContact);
         newerPeople = newContact.getPeople();
         // contact address copying
         if (addressList)
         {
            for (add in addressList)
            {
               var transactionAddress = false;
               contactAddressModel = addressList[add].getContactAddressModel();
               if (contactAddressModel.getEntityType() == "CAP_CONTACT")
               {
                  transactionAddress = true;
                  contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
               }
               // Commit if transaction contact address
               if(transactionAddress)
               {
                  var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
                  contactAddressModel.setContactAddressPK(newPK);
                  aa.address.createCapContactAddress(vToCapId, contactAddressModel);
               }
               // Commit if reference contact address
               else
               {
                  // build model
                  var Xref = aa.address.createXRefContactAddressModel().getOutput();
                  Xref.setContactAddressModel(contactAddressModel);
                  Xref.setAddressID(addressList[add].getAddressID());
                  Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                  Xref.setEntityType(contactAddressModel.getEntityType());
                  Xref.setCapID(vToCapId);
                  // commit address
                  aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
               }

            }
         }
         // end if
         copied ++ ;
         logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
      }
   }
   else
   {
      logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
      return false;
   }
   return copied;
}

function getACAUrlCustom(){

    // returns the path to the record on ACA.  Needs to be appended to the site

    itemCap = capId;
    if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args
    var acaUrl = "";
    var id1 = itemCap.getID1();
    var id2 = itemCap.getID2();
    var id3 = itemCap.getID3();
    var cap = aa.cap.getCap(itemCap).getOutput().getCapModel();

    acaUrl += "/Cap/CapDetail.aspx?";
    acaUrl += "&Module=" + cap.getModuleName();
    acaUrl += "&TabName=" + cap.getModuleName();
    acaUrl += "&capID1=" + id1 + "&capID2=" + id2 + "&capID3=" + id3;
    acaUrl += "&agencyCode=" + aa.getServiceProviderCode();
    acaUrl += "&IsToShowInspection="
    return acaUrl;
}

function closeTaskCustom(wfstr,wfstat,wfcomment,wfnote, itemCap) // optional process name
    {
    var useProcess = false;
    var processName = "";
    if (arguments.length == 6) 
    {
        processName = arguments[5]; // subprocess
        useProcess = true;
    }

    var workflowResult = aa.workflow.getTaskItems(itemCap, wfstr, processName, null, null, null);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
        { logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }
    
    if (!wfstat) wfstat = "NA";
    
    for (i in wfObj)
    {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
        {
            var dispositionDate = aa.date.getCurrentDate();
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();

            if (useProcess)
                aa.workflow.handleDisposition(itemCap,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
            else
                aa.workflow.handleDisposition(itemCap,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
            
            logMessage("-->Closing Workflow Task: " + wfstr + " with status " + wfstat);
            logDebug("-->Closing Workflow Task: " + wfstr + " with status " + wfstat);
        }           
    }
}
    