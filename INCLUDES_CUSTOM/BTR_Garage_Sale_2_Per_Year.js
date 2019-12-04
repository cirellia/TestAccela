function BTR_Garage_Sale_2_Per_Year() {
    logDebug("Begin BTR_Garage_Sale_2_Per_Year");
    try {
        var count = cntAssocGarageSales(AddressHouseNumber, AddressStreetName, AddressCity, AddressState, "", ApplicantFirstName, ApplicantLastName);
        logDebug("count: " + count);
        if (count > 2) {
            cancel = true;
            showMessage = true;
            comment("You have reached the max number of Garage Sale Permits, you are only allowed 2 per year");
        }
        logDebug("End BTR_Garage_Sale_2_Per_Year");
    }
    catch (err) {
        showMessage = true;
        comment("Error on ASB custom function BTR_Garage_Sale_2_Per_Year(). Please contact administrator. Err: " + err);
    }
}

