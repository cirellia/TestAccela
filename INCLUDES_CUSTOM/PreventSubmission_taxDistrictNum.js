function PreventSubmission_taxDistrictNum() {
    try {
        logDebug("Begin PreventSubmission_taxDistrictNum");
        var taxDist = getGISInfo_v3_ASB("Accela/Accela_Basemap", "Parcels", "TAXDIST"); logDebug("taxDist: " + taxDist);
        //if(!taxDist) { taxDist = parArr["ParcelAttribute.supervisorDistrict"]; }
        if (taxDist) {
            if (taxDist != "012") {
                cancel = true;
                showMessage = true;
                comment("this parcel is not in the City of DeLand City Limits, please see other jurisdiction or select another parcel.");
            }

        }

        logDebug("End PreventSubmission_taxDistrictNum");
    }
    catch (err) {
        showMessage = true;
        comment("Error in function PreventSubmission_taxDistrictNum. Contact your system administrator. " + err.message);
    }
}

