/* TESTING VALUES
aa.env.setValue("filePath", "c:\\temp");
aa.env.setValue("ftpSite", "ftp.deland.org");
aa.env.setValue("ftpUser", "Accela");
aa.env.setValue("ftpPass", "Acc3!aftp");
aa.env.setValue("ftpPort", "21");
aa.env.setValue("ftpDirectory", "");
aa.env.setValue("fileNamePrefix", "ACCELASB");
aa.env.setValue("startDate", "");
aa.env.setValue("startTime", "");
aa.env.setValue("endDate", "");
aa.env.setValue("endTime", "");
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

var maxSeconds = 60 * 30;
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

var today = new Date();
try {
	startDate = aa.env.getValue("startDate");
	if (!startDate || startDate == "") {
		startDateStr = dateAdd(null, -1);
        startDate = new Date(startDateStr);
	}
	else {
		startDate = new Date(startDate);
    }
    endDate = aa.env.getValue("endDate");
	if (!endDate || endDate == "") {
		endDateStr = dateAdd(null, 0);
        endDate = new Date(endDateStr);
	}
	else {
		endDate = new Date(endDate);
    }
    startTime = aa.env.getValue("startTime");
    if (!startTime ||startTime == "")
        startTime = "00:00:00";
    endTime = aa.env.getValue("endTime");
    if (!endTime || endTime == "") {
            endTime = "23:59:59";
        //    endDateStr = dateAdd(null, -1);
         //   endDate = new Date(endDateStr);
    }
        
	toDateStr = (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear();
	toJSDate = new Date(toDateStr + " " + endTime);
	fromDateStr = (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear();
	fromJSDate = new Date(fromDateStr + " " + startTime);
    content = new Array(); OLContent = new Array();
    fileName +=   (startDate.getMonth() + 1) + "" + startDate.getDate() + "" + startDate.getFullYear();

    amtsByAcctCode = [];
    detailLines = [];
    OLAmtsByAcctCode = [];
    OLDetailLines = [];

	// get applied payments
	getAppliedPayments(fromDateStr + " " + startTime, toDateStr + " " + endTime);  
    getVoids(fromDateStr + " " + startTime, toDateStr + " " + endTime);
  
    for (var acctCode in amtsByAcctCode) {
        acctCode1 = "";
        acctCode2 = "";
        acctCode3 = "";
        acctCode4 = "";
        if (acctCode && acctCode != "") {
            acctCodePieces = acctCode.split("-");
            acctCode1 = acctCodePieces[0];
            if (acctCodePieces.length > 0)
                acctCode2 = acctCodePieces[1];
            if (acctCodePieces.length > 1)
                acctCode3 = acctCodePieces[2];
            if (acctCodePieces.length > 2)
                acctCode4 = acctCodePieces[3];
        }
        feeDesc="amount for revenue account "  + acctCode.toString();
       // Account #1, Account #2, Account 3, Account 4 blank blank blank Amount Description
       line = "" + acctCode1 + "," + acctCode2 + "," + acctCode3 + ","+ acctCode4 + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(-amtsByAcctCode[acctCode]) + "," +  feeDesc.replace(/,/g, '');
       content.push(line);
       line = "" + acctCode1 + "," + acctCode2 + "," + "000" + ","+ "101101" + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(amtsByAcctCode[acctCode]) + "," +  "Cash";
       content.push(line);
    }
    for (var acctCode in OLAmtsByAcctCode) {
        acctCode1 = "";
        acctCode2 = "";
        acctCode3 = "";
        acctCode4 = "";
        if (acctCode && acctCode != "") {
            acctCodePieces = acctCode.split("-");
            acctCode1 = acctCodePieces[0];
            if (acctCodePieces.length > 0)
                acctCode2 = acctCodePieces[1];
            if (acctCodePieces.length > 1)
                acctCode3 = acctCodePieces[2];
            if (acctCodePieces.length > 2)
                acctCode4 = acctCodePieces[3];
        }
        feeDesc="amount for revenue account "  + acctCode.toString();
       // Account #1, Account #2, Account 3, Account 4 blank blank blank Amount Description
       line = "" + acctCode1 + "," + acctCode2 + "," + acctCode3 + ","+ acctCode4 + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(-OLAmtsByAcctCode[acctCode]) + "," +  feeDesc.replace(/,/g, '');
       OLContent.push(line);
       line = "" + acctCode1 + "," + acctCode2 + "," + "000" + ","+ "101101" + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(OLAmtsByAcctCode[acctCode]) + "," +  "Cash";
       OLContent.push(line);
    }
    sendFileToSite(content.join("\r\n"), fileName);     // summation by account code for back office payments
    sendFileToSite(detailLines.join("\r\n"), fileName + "Detail"); // detail lines for back office payments
    sendFileToSite(OLContent.join("\r\n"), "OL" + fileName);     // summation by account code for online payments
    sendFileToSite(OLDetailLines.join("\r\n"), "OL"+fileName+"Detail");  // detail lines for online payments

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

function getAppliedPayments(fromDateTimeStr, toDateTimeStr) {
    logDebug("getAppliedPayments " + fromDateTimeStr + " - " + toDateTimeStr);
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select tran_amount, gf_l2, cashier_id, gf_des  from accounting_audit_trail where serv_prov_code = 'DELAND'  and action='Payment Applied' and tran_date >= to_date(?, 'MM/DD/YYYY HH24:MI:SS') and tran_date <= to_date(?, 'MM/DD/YYYY HH24:MI:SS') order by rec_date desc";
	var sStmt = conn.prepareStatement(selectString);
	sStmt.setString(1, fromDateTimeStr);
	sStmt.setString(2, toDateTimeStr);
	var rSet = sStmt.executeQuery();
	while (rSet.next()) {
		tranAmt = rSet.getFloat("tran_amount");
        tranAmt = Math.abs(tranAmt);
        cashierId = rSet.getString("cashier_id");
        feeDesc =  "" + rSet.getString("gf_des");
        acctCode = rSet.getString("gf_l2");
        acctCode1 = "";
        acctCode2 = "";
        acctCode3 = "";
        acctCode4 = "";
        if (acctCode && acctCode != "") {
            acctCodePieces = acctCode.split("-");
            acctCode1 = acctCodePieces[0];
            if (acctCodePieces.length > 0)
                acctCode2 = acctCodePieces[1];
            if (acctCodePieces.length > 1)
                acctCode3 = acctCodePieces[2];
            if (acctCodePieces.length > 2)
                acctCode4 = acctCodePieces[3];
        }
        // Account #1, Account #2, Account 3, Account 4 blank blank blank Amount Description
        line = "" + acctCode1 + "," + acctCode2 + "," + acctCode3 + ","+ acctCode4 + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(tranAmt) + "," +  feeDesc.replace(/,/g, '');
        if (cashierId.indexOf("PUBLICUSER") >= 0) {
            OLDetailLines.push(line);
            if (doesArrayHaveKey(acctCode, OLAmtsByAcctCode)) {
                var existingAmt = OLAmtsByAcctCode[acctCode];
                OLAmtsByAcctCode[acctCode] += tranAmt;
            }
            else {
                OLAmtsByAcctCode[acctCode] = tranAmt; 
            }
        }
        else {
            detailLines.push(line);
            if (doesArrayHaveKey(acctCode, amtsByAcctCode)) {
                var existingAmt = amtsByAcctCode[acctCode];
                amtsByAcctCode[acctCode] += tranAmt;
            }
            else {
                amtsByAcctCode[acctCode] = tranAmt; 
            }
        }
        
    }
}

function getVoids(fromDateTimeStr, toDateTimeStr)  {
	logDebug("getVoids " + fromDateTimeStr + " - " + toDateTimeStr);
	var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select tran_amount, gf_l2, gf_des from accounting_audit_trail where serv_prov_code = 'DELAND' and action='Void Payment Applied' and tran_date >= to_date(?, 'MM/DD/YYYY HH24:MI:SS') and tran_date <= to_date(?, 'MM/DD/YYYY HH24:MI:SS') order by rec_date desc";
	var sStmt = conn.prepareStatement(selectString);
	sStmt.setString(1, fromDateTimeStr);
	sStmt.setString(2, toDateTimeStr);
	var rSet = sStmt.executeQuery();
	while (rSet.next()) {
		tranAmt = rSet.getFloat("tran_amount");
   //     tranAmt = -tranAmt;
        acctCode = rSet.getString("gf_l2");
        feeDesc =  "" + rSet.getString("gf_des");
        acctCode1 = "";
        acctCode2 = "";
        acctCode3 = "";
        acctCode4 = "";
        if (acctCode && acctCode != "") {
            acctCodePieces = acctCode.split("-");
            acctCode1 = acctCodePieces[0];
            if (acctCodePieces.length > 0)
                acctCode2 = acctCodePieces[1];
            if (acctCodePieces.length > 1)
                acctCode3 = acctCodePieces[2];
            if (acctCodePieces.length > 2)
                acctCode4 = acctCodePieces[3];
        }
        // Account #1, Account #2, Account 3, Account 4 blank blank blank Amount Description
        line = acctCode1 + "," + acctCode2 + "," + acctCode3 + ","+ acctCode4 + "," + "" + ","+ "" + "," + "" + "," + currencyFormat(tranAmt) + "," +  feeDesc.replace(/,/g, '');
        detailLines.push(line);
        // Online voids do not happen so do not need to check
        if (doesArrayHaveKey(acctCode, amtsByAcctCode)) {
            existingAmt = amtsByAcctCode[acctCode];
            amtsByAcctCode[acctCode] += tranAmt;
        }
        else {
            amtsByAcctCode[acctCode] = tranAmt; 
        }
	}
}

function getReceiptNumber(paymentSeq) {
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select receipt_nbr from f4payment where serv_prov_code = 'DELAND'  and payment_seq_nbr = ? order by rec_date desc";
	var sStmt = conn.prepareStatement(selectString);
    sStmt.setLong(1, paymentSeq);
    var rSet = sStmt.executeQuery();
	while (rSet.next()) {
        recNbr = rSet.getString("receipt_nbr");
        return recNbr;
    }
    return "";
}

function getCreditCardType(paymentSeq) {
    var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select cc_type from f4payment where serv_prov_code = 'DELAND'  and payment_seq_nbr = ? order by rec_date desc";
	var sStmt = conn.prepareStatement(selectString);
    sStmt.setLong(1, paymentSeq);
    var rSet = sStmt.executeQuery();
	while (rSet.next()) {
        recNbr = rSet.getString("cc_type");
        return recNbr;
    }
    return "";
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



