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

