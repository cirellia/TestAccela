function validateAdditionalParcels(custListName, custListColName){
    var invalidParcels = [];
    var additionalPrcls = [];
    if(publicUser){
        additionalPrcls = loadASITables4ACAXX(custListName);
    }
    else{
        additionalPrcls = loadASITable(custListName);
    }

    for(j in additionalPrcls){
        var aPrclNum = additionalPrcls[j][custListColName];
        var prclGISRes = aa.gis.getParcelGISObjects(aPrclNum);

        prclGISRes = aa.parcel.getParceListForAdmin(aPrclNum, "", "", "", "", "", "", "", "", "")

        if(prclGISRes.getSuccess()){
            var prclGIS = prclGISRes.getOutput();

            if(prclGIS.length <= 0) invalidParcels.push(aPrclNum);
        }
        else{
            logDebug("Unable to get parcel list, err: " + prclGISRes.getErrorMessage());
            invalidParcels.push(aPrclNum);
        }
    }

    return invalidParcels;
}//END validateAdditionalParcels()

