function logDebug(str) {aa.print(str);}
var comment = logDebug;

function editAppSpecific(itemName,itemValue)  // optional: itemCap
{
	var itemCap = capId;
	var itemGroup = null;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args
   	
  	if (useAppSpecificGroupName)
	{
		if (itemName.indexOf(".") < 0)
			{ logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true") ; return false }
		
		
		itemGroup = itemName.substr(0,itemName.indexOf("."));
		itemName = itemName.substr(itemName.indexOf(".")+1);
	}
   	
   	var appSpecInfoResult = aa.appSpecificInfo.editSingleAppSpecific(itemCap,itemName,itemValue,itemGroup);

	if (appSpecInfoResult.getSuccess())
	 {
	 	if(arguments.length < 3) //If no capId passed update the ASI Array
	 		AInfo[itemName] = itemValue; 

                return true;
	} 	
	else
		{ return false;}
}



function getGISInfoArray(svc,layer,attributename)
	{
	// use buffer info to get info on the current object by using distance 0
	// usage: 
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//
	
	var distanceType = "feet";
	var retArray = new Array();
   	
	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributename);
		}
	else
		{ logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }
			
	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess()) 	
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "0", distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }	
		
		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var v = proxObj[z1].getAttributeValues();
				retArray.push(v[0]);
				}
			
			}
		}
	return retArray;
	}



function getGISInfo(svc,layer,attributename)
	{
	// use buffer info to get info on the current object by using distance 0
	// usage: 
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//
	
	var distanceType = "feet";
	var retString;
   	
	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributename);
		}
	else
		{ logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }
			
	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess()) 	
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "0", distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }	
		
		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var v = proxObj[z1].getAttributeValues()
				retString = v[0];
				}
			
			}
		}
	return retString
	}



function addLayersAttributes() {
    try {
        var airport = getGISInfo("Accela/Accela_Basemap", "Airport Zoning Overlay", "AIRPORTOVERLAYNAME");
        var downtown = getGISInfo("Accela/Accela_Basemap", "Downtown Support Design District", "PLANDISTNAME");
        var futureLandUse = getGISInfo("Accela/Accela_Basemap", "Future Land Use", "FLU_NAME");
        var historic = getGISInfo("Accela/Accela_Basemap", "Historic Overlay", "Overlay");
        var institution = getGISInfo("Accela/Accela_Basemap", "Institutional Overlay", "Overlay");
        var medical = getGISInfo("Accela/Accela_Basemap", "Community Health Overlay", "Overlay");
        var recreation = getGISInfo("Accela/Accela_Basemap", "Recreational Overlay", "Overlay");
        var zoned = getGISInfoArray("Accela/Accela_Basemap", "Zoning District Boundaries", "Zoning_Dis", -1, "feet");

        logDebug("Airport: " + airport +"; downtown: " + downtown+ "Future Land Use: " + futureLandUse + "; Historic Overlay: " + historic + "; Institution: " + institution + "; Medical: " + medical + "; Recreation: " + recreation + "Zoning: " + zoned);
        var anyupdated = false;

        if (airport){
            anyupdated = anyupdated || editAppSpecific("Airport", airport);
            } else
            anyupdated = anyupdated || editAppSpecific("Airport","N/A");
        if (futureLandUse)  {
            anyupdated = anyupdated || editAppSpecific("Future Land Use Designation", futureLandUse);
            } else
            anyupdated = anyupdated || editAppSpecific("Future Land Use Designation","N/A");
        if (historic) {
            anyupdated = anyupdated || editAppSpecific("Historic District", historic);
            } else
            anyupdated = anyupdated || editAppSpecific("Historic District",  "N/A");
        if (downtown) {
                anyupdated = anyupdated || editAppSpecific("Historic Support", downtown);
            } else
                anyupdated = anyupdated || editAppSpecific("Historic Support",  "N/A");
        if (institution) {
            anyupdated = anyupdated || editAppSpecific("Institutional", institution);
            } else
                anyupdated = anyupdated || editAppSpecific("Institutional",  "N/A");
        if (medical) {
            anyupdated = anyupdated || editAppSpecific("Medical", medical);
            } else
                anyupdated = anyupdated || editAppSpecific("Medical",  "N/A");
        if (recreation) {
            anyupdated = anyupdated || editAppSpecific("Recreational", recreation);
            } else
                anyupdated = anyupdated || editAppSpecific("Recreational",  "N/A");
        if (zoned) {
            anyupdated = anyupdated || editAppSpecific("Zoned", zoned);
            } else
                anyupdated = anyupdated || editAppSpecific("Zoned",  "N/A");

       return anyupdated;

    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA Event custom function addLayersAttributes(). Please contact administrator. Err: " + err);
       return false;
    }
}


function loadAppSpecific(thisArr) {
	// 
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//
	
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}

 function copyParcelGisObjects() 
	{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (capParcelResult.getSuccess())
		{
		var Parcels = capParcelResult.getOutput().toArray();
		for (zz in Parcels)
			{
			var ParcelValidatedNumber = Parcels[zz].getParcelNumber();
			logDebug("Looking at parcel " + ParcelValidatedNumber);
			var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
			if (gisObjResult.getSuccess()) 	
				var fGisObj = gisObjResult.getOutput();
			else
				{ logDebug("**WARNING: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

			for (a1 in fGisObj) // for each GIS object on the Cap
				{
				var gisTypeScriptModel = fGisObj[a1];
                                var gisObjArray = gisTypeScriptModel.getGISObjects()
                                for (b1 in gisObjArray)
                                	{
  					var gisObjScriptModel = gisObjArray[b1];
  					var gisObjModel = gisObjScriptModel.getGisObjectModel() ;

					var retval = aa.gis.addCapGISObject(capId,gisObjModel.getServiceID(),gisObjModel.getLayerId(),gisObjModel.getGisId());

					if (retval.getSuccess())
						{ logDebug("Successfully added Cap GIS object: " + gisObjModel.getGisId())}
					else
						{ logDebug("**WARNING: Could not add Cap GIS Object.  Reason is: " + retval.getErrorType() + ":" + retval.getErrorMessage()) ; return false }	
					}
				}
			}
		}	
	else
		{ logDebug("**ERROR: Getting Parcels from Cap.  Reason is: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage()) ; return false }
	}



var vCapListResult = aa.cap.getCapIDListByCapModel(aa.cap.getCapModel().getOutput());
        if (vCapListResult.getSuccess()) {
            vCapList = vCapListResult.getOutput();
        }
        else{
            logDebug("WARNING: Unable to get the list for BTR Licenses.");
        }       
aa.print(vCapList.length);
var count = 0;
for (x in vCapList)
{
var capId = vCapList[x].getCapID();
var AInfo = [];
var useAppSpecificGroupName = false;
loadAppSpecific(AInfo);
if (!AInfo["Zoned"] && !capId.toString().contains("EST") && !capId.toString().contains("TEMP"))
{
  aa.print(capId + " - " + AInfo["Future Land Use Designation"] + " - " + AInfo["Zoned"]);
  copyParcelGisObjects();
  var updatedLayer = addLayersAttributes();
  if (updatedLayer)
  {
    count++;
    aa.print(count);
  }
}
aa.print(x);
}
aa.print(count);