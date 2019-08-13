if (wfTask == "Review" && wfStatus == "Change Approved")
{
    var parentCapId = getParentByCapId(capId);
    logDebug("ParentCapId: " + parentCapId);
    if ((!parentCapId || parentCapId == null || parentCapId == "") && typeof ParentCapID != 'undefined') {
        parentCapId = aa.env.getValue("ParentCapID");
    }

    if (parentCapId != null && parentCapId != "") {
        logDebug("Copying the ASI...");
        var typeOfChange = AInfo["Type of Change"];
        if(typeOfChange == "Business Name Change"){
            editAppSpecific("Name of Business", AInfo["Name of Business"], parentCapId);
            editAppName(cap.getSpecialText(), parentCapId);
        }
        if(typeOfChange == "Change of Address"){
            editAppSpecific("Square Footage", AInfo["Square Footage"], parentCapId);
            editAppSpecific("Unit Number", AInfo["Unit Number"], parentCapId);
            editAppSpecific("Fire Sprinklers", AInfo["Fire Sprinklers"], parentCapId);
            editAppSpecific("Fire Alarm", AInfo["Fire Alarm"], parentCapId);
            
            logDebug("Copying the Address...");
            copyAddresses_disableDestPrimary(capId,parentCapId);
            logDebug("");
            logDebug("Copying the Parcel...");
            copyParcels_disableDestPrimary(capId,parentCapId);
            logDebug("");
            logDebug("Copying the Owner...");
            copyOwner_disableDestPrimary(capId,parentCapId);
            logDebug("");
        }
        if(typeOfChange == "Modified Professional"){
            editAppSpecific("Total Number of Employees", AInfo["Total Number of Employees"], parentCapId);
            var table2Copy = "BTR PROFESSIONAL";
            var newBTRPRO = loadASITable(table2Copy);
            removeASITable(table2Copy, parentCapId);
            addASITable(table2Copy, newBTRPRO, parentCapId);
        }
        //copyAppSpecific(parentCapId);
        logDebug("Finished copying ASI");
        logDebug("");
    } else {
        logDebug("Could not get a parent CapID.");
    }
}

function copyAddresses_disableDestPrimary(pFromCapId, pToCapId)
    {
    //Copies all property addresses from pFromCapId to pToCapId
    //If pToCapId is null, copies to current CAP
    //07SSP-00037/SP5017
    //
    if (pToCapId==null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    //check if target CAP has primary address
    var priAddrExists = false;
    var capAddressResult = aa.address.getAddressWithAttributeByCapId(vToCapId);
    if (capAddressResult.getSuccess())
    {
        Address = capAddressResult.getOutput();
        for (yy in Address)
        {
            if ("Y"==Address[yy].getPrimaryFlag())
            {
                logDebug("Target CAP has primary address. Setting existing primary to not be primary.");
                Address[yy].setPrimaryFlag("N");
                var rsDisableOldPrimaryAddress = aa.address.editAddressWithAPOAttribute(vToCapId,Address[yy]);
                logDebug("Updated old primary address to not be primary: " + rsDisableOldPrimaryAddress.getSuccess());
                break;
            }
        }
    }
    else
    {
        logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
        return false;
    }

    //get addresses from originating CAP
    var capAddressResult = aa.address.getAddressWithAttributeByCapId(pFromCapId);
    var copied = 0;
    if (capAddressResult.getSuccess())
    {
        Address = capAddressResult.getOutput();
        for (yy in Address)
        {
            newAddress = Address[yy];
            newAddress.setCapID(vToCapId);

            aa.address.createAddressWithAPOAttribute(vToCapId, newAddress);
            logDebug("Copied address from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
            copied++;
        }
    }
    else
    {
        logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
        return false;
    }
    return copied;
}


function copyParcels_disableDestPrimary(pFromCapId, pToCapId)
{
    if (pToCapId==null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    //Set existing Cap Parcels to not be primary
    var tParcels = aa.parcel.getParcelByCapId(vToCapId,null).getOutput();
    if (tParcels && tParcels.length > 0)
    {
        for (yy in tParcels)
        {
            if (matches(tParcels[yy].getPrimaryParcelFlag(),"Y"))
            {
                logDebug("Target CAP has primary parcel. Setting existing primary to not be primary.");
                tParcels[yy].setPrimaryParcelFlag("N");
                var capParcelModel = aa.parcel.warpCapIdParcelModel2CapParcelModel(vToCapId,parcel).getOutput();
                var rsDisableOldPrimaryParcel = aa.parcel.updateDailyParcelWithAPOAttribute(newmodel);
                logDebug("Updated old primary parcel to not be primary: " + rsDisableOldPrimaryParcel.getSuccess());
                break;
            }
        }
    }


    //Copies all parcels from pFromCapId to pToCapId
    //If pToCapId is null, copies to current CAP
    //07SSP-00037/SP5017
    //

                
    var capParcelResult = aa.parcel.getParcelandAttribute(pFromCapId,null);
    var copied = 0;
    
    if (capParcelResult.getSuccess())
    {
        var Parcels = capParcelResult.getOutput().toArray();
        for (zz in Parcels)
        {
            var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
            newCapParcel.setParcelModel(Parcels[zz]);
            newCapParcel.setCapIDModel(vToCapId);
            newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
            newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
            aa.parcel.createCapParcel(newCapParcel);
            logDebug("Copied parcel "+Parcels[zz].getParcelNumber()+" from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
            copied++;
        }
    }
    else
    {
        logMessage("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage()); 
        return false; 
    }

    return copied;
}



//Function will copy all owners from source CAP (sCapID) to target CAP (tCapId)
function copyOwner_disableDestPrimary(sCapID, tCapID)
{
    //
    //Set existing Cap Owners to not be primary
    var tOwners = aa.owner.getOwnerByCapId(tCapID).getOutput();
    if (tOwners && tOwners.length > 0)
    {
        for (yy in tOwners)
        {
            if (matches(tOwners[yy].getPrimaryOwner(),"Y"))
            {
                logDebug("Target CAP has primary owner. Setting existing primary to not be primary.");
                tOwners[yy].setPrimaryOwner("N");
                var rsDisableOldPrimaryOwner = aa.owner.updateDailyOwnerWithAPOAttribute(tOwners[0]);
                logDebug("Updated old primary owner to not be primary: " + rsDisableOldPrimaryOwner.getSuccess());
                break;
            }
        }
    }

    // Add in new Owners
    var ownrReq = aa.owner.getOwnerByCapId(sCapID);
    if(ownrReq.getSuccess())
    {
        var ownrObj = ownrReq.getOutput();
        for (xx in ownrObj)
        {
            ownrObj[xx].setCapID(tCapID);
            aa.owner.createCapOwnerWithAPOAttribute(ownrObj[xx]);
            logDebug("Copied Owner: " + ownrObj[xx].getOwnerFullName())
        }
    }
    else
        logDebug("Error Copying Owner : " + ownrObj.getErrorType() + " : " + ownrObj.getErrorMessage());
}
