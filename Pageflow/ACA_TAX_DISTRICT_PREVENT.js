/*------------------------------------------------------------------------------------------------------/
| Program : ACA_TAX_DISTRICT_PREVENT.js
| Event   : ACA_AfterButton Event
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
var servProvCode = capId.getServiceProviderCode()           // Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var capIDString = capId.getCustomID();        // alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();   // Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();       // Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");      // Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();

var mAInfo = new Array();           // Create array for tokenized variables
//loadParcelAttributes(mAInfo);           // Add parcel attributes
logDebug("loadedParcelAttributes");
logDebug("cancel = " + cancel);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
try 
{
  refParcelNumber = getPrimaryCapParcel(); 
  logDebug("refParcelNumber: " + refParcelNumber);
  
  // get jurisdiction
  var parcelJurisd = getGISInfoByParcel_DELAND(refParcelNumber,"Accela/Accela_Basemap", "Parcels", "TAXDIST");
  logDebug("parcelJurisd: "+parcelJurisd);
  if (parcelJurisd)
    if(parcelJurisd != "012"){
      cancel=true;
      showMessage=true;
      comment("this parcel is not in the City of DeLand City Limits, please see other jurisdiction or select another parcel. " + parcelJurisd); 
    } 
} catch (err) { 
  logDebug("Error on Pageflow script ACA_TAX_DISTRICT_PREVENT. Please contact Administrator. " + err); 
}
logDebug("Finished main loop.");

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0 || debug.substr(0,7) == "**ERROR") {
    logDebug("Found **ERROR");
    showDebug = true;
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
}
else {
    if (cancel) {
        logDebug("Cancel was set to true.");
        aa.env.setValue("ErrorCode", "-2");
    if (showMessage)
      if (showMessage) aa.env.setValue("ErrorMessage", message);
        
    if (showDebug)
      if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
    else {
    logDebug("Success");
        aa.env.setValue("ErrorCode", "0");
    if (showMessage)
      if (showMessage) aa.env.setValue("ErrorMessage", message);
    
    if (showDebug)
      if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}
logDebug("Sending email.");
aa.sendEmail("DoNotReply@DeLand.gov", "clb@byrnesoftware.com", "", "ACA PROD - Tax District Prevent", "Message: " + message + " Debug: " + debug, null);

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/


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
      var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-0.1", distanceType, buf);

      if (bufchk.getSuccess())
        var proxArr = bufchk.getOutput();
      else
        { logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }  
      
      for (a2 in proxArr)
      {
        logDebug("ProxArr: " + proxArr[a2]);
        var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
        logDebug("ProxObj: " + proxObj);

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

/*------------------------------------------------------------------------------------------------------/
| Custom Functions (End)
/------------------------------------------------------------------------------------------------------*/