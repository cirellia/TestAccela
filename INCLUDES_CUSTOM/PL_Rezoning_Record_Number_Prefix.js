function PL_Rezoning_Record_Number_Prefix() {
    try {
        aa.print("Begin PL_Rezoning_Record_Number_Prefix");
        loadAppSpecific(AInfo, capId);
        var zoningType = AInfo["Zoning Change  Type"];
        var prefix = "";
        var sequence = "";
        var newAltID = "";
        var currDate = new Date();
        var year = (currDate.getFullYear().toString().substr(-2));

        if (zoningType == "Planned Development Concept") {
            prefix = "PDC";
        } else if (zoningType == "Text Amendment") {
            prefix = "LDRA";
        }
        if (prefix != "") {
            oldAltID = capId.getCustomID();
            oldAltIDSplit = oldAltID.split("-");
            if (oldAltIDSplit) {
                sequence = oldAltIDSplit[1];
            }

            newAltID = "" + prefix + year + "-" + sequence;
            var updateCapAltIDResult = aa.cap.updateCapAltID(capId, newAltID);

            if (updateCapAltIDResult.getSuccess())
                aa.print(capId + " AltID changed from " + oldAltID + " to " + newAltID);
            else
                aa.print("**WARNING: AltID was not changed from " + oldAltID + " to " + newAltID + ": " + updateCapAltIDResult.getErrorMessage());
        }

        aa.print("End PL_Rezoning_Record_Number_Prefix");
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: ASA function PL_Rezoning_Record_Number_Prefix(), please contact administrator. Error: " + err);
    }
}

