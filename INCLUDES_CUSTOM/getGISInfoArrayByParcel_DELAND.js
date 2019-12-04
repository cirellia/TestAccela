function getGISInfoArrayByParcel_DELAND(pParcelNo,svc,layer,attributename)
{
    try{
        var distanceType = "feet";
        var retArray = new Array();
        
        var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
        if (bufferTargetResult.getSuccess()){
            var buf = bufferTargetResult.getOutput();
            buf.addAttributeName(attributename);
        }
        else{
            logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ;
            return false;
        }

        var gisObjResult = aa.gis.getParcelGISObjects(pParcelNo); // get gis objects on the parcel number
        if (gisObjResult.getSuccess())
            var fGisObj = gisObjResult.getOutput();
        else{
            logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage());
            return false;
        }

        for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
        {
            var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "-1", distanceType, buf);

            if (bufchk.getSuccess())
                var proxArr = bufchk.getOutput();
            else{
                logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ;
                return false;
            }

            for (a2 in proxArr)
            {
                var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
                for (z1 in proxObj)
                {
                    logDebug("Found GIS Object, getting attribute.");
                    var v = proxObj[z1].getAttributeValues()
                    for (vi in v) {
                        if (!exists(v[vi], retArray))
                            retArray.push(v[vi]);
                    }
                }
            }
        }
    
        return retArray;
    }
    catch (err){
        logDebug("A JavaScript Error occurred in custom function getGISInfoArrayByParcel(): " + err.message);
    }
}



