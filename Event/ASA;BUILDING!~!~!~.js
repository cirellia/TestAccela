BD_Submittal_Fee();

//add layer attributes to records
addLayersAttributes();
if(!publicUser){
    attachOwnerDisclosure();
}