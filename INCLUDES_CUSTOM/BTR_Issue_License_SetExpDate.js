function BTR_Issue_License_SetExpDate(itemCap) {
    try {
        logDebug("BTR_Issue_License_SetExpDate() Started");
        if (appMatch("Licenses/Business/Tax Receipt/Application") || appMatch("Licenses/Business/Tax Receipt/Application")) {
            var currDate = new Date();
            var expDate = new Date();
            var year = currDate.getFullYear();
            var month = currDate.getMonth();
            var day = currDate.getDate();
            var expYear = year;
            var parentLicenseCAPID;
            loadAppSpecific(AInfo, capId);
            var prePay = AInfo['Pre-Pay Renewal Fee'];
            var halfYear = AInfo['Half Year License'];
            expDate.setMonth(8); //set expiration month to September
            expDate.setDate(30); //set expiration date to 30


            // if Jan - Jun
            if (month < 6)
            {
                logDebug("Month is between Jan-Jun");
                if ( ! matches(prePay,"Y","Yes","Checked","YES","CHECKED") )
                {
                    logDebug("PrePay is not set.");
                    // Sept 30 current year
                    expYear = expDate.getFullYear();
                    logDebug("Setting expiration year to this year.");
                }
                else
                {
                    logDebug("PrePay is set.");
                    // Sept 30 NEXT YEAR
                    expYear = expDate.getFullYear() + 1;
                    logDebug("Setting expiration year to next year.");
                }
            }
            else
            {
                logDebug("Month is between Jul-Dec");
                if ( ! matches(prePay,"Y","Yes","Checked","YES","CHECKED") )
                {
                    logDebug("PrePay is not set.");
                    // Sept 30 NEXT YEAR
                    expYear = expDate.getFullYear() + 1;
                    logDebug("Setting expiration year to next year.");
                }
                else
                {
                    logDebug("PrePay is set.");
                    // Sept 30 YEAR AFTER NEXT YEAR
                    expYear = expDate.getFullYear() + 2;
                    logDebug("Setting expiration year to the year after next.");
                }

            }

            expDate.setFullYear(expYear);

            var currDateString = currDate.getMonth() + 1 + "/" + currDate.getDate() + "/" + currDate.getFullYear();
            var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
            logDebug("Issuance Date: " + currDateString);
            logDebug("New Expiration Date: " + expDateString);

            editAppSpecific("Expiration Date",jsDateToMMDDYYYY(expDate));

            parentLicenseCAPID = getParentLicenseRecord(itemCap);
            if (!parentLicenseCAPID) {
                parentLicenseCAPID = getParent(itemCap);
            }

            if (parentLicenseCAPID) {
                parentLicenseCAPID = aa.cap.getCapID(parentLicenseCAPID.getID1(), parentLicenseCAPID.getID2(), parentLicenseCAPID.getID3()).getOutput();
                var licCustID = parentLicenseCAPID.getCustomID();
                logDebug("Parent ID: " + licCustID + " " + parentLicenseCAPID);
                editAppSpecific("Expiration Date",jsDateToMMDDYYYY(expDate),parentLicenseCAPID);
                thisLic = new licenseObject(licCustID, parentLicenseCAPID);
                thisLic.setExpiration(expDateString);
                thisLic.setStatus("Active");
            }
            else
                logDebug("WARNING: Unable to get the parent license and set the expiration date")
        }
    }
    catch (err) {
        showMessage = true;
        comment("ERROR: WTUA function BTR_Issue_License_SetExpDate(), please contact administrator. Error: " + err);
    }
}//END BTR_Issue_License_SetExpDate


