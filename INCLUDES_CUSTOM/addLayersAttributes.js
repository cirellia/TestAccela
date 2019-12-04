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

        if (airport){
            editAppSpecific("Airport", airport);
            } else
            editAppSpecific("Airport","N/A");
        if (futureLandUse)  {
            editAppSpecific("Future Land Use Designation", futureLandUse);
            } else
            editAppSpecific("Future Land Use Designation","N/A");
        if (historic) {
            editAppSpecific("Historic District", historic);
            } else
            editAppSpecific("Historic District",  "N/A");
        if (downtown) {
                editAppSpecific("Historic Support", downtown);
            } else
                editAppSpecific("Historic Support",  "N/A");
        if (institution) {
            editAppSpecific("Institutional", institution);
            } else
                editAppSpecific("Institutional",  "N/A");
        if (medical) {
            editAppSpecific("Medical", medical);
            } else
                editAppSpecific("Medical",  "N/A");
        if (recreation) {
            editAppSpecific("Recreational", recreation);
            } else
                editAppSpecific("Recreational",  "N/A");
        if (zoned) {
            editAppSpecific("Zoned", zoned);
            } else
                editAppSpecific("Zoned",  "N/A");


    editAppSpecific("Perform GIS Sync","UNCHECKED");
    editAppSpecific("Last GIS Sync Date", dateAdd(null,0));

    }
    catch (err) {
        showMessage = true;
        comment("Error on ASA Event custom function addLayersAttributes(). Please contact administrator. Err: " + err);
    }
}





/*
** TASK ORIENTATED - NORMALLY CALLED BY EVENT HANDLERS
*/


//CALLED FROM IRSA:BUILDING/*/*/*
