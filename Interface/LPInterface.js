/* TESTING VALUES
aa.env.setValue("filePath", "c:\\temp");
aa.env.setValue("ftpSite", "ftp.deland.org");
aa.env.setValue("ftpUser", "Accela");
aa.env.setValue("ftpPass", "Acc3!aftp");
aa.env.setValue("ftpPort", "21");
aa.env.setValue("ftpDirectory", "LicensedProfessionals");

*/

var SCRIPT_VERSION = "2.0";

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

overRide = "function logDebug(dstr) { aa.print(dstr); } function logMessage(dstr) { aa.print(dstr); }";
eval(overRide);

function getScriptText(vScriptName){
                vScriptName = vScriptName.toUpperCase();
                var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
                var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
                return emseScript.getScriptText() + "";
}
var filePath = aa.env.getValue("filePath");
var ftpSite =  aa.env.getValue("ftpSite");
var ftpUser = aa.env.getValue("ftpUser");
var ftpPass = aa.env.getValue("ftpPass");
var ftpPort = aa.env.getValue("ftpPort");
var ftpDirectory = aa.env.getValue("ftpDirectory");
var fileNamePrefix = aa.env.getValue("fileNamePrefix");
var fileName = fileNamePrefix;

var maxSeconds = 600 * 30;
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"");
var startTime = new Date();
var currentUserID = "ADMIN";
var systemUserObj = null;  							// Current User Object
var currentUserGroup = null;						// Current User Group
var publicUserID = null;
var publicUser = false;
if(currentUserID != null){
	systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
}

var useAppSpecificGroupName = false;
var infoLog = [];
var warningLog = [];
var errorLog = [];
var content = [];

var today = new Date();
var batchJobName = "LPInterface";
var totalRowsProcessed = 0;
var totalFailed = 0;
try {

    fileName = "contractors.csv";
    if (getFileFromSite(fileName)) {
        docString = openDocument(filePath + "\\" + fileName);
        if (docString) {
            if (docString.hasNext()) {	
                while (docString.hasNextLine()) {
                    if (elapsed() > maxSeconds) { // only continue if time hasn't expired
                        logDebug("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
                        timeExpired = true ;
                        break; 
                    }          
                    line = docString.nextLine();
                    try { 
                        processLine(String(line));
                    }
                    catch (err) {
                        logDebug("Error: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
                        totalFailed++;
                        // keep going
                    }
                    //if (totalRowsProcessed == 3) break; //TESTING
                }
            }
            else {
                logDebug("No data found to process");
            }
            docString.close();
            aa.util.deleteFile(filePath + "\\" + fileName);
        }
        else {
            logDebug("Error retrieving file");
        }
    }
    else { logDebug("Exception getting file"); }

    logDebug("Processed " + totalRowsProcessed + " licensed professionals records");
    aa.env.setValue("success", true);
    aa.env.setValue("message", "Interface executed successfully");
    if (content) {
    	aa.env.setValue("content", buildResultStructure(content));
		//logDebug("Output content ..... ");
		//logDebug(buildResultStructure(content));
    } else {
        aa.env.setValue("content", "");
    }
    if (infoLog) {
        aa.env.setValue("info", buildResultStructure(infoLog));
    } else {
        aa.env.setValue("info", []);
    }
    if (warningLog) {
        aa.env.setValue("warning", buildResultStructure(warningLog));
    } else {
        aa.env.setValue("warning", []);
    }
    if (errorLog) {
        aa.env.setValue("error", buildResultStructure(errorLog));
    } else {
        aa.env.setValue("error", []);
    }
	aa.env.setValue("ScriptReturnCode", "0");
} catch (e) {
    logDebug(e)
    aa.env.setValue("success", false);
    aa.env.setValue("message", String(e));
    aa.env.setValue("ScriptReturnCode", "0");
}

function processLine(line) {
    updating = false;
    if (line == "") return;     // empty line in input
    if (line.indexOf("VolNbr") == 0)   return; // header line
    totalRowsProcessed++;
    line = line.replace(/","/g, "|");
    pieces = line.split("|");
	if (pieces.length != 26) {
		logDebug("Error: Incorrect Line Format In " + batchJobName + " Input Line " + totalRowsProcessed);
        totalFailed++;
    }
    licenseNbr = pieces[1].toString().replace(/"/g, "");
    if (licenseNbr == "") {
        logDebug("No license number for entry " + line);
        return;
    }
    logDebug("Processing license number = " + licenseNbr);
    conType = pieces[3].toString();
    conType = conType.replace(/"/g, "");
    conType = conType.trim();
    aa.print(conType);
    switch ("" + conType) {
        case "ARCHITECT":
        case "ENGINEER":
        case "LAND SURVEYOR":
        case "ENGINEER BUSINESS": 
        case "ARCHTECT BUSINESS":
        case "ARCHITECT CORP & PARTNERSHIP":
            licenseType = "Professional";
            var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
            var ds = initialContext.lookup("java:/AA");
            var conn = ds.getConnection();     
            var updateString = "update rstate_lic set lic_type = 'Professional' where serv_prov_code = 'DELAND' and lic_nbr = ?";
            var uStmt = conn.prepareStatement(updateString);
            uStmt.setString(1, "" + licenseNbr);
            uStmt.execute();
            uStmt.close();
            conn.close();
            break;
        default : licenseType = "Contractor"; break;
    }
    logDebug("License Type = " + conType);
    var newLic = getRefLicenseProf(licenseNbr,conType);
    if (newLic) {
        updating = true;
        logDebug("Updating existing Ref Lic Prof : " + licenseNbr);
    }
    else {
        newLic = aa.licenseScript.createLicenseScriptModel();
    }
    newLic.setBusinessName2(conType);
    name = pieces[19].toString().replace(/"/g, "");
    if (name != "") newLic.setContactLastName(name);
    bName = pieces[7].toString().replace(/"/g, "");
    if (bName != "") newLic.setBusinessName(bName);
    addr1 = pieces[8].toString().replace(/"/g, "");
    newLic.setAddress2(addr1);
    addr2 = pieces[9].toString().replace(/"/g, "");
    newLic.setAddress1(addr2); 
    city = pieces[10].toString().replace(/"/g, "");  
    if (city != "") newLic.setCity(city);   
    state = pieces[11].toString().replace(/"/g, "");  
    if (state != "") newLic.setState(state);   
    zip = pieces[12].toString().replace(/"/g, "");  
    if (zip != "") newLic.setZip(zip);   
    ph1 = pieces[13].toString().replace(/"/g, "");  
    if (ph1 != "") newLic.setPhone1(ph1);   
    ph2 = pieces[14].toString().replace(/"/g, "");  
    if (ph2 != "") newLic.setPhone2(ph2);  
    eMail = pieces[16].toString().replace(/"/g, "");  
    if (eMail != "") newLic.setEMailAddress(eMail.trim());    
    newLic.setAgencyCode(aa.getServiceProviderCode());
    newLic.setAuditDate(sysDate);
    newLic.setAuditID(currentUserID);
    newLic.setAuditStatus("A");
    insExpDate = pieces[24].toString().replace(/"/g, "");  
    if (insExpDate != "") newLic.setInsuranceExpDate(aa.date.parseDate(insExpDate));  
    wcExpDate = pieces[20].toString().replace(/"/g, "");  
    if (wcExpDate != "") newLic.setWcExpDate(aa.date.parseDate(wcExpDate));
    wc = pieces[21].toString().replace(/"/g, "");
    if (wc == "Exempted") newLic.setWcExempt("Y"); else newLic.setWcExempt("N");
     newLic.setLicenseType(licenseType);
     newLic.setLicState("FL");
     newLic.setCountry("United States");
     newLic.setCountryCode("US");
     newLic.setStateLicense(licenseNbr);
     expDate = pieces[4].toString();
     licStatus = pieces[6].toString();
     if (licStatus == "Not Current") newLic.setAuditStatus("I");
     newLic.setLicenseExpirationDate(aa.date.parseDate(expDate));
 
    if (updating)
        myResult = aa.licenseScript.editRefLicenseProf(newLic);
    else
        myResult = aa.licenseScript.createRefLicenseProf(newLic);
 
    if (myResult.getSuccess()) {
        logDebug("Successfully added/updated License No. " + licenseNbr + ", Type: " + licenseType);
        return true;
    }
    else {
         logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
         return false;
    }  
}

function doesArrayHaveKey(key, arr) {
    for (var x in arr)  {
        if (x ==key) return true;
    }
    return false;
}

function currencyFormat (num) {
    return "" + num.toFixed(2);
}

function zeroLeftPad(stw,noz)
	{
	if (stw == null) { stw = "" }
	var workstr = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" + stw;
	return String(workstr).substring(workstr.length,workstr.length - noz);
	}

function elapsed()
{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function param(param, isRequired) {
    var val = aa.env.getValue(param);
    if (!val || String(val) == "") {
        if (isRequired) {
            throw "Missing required parameter " + param;
        }
        val = "";
    }
    return val;
}

function formatDate(date) {
    if (date.getClass()) {
        if (date.getClass().toString().equals("class com.accela.aa.emse.util.ScriptDateTime")) {
            return date.getYear() + "-" + (date.getMonth() < 10 ? "0" : "") + date.getMonth() + "-" + (date.getDayOfMonth() < 10 ? "0" : "") + date.getDayOfMonth();
        } else if (date.getClass().toString().equals("class java.sql.Timestamp")) {
            return (date.getYear() + 1900) + "-" + (date.getMonth() < 10 ? "0" : "") + date.getMonth() + "-" + (date.getDate() < 10 ? "0" : "") + date.getDate();
        }
    }
    return "";
}

function arrayToString(arr) {
    return "[" + (arr ? arr.join("|") : "") + "]";
}
// returns the result as proper JSON structure when called by construct API
function buildResultStructure(value) {
    if (value) {
        if (Object.prototype.toString.call(value) == "[object Object]") {
            value = buildObjectStructure(value);
        } else if (Object.prototype.toString.call(value) === '[object Array]') {
            value = buildArrayStructure(value);
        }
    }
    return value;
}

function buildObjectStructure(obj) {
    var table = aa.util.newHashMap();
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            var value = obj[p];
            table.put(obj[p], buildResultStructure(value));
        }
    }
    return obj;
}

function buildArrayStructure(arr) {
    var arrList = aa.util.newArrayList();
    for (var i = 0; i < arr.length; i++) {
        arrList.add(buildResultStructure(arr[i]));
    }
    return arrList;
}

function logInfo(s) {
    aa.print("INFO: " + s);
    infoLog.push(s);
}

function logWarning(s) {
    aa.print("WARNING: " + s);
    warningLog.push(s);
}

function logError(s) {
    aa.print("ERROR: " + s);
    errorLog.push(s);
}

function stringifyJSType(value) {
    if (value) {
        // Java object
        if (value.getClass) {
            value = String(value);
        } else if (typeof value == "object") {
            value = stringifyObject(value);
        } else if (Object.prototype.toString.call(value) === '[object Array]') {
            value = stringifyArray(value);
        }
    }
    return value;
}

function stringifyObject(obj) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            var value = obj[p];
            // get Java objects toString representation
            obj[p] = stringifyJSType(value);
        }
    }
    return obj;
}

function stringifyArray(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = stringifyJSType(arr[i]);
    }
}


function sendFileToSite(dataString, fileName) {
    fileName += ".csv";
    logDebug("Creating file " + filePath + "\\" + fileName);
    filehandle = aa.util.writeToFile(dataString, filePath + "\\" + fileName);
    if (filehandle) {
        ftpResult = aa.util.ftpUpload(ftpSite, ftpPort, ftpUser, ftpPass, ftpDirectory, filehandle);
        if (ftpResult.getSuccess()) {
            logDebug("Successfully transferred file to " + ftpSite);
        } else {
            logDebug("Error transferring file " + ftpResult.getErrorMessage());
        }
        aa.util.deleteFile(filePath + "\\" + fileName);
        logDebug("Deleted temp file");
    }
}

function getFileFromSite(fileName) {
    logDebug("Getting " + fileName + " from site");
    var ftpClient = null;
    try {
        ftpClient = new Packages.org.apache.commons.net.ftp.FTPClient;
        ftpClient.connect(ftpSite);
        ftpClient.login(ftpUser, ftpPass);
        if (ftpDirectory != "") ftpClient.changeWorkingDirectory(ftpDirectory);
        ftpClient.setFileType(2); //binary
        ftpClient.setFileTransferMode(2); //binary
        ftpClient.enterLocalActiveMode();
        fout = new java.io.FileOutputStream(filePath + "\\" + fileName);
        ftpClient.retrieveFile(fileName, fout);
        fout.flush();
        fout.close();
        ftpClient.logout();
        ftpClient.disconnect();
    }
    catch (err) {
        logDebug("Error getting file: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
        return false;
    } 
    return true;
}


function getRefLicenseProf(refstlic,licenseType)
	{
	var refLicObj = null;
	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(),refstlic);
	if (!refLicenseResult.getSuccess())
		{ logDebug("**ERROR retrieving Ref Lic Profs : " + refLicenseResult.getErrorMessage()); return false; }
	else
		{
		var newLicArray = refLicenseResult.getOutput();
		if (!newLicArray) return null;
		for (var thisLic in newLicArray)
			if(!matches(licenseType,null,undefined,"")){
				if (refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()) && 
					licenseType.toUpperCase().equals(newLicArray[thisLic].getLicenseType().toUpperCase()))
					refLicObj = newLicArray[thisLic];
			}
			else if (refstlic && newLicArray[thisLic] && refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()))
				refLicObj = newLicArray[thisLic];
		}

	return refLicObj;
    }
    
function openDocument(docFilePath) {
    logDebug("Opening " + docFilePath);
	try
		{
			var file = new java.io.File(docFilePath);   
			var fin = new java.io.FileInputStream(file);
			var vstrin = new java.util.Scanner(fin).useDelimiter(",");
			return (vstrin);
		}
	catch (err)
		{
			logDebug("Error reading CSV document: " + err.message);
			return null;
		}
}  
