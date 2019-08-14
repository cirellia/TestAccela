if(publicUser){
    //copy gis object from parcel to cap (done by intake form in backoffice)
    copyParcelGisObjects();

    //add layer attributes to records - moved inside the check for public user
    addLayersAttributes();
}