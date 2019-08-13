/*------------------------------------------------------------------------------------------------------/
| Program : ACA_CHECK_CUSTOM_LIST_BEFORE.js
| Event   : ACA_Before
|
| Client  : DeLand
| Script# : 
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
var showMessage = false;            // Set to true to see results in popup window
var showDebug = false;              // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false;      // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;     // Use Group name when populating Task Specific Info Values
var cancel = false;
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0;
var startDate = new Date();
var startTime = startDate.getTime();
var message = "";             // Message String
var debug = "";               // Debug String
var br = "<BR>";              // Break Tag

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); 
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 
  useSA = true;   
  SA = bzr.getOutput().getDescription();
  bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 
  if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }
  }
  
if (SA) {
  eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA));
  eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA));
  eval(getScriptText(SAScript,SA));
  }
else {
  eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
  eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
  }

eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName){
  var servProvCode = aa.getServiceProviderCode();
  if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
  vScriptName = vScriptName.toUpperCase();  
  var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
  try {
    var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
    return emseScript.getScriptText() + ""; 
    } catch(err) {
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

var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(), sysDate.getDayOfMonth(), sysDate.getYear(), "");
var AInfo = new Array(); // Create array for tokenized variables

loadAppSpecific4ACA(AInfo);

var currDate = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate())
var currDateTime = currDate.getTime();
showDebug = false;
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
try{
    if (matches(appTypeString, "PublicService/Infrastructure/NA/NA")) {
		
		var invPrcls = validateAdditionalParcels("ADDITIONAL PARCELS", "Parcel Number");
        if(invPrcls.length > 0){
			message += "Invalid parcel number(s): " + invPrcls + ". Please enter the correct parcel number or delete the invalid ones." + br;
			//logDebug("message" +  (message));
		}
    }
    
	cancel = showMessage = message.length > 0;
}
catch(err){
    //showDebug = 3;
    //showMessage = true;
    //comment("Error on pageflow script ACA_CHECK_CUSTOM_LIST_BEFORE. Err: " + err + ". Line Number: " + err.lineNumber + ". Stack: " + err.stack);
    logDebug("Error on pageflow script ACA_CHECK_CUSTOM_LIST_BEFORE. Err: " + err + ". Line number: " + err.lineNumber + ". Stack: " + err.stack);
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
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