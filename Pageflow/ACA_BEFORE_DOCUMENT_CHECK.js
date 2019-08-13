/*------------------------------------------------------------------------------------------------------/
| Program : ACA_BEFORE_DOCUMENT_CHECK.js
| Event   : ACA_BeforeButton Event
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var showDebug = false; // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; // Use Group name when populating Task Specific Info Values
var cancel = false;
var useCustomScriptFile = true; // if true, use Events->Custom Script, else use Events->Scripts->INCLUDES_CUSTOM
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag

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
    eval(getScriptText(SAScript, SA));
} else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, useCustomScriptFile));
}

eval(getScriptText("INCLUDES_CUSTOM", null, useCustomScriptFile));

function getScriptText(vScriptName, servProvCode, useProductScripts) {
    if (!servProvCode)
        servProvCode = aa.getServiceProviderCode();
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

var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var servProvCode = capId.getServiceProviderCode() // Service Provider Code
    var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) {
    currentUserID = "ADMIN";
    publicUser = true
} // ignore public users
var capIDString = capId.getCustomID(); // alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput(); // Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/"); // Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
    if (currentUserGroupObj)
        currentUserGroup = currentUserGroupObj.getGroupName();
    var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var under5000 = 0;
var over5000 = 0;
var AInfo = new Array(); // Create array for tokenized variables
var busCert = null;
loadAppSpecific4ACA(AInfo);

if(appTypeString == "Licenses/Business/Tax Receipt/Change"){
    
    if(AInfo["Type of Change"] == "Business Name Change"){
        if(!docCheck("Fictitious Names") && !docCheck("Articles of Incorporation")) message += "You must upload the appropriate document to category 'Fictitious Names' or 'Articles of Incorporation'";
    }
}

if(appTypeString == "Licenses/Business/Tax Receipt/Application" || appTypeString == "Licenses/Business/Tax Receipt/Renewal"){
    if(AInfo["Business Type of Organization"] == "501c3 Not for Profit"){
        if(!docCheck("501C3")) message += "You must upload the appropriate document to category '501C3'" + br;
    }
}

cancel = showMessage = message.length > 0;

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0 || debug.substr(0, 7) == "**ERROR") {
    showDebug = true;
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
} else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage)
            aa.env.setValue("ErrorMessage", message);
        if (showDebug)
            aa.env.setValue("ErrorMessage", debug);
    } else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage)
            aa.env.setValue("ErrorMessage", message);
        if (showDebug)
            aa.env.setValue("ErrorMessage", debug);
    }
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
// check if document available or not at ACA.
function docCheck(docName) {
    try {
        var docAttached = false;

        if (publicUser) // HANDLE ACA PAGEFLOW
        {
            var cap = aa.env.getValue('CapModel');
            var currentCapId = cap.getCapID();
            var pcapIdString = currentCapId.getID1() + "-" + currentCapId.getID2() + "-" + currentCapId.getID3();

            var acaDocResult = getAcaDocumentList(pcapIdString);
            logDebug("Document Result:" + acaDocResult.size());

            if (acaDocResult.size() > 0) {
                acaDocResult = acaDocResult.toArray();
                docAttached = checkForUploadedDocumentACA(acaDocResult, docName);
            }
        }
        return docAttached;
    } catch (error) {
        cancel = true;
        showMessage = true;
        comment(error.message);

        if (cap == null) {
            comment("An error occurred while retrieving the cap");
        } else {
            comment("An error occurred while retrieving the document array");
        }
        return false;
    }
}

function getAcaDocumentList(pTempCapId) {
    if (pTempCapId == null || pTempCapId == "") {
        logDebug("Error in function getAcaDocumentList");
        return null;
    }
    var docResult = aa.document.getDocumentListByEntity(pTempCapId, "TMP_CAP");
    if (!docResult.getSuccess()) {
        logDebug("Could not retrieve documents in function getAcaDocumentList.");
        return null;
    }
    else
        return docResult.getOutput();

}


function checkForUploadedDocumentACA(pacaDocResult, docName) {
    var bFound = false;
    var docTotal = 0;
    // Loop all the documents
    for (var counter in pacaDocResult) {
        var fvDocument = pacaDocResult[counter];
        // Check to see document exists
        if (fvDocument.getDocCategory().equals(docName)) {
            bFound = true;
            break;
        }
    }

    return bFound;
}

/*------------------------------------------------------------------------------------------------------/
| Custom Functions (End)
/------------------------------------------------------------------------------------------------------*/