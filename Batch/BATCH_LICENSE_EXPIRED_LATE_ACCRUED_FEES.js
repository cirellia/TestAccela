/* ------------------------------------------------------------------------------------------------------ /
| Program : BATCH_LICENSE_EXPIRED_LATE_ACCRUED_FEES Trigger : Batch
|
| - Set the workflow to expired if the expiration date has passed.
|
| Batch Requirements :
| - None
| Batch Options:
| - NO PARAMS - All Licenses Types
| - LicenseType
| - LicenseSubType
|
|
/ ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0;

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

showDebug = false;
showMessage = false;
var br = "<br>";

var sysDate = aa.date.getCurrentDate();
// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer
var timeExpired = false;

// need to set this flag again because it somehow gets reset from above.
showDebug = false;

// Get the parameters in case they were provided for specific license types or specific expiration date to look ahead
var licenseTypeParam = "Business"; //getParam("LicenseType");
var licenseSubtypeParam = "Tax Receipt"; //getParam("LicenseSubType");

var appGroup = "Licenses";
var appType = "Business"; //null;
var appSubType = "Tax Receipt"; //null;
var appCategory = "License";

//var busCompCertCategory = "Certificate";

var tmpDate = new Date();
var currDate = new Date(tmpDate.getFullYear(), tmpDate.getMonth(), tmpDate.getDate());
var year = currDate.getFullYear();
var month = currDate.getMonth()+1;
var day = currDate.getDate();
var licsResult;
var lics;
var totalLics = 0;
var totalLicsNotProcessed = 0;
var missingExpDetails = 0;
var capId;
var cap;
var altId;
var b1ExpResult;
var lic;
var licExpDate;
var cap = null;
var capResult = null;
var appTypeString = null;
var appTypeArray = null;
var emailParameters;
var emailFrom = "Auto_Sender@Accela.com";
var emailTo;
var emailTemplate = "BTR EXPIRED";//getParam("emailTemplate");
var expDate = new Date();
var runDate = new Date();
//runDate.setMonth(); //set expiration month to September
//runDate.setDate(1); //set expiration date to 30
var runDateString = runDate.getMonth() + "/" + runDate.getDate() + "/" + runDate.getFullYear(); 
var AInfo = new Array(); // Create array for tokenized variables

/* -------------- /
| main  process
/ -------------- */
try {

        //Check if parameters were provided via Batch configuration
        if ((licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "") &&
            (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "")) {
            logDebug("License Type not set via parameter. Working on all licenses" + br);
        }
        else if ((licenseTypeParam != null || licenseTypeParam != "undefined" || licenseTypeParam != "") &&
                (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "")) {
                logDebug("License Sub Type not set via parameter. Working on " + licenseTypeParam + " licenses" + br);
                appType = licenseTypeParam;
        }
        else if ((licenseTypeParam != null || licenseTypeParam != "undefined" || licenseTypeParam != "") &&
                (licenseSubtypeParam != null || licenseSubtypeParam != "undefined" || licenseSubtypeParam != "")) {
                logDebug("License Type and subtype set via parameter. Working on " + licenseTypeParam + "/" + licenseSubtypeParam + " licenses " + br);
                appType = licenseTypeParam;
                appSubType = licenseSubtypeParam;
        }
        else if ((licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "") &&
                (licenseSubtypeParam != null || licenseSubtypeParam != "undefined" || licenseSubtypeParam != "")) {
                logDebug("License Sub Type not set via parameter. Working on */" + licenseSubtypeParam + br);
                appSubType = licenseSubtypeParam;
        }

        //licsResult = aa.cap.getByAppType(appGroup, appType, appSubType, appCategory);
        //Creating cap model of the required type
        var emptyCm1 = aa.cap.getCapModel().getOutput();
        var emptyCt1 = emptyCm1.getCapType();
        emptyCt1.setGroup(appGroup);
        emptyCt1.setType(appType);
        emptyCt1.setSubType(appSubType);
        emptyCt1.setCategory(appCategory);
        emptyCm1.setCapStatus("About to Expire");
        emptyCm1.setCapType(emptyCt1);

        //Accessing all the records of the given type
        var vCapListResult = aa.cap.getCapIDListByCapModel(emptyCm1);
        if (vCapListResult.getSuccess()) {
            vCapList = vCapListResult.getOutput();
        }
        else{
            logDebug("WARNING: Unable to get the list for BTR Licenses.");
        }            
            

        if (vCapList) {
            for (i in vCapList) {
                
                capId = aa.cap.getCapID(vCapList[i].getCapID().getID1(), vCapList[i].getCapID().getID2(), vCapList[i].getCapID().getID3()).getOutput();
                cap = aa.cap.getCap(capId).getOutput();
                var appTypeAlias = cap.getCapType().getAlias(); 
                var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
                altId = capId.getCustomID();
                loadAppSpecific(AInfo, capId); // Add AppSpecific Info
                capResult = aa.cap.getCap(capId);
                if (capResult.getSuccess()){
                    cap = capResult.getOutput();
                    appTypeString = cap.getCapType().toString();
                    appTypeArray = appTypeString.split("/");
                }
                else
                    logDebug("WARNING: Unable to get cap for " + altId + br);

                logDebug("capId : " + capId + " altId : " + altId);
                

                if(runDateString == "9/1/" + currDate.getFullYear()){
                    var BTRTotFee = AInfo["BTR Total License Fee"];
                    var lateFeeAccrued = AInfo["Late Fees Accrued"];
                    if(lateFeeAccrued == null || lateFeeAccrued == "" || lateFeeAccrued == undefined) { lateFeeAccrued = 0; }

                    if(BTRTotFee > 0 ) { 
                        var tmpTotal = (parseFloat(BTRTotFee) * .10);
                        var totalAmount = parseFloat(lateFeeAccrued) + parseFloat(tmpTotal);
                        editAppSpecific("Late Fees Accrued", totalAmount);
                    }
                }
                
                if(runDateString == "10/1/" + currDate.getFullYear()){
                    var BTRTotFee = AInfo["BTR Total License Fee"];
                    var lateFeeAccrued = AInfo["Late Fees Accrued"];
                    if(lateFeeAccrued == null || lateFeeAccrued == "" || lateFeeAccrued == undefined) { lateFeeAccrued = 0; }
                    
                    if(BTRTotFee > 0 ) { 
                        var tmpTotal = (parseFloat(BTRTotFee) * .05);
                        var totalAmount = parseFloat(lateFeeAccrued) + parseFloat(tmpTotal);
                        editAppSpecific("Late Fees Accrued", totalAmount);
                        
                    }
                }
                    
                if(runDateString == "11/1/" + currDate.getFullYear()){
                    var BTRTotFee = AInfo["BTR Total License Fee"];
                    var lateFeeAccrued = AInfo["Late Fees Accrued"];
                    if(lateFeeAccrued == null || lateFeeAccrued == "" || lateFeeAccrued == undefined) { lateFeeAccrued = 0; }
                    
                    if(BTRTotFee > 0 ) { 
                        var tmpTotal = (parseFloat(BTRTotFee) * .05);
                        var totalAmount = parseFloat(lateFeeAccrued) + parseFloat(tmpTotal);
                        editAppSpecific("Late Fees Accrued", totalAmount);
                        
                    }
                }    

                if(runDateString == "0/1/" + currDate.getFullYear()){
                    var BTRTotFee = AInfo["BTR Total License Fee"];
                    var lateFeeAccrued = AInfo["Late Fees Accrued"];
                    if(lateFeeAccrued == null || lateFeeAccrued == "" || lateFeeAccrued == undefined) { lateFeeAccrued = 0; }
                    
                    if(BTRTotFee > 0 ) { 
                        var tmpTotal = (parseFloat(BTRTotFee) * .05);
                        var totalAmount = parseFloat(lateFeeAccrued) + parseFloat(tmpTotal);
                        editAppSpecific("Late Fees Accrued", totalAmount);
                        
                    }
                }

                if(runDateString == "1/1/" + currDate.getFullYear()){                                       
                    editAppSpecific("Expired with Penalty", "CHECKED");      
                             
                }

                //get capID Address
                adrResult = aa.address.getAddressByCapId(capId);
                if (adrResult.getSuccess()) { adr = adrResult.getOutput(); }
                if (adr) { locationAddress = adr[0]; }

                //Email Applicant
                var contact = getContactByTypeAA("Business Owner", capId);
                emailTo = contact.email; logDebug("test: " + emailTo);
                var emailParameters = aa.util.newHashtable();
                emailParameters.put("$$email$$", emailTo);
                emailParameters.put("$$CAPID$$", altId);
                emailParameters.put("$$CAPNAME$$", appTypeAlias);
                emailParameters.put("$$CAPCADDR$$", locationAddress);
                //emailParameters.put("$$expirationDate$$", licExpDateString);
                emailTo = "mag@byrnesoftware.com"; //USED FOR TESTING
                var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
                var sendNotificationResult = null;
                sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, "", emailTemplate, emailParameters, capIDScriptModel, null);
                if (sendNotificationResult.getSuccess()) logDebug("  ---> Notification sent to " + emailTo + " for license " + altId);
                    totalLics++;
                //END Email Applicant
                
            }
        }
        else{
            logDebug("****ERROR: unable to get the licenses." + br)
        }      
    
    

    logDebug("_______________________________________________________________________________" + br);
    logDebug("Total Licenses missing expiration details   : " + missingExpDetails + br);
    logDebug("Total Licenses                              : " + totalLics + br);
    logDebug("_______________________________________________________________________________" + br);
    logDebug("Run Time: " + elapsed() + br);
}
catch (ex) {
    logDebug("ERROR Executing BATCH_LICENSE_EXPIRED_LATE_ACCRUED_FEES, exception caught: " + ex.message);
}

/* ------------------------------------------------------------------------------------------------------ /
| Internal Functions and Classes (Used by this script)
/ ------------------------------------------------------------------------------------------------------ */
function getParam(pParamName) // gets parameter value and logs message showing param value
{
    var ret = "" + aa.env.getValue(pParamName);
    logDebug("PARAMETER " + pParamName + " = " + ret + br);
    return ret;
}

function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - batchStartTime) / 1000)
}

function updateAppStatus2(stat,cmt) // optional cap id
{
    var itemCap = capId;
    if (arguments.length == 3) 
        itemCap = arguments[2]; // use cap ID specified in args

    var updateStatusResult = aa.cap.updateAppStatus(itemCap, "APPLICATION", stat, sysDate, cmt, systemUserObj);
    if (updateStatusResult.getSuccess())
        logDebug("Updated application status to " + stat + " successfully.");
    else
        logDebug("**ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
}

//get contact by contact type for given capId
function getContactByTypeAA(conType, capId) {
    var contactArray = getPeople(capId);
    for (thisContact in contactArray) {
        if ((contactArray[thisContact].getCapContactModel().getContactType()).toUpperCase() == conType.toUpperCase())
            return contactArray[thisContact].getCapContactModel();
    }
    return false;
}