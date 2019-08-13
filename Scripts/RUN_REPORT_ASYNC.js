//Get environmental variables pass into the script
//var capId = aa.env.getValue("CapId");
//var reportTemplate = aa.env.getValue("reportTemplate");
//var vRParams = aa.env.getValue("vRParams");

try{
	//Start modification to support batch script, if not batch then grab globals, if batch do not.
	if (aa.env.getValue("eventType") != "Batch Process") {
		// Begin Code needed to call master script functions ---------------------------------------------------
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
		var SCRIPT_VERSION = 3.0;
		aa.env.setValue("CurrentUserID", "ADMIN");
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", null, false));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS", null, false));
		eval(getScriptText("INCLUDES_CUSTOM", null, false));
	}
	//End Code needed to call master script functions -----------------------------------------------------
	
	
    var attach2Cap = aa.env.getValue("CapId");
	var reportName = aa.env.getValue("ReportName");
	var CustomCapId = aa.env.getValue("CustomCapId");
	
	runReportAttach(attach2Cap, reportName, "ID_Record", CustomCapId)
	
	
}
catch(err){
	logDebug("Error in script RUN_REPORT_ASYNC. Err: " + err);
}