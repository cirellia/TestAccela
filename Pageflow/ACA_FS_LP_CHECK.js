/*------------------------------------------------------------------------------------------------------/
| Program : ACA_BLD_LPCheck_Before2.js
| Event   : ACA_Before
|
| Client  : DeLand
| Script# : 6 --> Required Documents
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
  eval(getScriptText(SAScript,SA));
  }
else {
  eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
  }
  
//eval(getScriptText("INCLUDES_CUSTOM"));

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
var under5000 = 0;
var over5000 = 0;
var AInfo = new Array(); // Create array for tokenized variables

loadAppSpecific4ACA(AInfo);

var currDate = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate())
var currDateTime = currDate.getTime();

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

var ownerBuilder = AInfo["Owner Builder"];
try{
 
        script26_validateLicensedProf(capId);
  
    
}
catch(err){
    showDebug = 3;
    showMessage = true;
    comment("Error on pageflow script ACA_BLDcontactAndLPInfoCheck_Before. Err: " + err);
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
}
else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
    else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function script26_validateLicensedProf(capId) {
    logDebug("script26_validateLicensedProf() started");
    try {
        var arrLicProfType = new Array();
        var licProfList = cap.getLicenseProfessionalList();
       
        if (licProfList){
           ;
        }
        else{
            cancel=true;
            showMessage = true;
            comment("Please add a licensed professional.");
        }
            
    }
    catch (err) {
        showMessage = true;
        comment(br + "Error on function script26_validateLicensedProf(). Err: " + err);
    }
    logDebug("script26_validateLicensedProf() ended");
}//END script26_validateLicensedProf()