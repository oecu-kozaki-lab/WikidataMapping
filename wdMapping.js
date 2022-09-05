/* 
* GUIの情報を使ってSPARQLクエリを作る
*/
async function makeMappingQuery(query,textLABEL){
   let conditions = "{\n";
   let ids; 

   //名称の処理
   if(textLABEL!=""){
       if(document.getElementById('LabelFull').checked){
           conditions+= '{?item rdfs:label|skos:altLabel "'+textLABEL+'"@ja.}\n';
           conditions+= 'UNION {?item rdfs:label|skos:altLabel "'+textLABEL+'"@en.}\n';
       }
       else if(document.getElementById('LabelForward').checked){
           ids = await getWdIDsBySE(textLABEL);
           //得られたID一覧の数が上限(=50)になったら,「続きを検索」表示をON
           if(ids.length==50){
               contQueryIds = true;
           }
           const vals = ids.join(" ").replaceAll("Q","wd:Q"); 
           conditions+= 'VALUES ?item {'+vals+'}\n';
       }
       else if(document.getElementById('LabelAmbi').checked){
           ids = await getWdIDs(textLABEL);
           //得られたID一覧の数が上限(=50)になったら,「続きを検索」表示をON
           if(ids.length==50){
               contQueryIds = true;
           }
           const vals = ids.join(" ").replaceAll("Q","wd:Q"); 
           conditions+= 'VALUES ?item {'+vals+'}\n';
       }
       else if(document.getElementById('LabelPart').checked){
           conditions+= '?item rdfs:label ?label.\n';
           conditions+= 'FILTER(contains(?label,"'+textLABEL+'"))' ;
       }      
   }  
       
   //検索条件・検索項目の更新
   document.getElementById('settings_area').value
       ="let search_cond = \n" + JSON.stringify(saveSearchConds(),null,'  ') +";\n\n"
       +"let search_prop = \n" + JSON.stringify(saveSearchProps(),null,'  ') +";\n";

   //検索条件の設定
   for(let i=0; i<search_cond.length ;i++){
       const condID = search_cond[i].id;
       const textCond = search_cond[i].cond; 
       const textVal = search_cond[i].val;
       if(textCond!="" && textVal!=""){
           if(search_cond[i].type =="ID"){
               conditions+= '?item '+textCond+' '+textVal+ '.\n';
           }
           else if(search_cond[i].type =="getID"){
               const qid = await getWdIDse(textVal); //IDを検索で取得     
               conditions+= '?item '+textCond+' '+"wd:"+qid+ '.\n';
           }
           else if(search_cond[i].type =="STR-ja"){
               conditions+= '?item '+textCond+' "'+textVal+ '"@ja .\n';
           }
           else if(search_cond[i].type =="REPLACE"){
               conditions+= textCond.replace('####',textVal)+'\n';
           }
       }  
   }

   //検索項目の設定
   let opt_select = "";
   let options = "";
   for(let i=0;i<search_prop.length;i++){
       const optid = search_prop[i].id;        
       const textOpt = search_prop[i].prop;
       const textPname = search_prop[i].pname; 
       
       if(textOpt!=""){
           opt_select += '?'+optid+'Label';
           if(search_prop[i].optional){
               options += 'OPTIONAL{?item '+ textOpt+' ?'+optid+' .}\n';
           }
           else{
               options += '?item '+ textOpt+' ?'+optid+' .\n';
           }
       }
   }
   
   query = query.replace("{",conditions+options)
                .replace("?itemLabel","?itemLabel "+opt_select);

   if(offset!=0 && !contQueryIds){
       query += "OFFSET "+offset; 
   }

   return query;
}


