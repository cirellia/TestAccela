if(wfTask == "Review Consolidation" && wfStatus == "Completed"){     
   assessNewImpactFees();
   addResFees();
   
   if(AInfo["Use"] == "Commercial" && AInfo["Total Floor Area"] > 0){
	   updateFee('FIREREV', 'BD_PERMITS', 'FINAL', 1, "N");
   }
   
}
