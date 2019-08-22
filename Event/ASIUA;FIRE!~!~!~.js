//add layer attributes to records
if (matches(AInfo["Perform GIS Sync"],"CHECKED"))
{
    copyParcelGisObjects();
    addLayersAttributes();
}