if(wfTask == "Review Consolidation" && wfStatus == "Completed"){     
   assessImpactFees();
   addResFees();
   
   if(AInfo["Total Floor Area"] > 0){
	   updateFee('FIREREV', 'BD_PERMITS', 'FINAL', 1, "N");
   }
}
