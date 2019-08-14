ASA_Update_Application_Expiration();

// Add check for backoffice user around gis layer update
if(!publicUser){
    //add layer attributes to records
    addLayersAttributes();
}