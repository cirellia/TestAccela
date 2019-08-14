BD_Submittal_Fee();

if(!publicUser){
    //add layer attributes to records - moving inside check for backoffice
    addLayersAttributes();

    attachOwnerDisclosure();
}