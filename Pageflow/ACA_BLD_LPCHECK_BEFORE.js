/*------------------------------------------------------------------------------------------------------/
| Program : ACA_BLD_LPCheck_Before.js
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