

Object.create = Object.create || function(o) {
   var makeArgs = arguments 
   function F() {
      var prop, i=1, arg, val
      for(prop in o) {
         if(!o.hasOwnProperty(prop)) continue
         val = o[prop]
         arg = makeArgs[i++]
         if(typeof arg === 'undefined') break
         this[prop] = arg
      }
   }
   F.prototype = o
   return new F()
};

var TaxConfiguration = function() {
	return {
	  SspId : "",
	  GroupId : "",
	  TermSetId : "",
	  Configuration : "",
	  AnchorId : "",
	  DisplayName: "",
	  ParseConfiguration : function () {

	    xmlDoc = $.parseXML(this.Configuration);
	    xml = $(xmlDoc);

	    this.DisplayName = xml.find("Field").attr("DisplayName");

	    var properties = xml.find("Property");

	    for (i = 0; i < properties.length; i++) {

	      propertyName = properties[i].firstChild.textContent == undefined ?
	        properties[i].firstChild.text : properties[i].firstChild.textContent;
	      propertyValue = properties[i].lastChild.textContent == undefined ?
	        properties[i].lastChild.text : properties[i].lastChild.textContent;



	      if (propertyName == propertyValue) {
	        propertyValue = "";
	      }

	      switch (propertyName) {
		      case "SspId":
		        this.SspId = propertyValue;
		        break;
		      case "GroupId":
		        this.GroupId = propertyValue;
		        break;
		      case "TermSetId":
		        this.TermSetId = propertyValue;
		        break;
	    	  case "AnchorId":
	        	this.AnchorId = propertyValue;
	        	break;
	         
	      }

	    }

	  }
	}
}

var GetChildTermsRecursive = function GetChildTermsRecursive(sspId, termSetId, roottermId, terms, taxconfig) { 
  var terms = terms || new Array(); 

  $().SPServices({ 
    operation : "GetChildTermsInTerm", 
    sspId : sspId, 
    termId : roottermId, 
    termSetId : termSetId, 
    lcid : 1033, 
    completefunc: function(xData, Status){
	    	GetData(xData, Status, terms, taxconfig);	
	    }
  }); 

  return terms; 
} ;

var GetTermSetTerms = function(k){
	////console.log(k);
	var dfd = new $.Deferred();
	k.prom = dfd.promise();

	$().SPServices({
	    operation : "GetChildTermsInTermSet",
	    sspId : k.tconfig.SspId,
	    termSetId : k.tconfig.TermSetId,
	    lcid : 1033,
	    completefunc : function(xData, Status){
	    	//need to delete check if its not needed
	    	
	    	k.tconfig.terms = GetData(xData, Status, null, k.tconfig);	
	    	
	    	dfd.resolve();
	    }
	 });
}

var GetLookupListItems = function(field){
	var listId = field.lookupListId;
	var list = new SpListUtil(listId, { type: "id" });
	var df = new $.Deferred();
	field.uProm = df.promise();
	list.query({ 
		ViewFields: [field.lookupField, "ID"],	
		complete: function(results){
			field.listItems = results;
			field.lookupList = list;
			df.resolve();
		}
	});

}

function GetData(xData, Status, terms, taxconfig) {
  if (Status == "success") {

    terms = terms || new Array();

    xmlData = xData;

    // Fix for different XML parsing in IE and Chrome
    termsContent = $.parseXML(xmlData.responseText).firstChild.textContent == undefined ?
      $.parseXML(xmlData.responseText).text :
      $.parseXML(xmlData.responseText).firstChild.textContent;

    termsXML = $.parseXML(termsContent);
    $termsXML = $(termsXML);
    ////console.log($termsXML);

    childTerms = $termsXML.find("T");
    parentTermId = null;

    filterOutput = "<ul>";

    for (i = 0; i < childTerms.length; i++) {

      termName = $(childTerms[i]).find("TL");
      hasChildTermsXml = $(childTerms[i]).find("TM");

      // request if child terms are available
      hasChildTerms = $(hasChildTermsXml).attr("a69");

      var tsTerm = new Object();

      // Requesting actual term id
      tsTerm.termId = $(childTerms[i]).attr("a9");

      // Requesting term name
      tsTerm.termName = termName.attr("a32");
     
      // Setting Parent Term ID
      parentTermId = $(hasChildTermsXml).attr("a25");

      filterOutput += "<li id='" + tsTerm.termId + "'>" + tsTerm.termName;

      // If child terms are avaliable query child terms
      if (hasChildTerms != undefined && hasChildTerms == "true") {
        // Request child Terms
        tsTerm.child = GetChildTermsRecursive(taxconfig.SspId, taxconfig.TermSetId, tsTerm.termId, terms, taxconfig);
        tsTerm.hasChildTerms = true;
      } else {

        tsTerm.child = null;
        tsTerm.hasChildTerms = false;

      }

      filterOutput += "</li>";
      terms.push(tsTerm);

    }

    filterOutput += "</ul>";

    // If parent element is specified query for parent element
    if (parentTermId != undefined || parentTermId != null) {

      $("#" + parentTermId).append(filterOutput);

    } else {

      currentFilter = $("#filter").html();
      $("#filter").html(currentFilter + filterOutput);

    }
    return terms;

  }
}




var SpUtil = function SpUtil(options){
	
	var options = options || {};
	var _this = this;
	var initComplete = new $.Deferred();
	//console.log("loading SpUtil");
	this.clientContext = {};
	this.initPromise = initComplete.promise();
	this.web = {};
	this.webUrl = options.webUrl;


	var init = function(){
		//console.log("init SpUtil");

		ExecuteOrDelayUntilScriptLoaded(function(){
			//console.log("inside init SpUtil");
			_this.clientContext = _this.webUrl ? new SP.ClientContext(_this.webUrl) : new SP.ClientContext(_spPageContextInfo.webServerRelativeUrl);
			_this.web = _this.clientContext.get_web();
			//console.log("sp util init complete");
			initComplete.resolve();	


			},"sp.js");
	};



	init();

	return _this;
}


SpUtil.arrayIndexOf = function(array, value){
		//alert("works");
		
		for(var i = 0; i < array.length; i++){
			if(array[i] === value){
				return i;
			}
		}

		return -1;
	}

SpUtil.getUrlParam = function gup( name, index ){
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
	var regexS = "[\\?&]"+name+"=([^&#]*)";  
	var regex = new RegExp( regexS );  
	var results = regex.exec( window.location.href ); 
	index = index == undefined ? 1 : index;

	
	if( results == null )
		{  return "";  }
	else
		{   return results[index];}
};

var SpListUtil = function SpListUtil (listName, options){
	var _this = this;


	options = options || {};

	//console.log(options);
	//console.log(listName);
	

	if(this.spUtil === undefined){
		//console.log("not of type SpListUtil " + this.spUtil );
		return new SpListUtil(listName, options);
	}

	//providing inheritance
	SpUtil.call(this, options);
	
	
	options = $.extend({
		type: "title",
		getFields: true,
		getListInfo: false,
		getLookupChoices: true,
		fieldsToLoad: "all"
	}, options);

	this.options = options;

	this.listName = listName;
	this.list = {};
	this.listItemsLoaded = false;
	this.listItems;
	this.fields = {};
	this.initComplete = false;
	this.readOnlyFields = {};
	this.rootFolder = {};
	this.listUrl = "";
	this.listInfoRequested = false;
	this.listInfoDfd = new $.Deferred();
	this.listInfoPromise = this.listInfoDfd.promise();

	if(listName){
		var init = function(){
			//console.log("init list called")
			//console.log(_this.initPromise.isResolved());
			$.when(_this.initPromise).done(function(){
				//console.log(_this.initPromise.isResolved());
			
				if(options.type == "id"){
					//removing brackets as they are not needed
					listName = listName.replace("{", "").replace("}", "");
				}

				//console.log("list being set with title: " + listName)
				_this.list = options.type == "title" ? _this.web.get_lists().getByTitle(_this.listName)
					: _this.web.get_lists().getById(listName); 

				//console.log("setting root folder " + listName);
				_this.rootFolder = _this.list.get_rootFolder();
				//_this.permissions = _this.list.get_effectiveBasePermissions();

				//console.log("loading rootFolder and list " + listName);
				_this.clientContext.load(_this.rootFolder);
				_this.clientContext.load(_this.list);
				//_this.clientContext.load(_this.permissions);

				//console.log("loading fields " + listName)
				_this.listFields = _this.list.get_fields();
				_this.clientContext.load(_this.listFields);
				

				if(options.getListInfo === false){
					_this.initComplete = true;
				} else{
					_this.getListInfo();
					
				}

			});
		
		};
	} else {
		
		//console.error("SPListUtil: Must include list title!")
		return undefined;
	}

	init();

	return _this;

}

//SpListUtil.prototype = Object.create(SpUtil.prototype);
SpListUtil.prototype = new SpUtil();

SpListUtil.prototype.executeAndUpdateList = function(success, failiure){
	var updateListOnSuccess = false;
	if(this.listInfoRequested === false){
		this.listInfoRequested = true;
		updateListOnSuccess = true;
	}

	var _this = this;
	this.clientContext.executeQueryAsync(function(arg){
		if(updateListOnSuccess){
			_this.loadListInfo();
		}

		if(success){
			success.apply(this, arguments);
		}
	}, function(arg){
		if(failiure){
			failiure.apply(this, arguments);
		}
	})
}

SpListUtil.prototype.spUtil = function(){
	return true;
}

SpListUtil.prototype.loadListInfo = function(){
	var _this = this;
	this.listInfoRequested = true;
	if(this.listInfoLoaded != true){
		//console.log("loading list info");
		_this.listInfoLoaded = true;
		_this.listUrl = _this.rootFolder.get_serverRelativeUrl();
		_this.listName = _this.list.get_title();
		_this.listId = _this.list.get_id().toString();
		//console.log("list initialized " + _this.listName)

		if(_this.options.getFields === true && _this.listFields){
			//console.log("getting fields");
			var fieldEnumerator = _this.listFields.getEnumerator();
			//console.log(fieldEnumerator);


	        while (fieldEnumerator.moveNext()) {

	            var oField = fieldEnumerator.get_current();
	            var fType = oField.get_typeAsString();
	            var title = oField.get_staticName();
	            var displayName = oField.get_title();

	           //console.log("gettinf field: " + title);

	            /*if(oField.get_hidden() || fType == "Computed") {
	            	continue;
	            }*/

	            if(_this.options.fieldsToLoad !== "all" && SpUtil.arrayIndexOf(_this.options.fieldsToLoad, title) == -1){
	            	continue;
	            }

	            var f = {};
	            f.staticName = title;
	            f.displayName = displayName;
	            f.fType = fType;
	            f.isReadOnly = oField.get_readOnlyField();
	        	f.required = oField.get_required();
	        	f.id = oField.get_id();
	        	f.isHidden = oField.get_hidden();

	            if(fType.indexOf("TaxonomyFieldType") != -1){
	            	
	            	f.tconfig = new TaxConfiguration();
	            	f.tconfig.Configuration = oField.get_schemaXml();
	            	f.tconfig.ParseConfiguration();	
	            	//console.log(f.tconfig);
	            	//var k = f;
	            	GetTermSetTerms(f);

				  	
	            } else if(fType.indexOf("Choice") > -1 ){
	            	f.choices = oField.get_choices();
	            	f.multiChoice = fType == "MultiChoice";
	            	f.canFill = oField.get_fillInChoice();
	            	f.defaltValue = oField.get_defaultValue();
	            } else if(fType.indexOf("Lookup") > -1 && f.isReadOnly === false){
	            	f.defaultValue = oField.get_defaultValue();
	            	f.lookupField = oField.get_lookupField();
	            	f.multiChoice = oField.get_allowMultipleValues();
	            	f.lookupListId = oField.get_lookupList();
	            	if(_this.options.getLookupChoices === true && f.lookupListId && f.isHidden === false){
	            		GetLookupListItems(f);
	            	}
	            } else if(fType.indexOf("User") > -1){
	            	//add values to initialize this with choices
	            } 

	            _this.fields[title] = f;
	        }
			_this.listInfoDfd.resolve();
		} else {
			_this.listInfoDfd.resolve();
		}
	}
}

SpListUtil.prototype.getListInfo = function(){
	var _this = this;
	//debugger;
	$.when(_this.initPromise).done(function(){
		_this.clientContext.executeQueryAsync(function(sender, args){
			_this.loadListInfo();
	        //console.log(_this.fields);
			_this.initComplete = true;

			if(_this.options.onInit){
				_this.options.onInit(_this);
				_this.options.onInit = null;
			}

		},  function(sender, args){ 
			//console.error("failiure!");  
		});

	});
}

SpListUtil.prototype.onReady = function(func){
	if(!this.initComplete){
		//console.log("init not complete")
		var _this = this;
		setTimeout(function(){_this.onReady(func);});
	} else {
		//console.log("init complete");
		
		func();
	}
};

SpListUtil.prototype.getItemById = function(id, options){
	var _this = this;
	return $.Deferred(function(dfd){
		_this.onReady(function(){
			var item = _this.list.getItemById(id);
			_this.clientContext.load(item);
			_this.executeAndUpdateList(function(){
				var ret = _this.addFieldsToItem(item);
				if(options.success){
					options.success(ret);
				}
				dfd.resolve(ret);
			});
		})
	});
}


SpListUtil.prototype.loadListItems = function (options){
	var _this = this;
	options = options || {};
	//console.log("in loadListItems b4 onReady");
	options = $.extend({
		viewXml: "<View><OrderBy><FieldRef Name='ID' Ascending='TRUE' /></OrderBy></View>",
		override: false,
		folderPath: null,
		success: null,
		failiure: null
	}, options);

	this.onReady(function(){
		//console.log("in loadListItems after onReady");
		
		if(options.override === true || _this.listItemsLoaded === false){
			var camlQuery = new SP.CamlQuery();
			var q = options.viewXml

			if(options.folderPath){
				camlQuery.set_folderServerRelativeUrl(options.folderPath);
			}
			//debugger;
		    camlQuery.set_viewXml(q);

		    var listItems = _this.list.getItems(camlQuery);

		    _this.clientContext.load(listItems);
	
		    _this.executeAndUpdateList(function(sender, args){
		    	//console.log("got items");
		    	//console.log(listItems)
		    	_this.listItems = listItems;
		    	if(options.success)	options.success(listItems);
		    },
		    function(sender, args){
		    	if(options.failiure) options.failiure();
		    	//console.error("failiure!");
		    });
		} else {
			if(options.success){
				options.success();
			}
		}
	});
};
//var badFields = [];
SpListUtil.prototype.addFieldsToItem = function(oListItem, fieldsToLoad){
	var _this = this;

	oListItem.spUpdate = oListItem.update;
	
	oListItem.update =  function(upOps){
		var itemToUpdate = this;

		upOps = upOps || {};


		return $.Deferred(function(updateDef){

			var dfds = [];
			for(field in _this.fields){

				if(fieldsToLoad && SpUtil.arrayIndexOf(fieldsToLoad, field) == -1){
					//console.log("skipping " + field);
					continue;
				}

				var fieldObj = _this.fields[field];
				if(!fieldObj.isReadOnly && field != "Attachments" && fieldObj.isReadOnly == false && fieldObj.fType != "Computed"){
					//console.log("updating field: " + field);
					var itemVal = _this.toSpDto(itemToUpdate[field], fieldObj);
					if(itemVal){
						var prom = itemVal.uprom;
						delete itemVal["uprom"];
						dfds.push(prom);
						$.when(prom).done(function(){
							if(fieldObj.fType.indexOf("TaxonomyFieldType") > -1){
								var privateField = _this.GetTermPrivateField(field);
								if(privateField){
									oListItem.set_item(privateField, itemVal);
								}
							}
							itemToUpdate.set_item(field, itemVal);
						});
					} else {
						if(fieldObj.fType.indexOf("TaxonomyFieldType") > -1){
							var privateField = _this.GetTermPrivateField(field);
							if(privateField){
								oListItem.set_item(privateField, itemVal);
							}
						}
						itemToUpdate.set_item(field, itemVal);
					}
				}
			}

			if(upOps.executeQuery !== false){
				$.when.apply($, dfds).done(function(){
					itemToUpdate.spUpdate();
					_this.clientContext.executeQueryAsync(function(){
						//console.log("succ update");
						if(upOps.success){
							upOps.success();
						}
						updateDef.resolve();
					}, function(){
						//console.log("fail update");
						if(upOps.error){
							upOps.error(arguments);
						}
						updateDef.reject(arguments);
					});
				});
			}	
		});

	}

	for(field in _this.fields){
		
		if(fieldsToLoad && SpUtil.arrayIndexOf(fieldsToLoad, field) == -1){
			//console.log("skipping " + field);
			continue;
		}

		try
		{
		  	var fieldVal = _this.fromDto(oListItem.get_item(field), _this.fields[field]);
		  	oListItem[field] = fieldVal;		  	
		}
		catch(err)
		{
			//if(badFields.indexOf(field) == -1){
			//	badFields[i++] = field
			//}

		}

	}



	return oListItem;
}

SpListUtil.prototype.fromDto = function(itemFieldVal, field){
	if(!itemFieldVal || !field)
		return itemFieldVal
	
	var _this = this;
	if($.isArray(itemFieldVal)){
		var ret = [];
		for(var p = 0; p < itemFieldVal.length; p++){
			var item = _this.fromDto(itemFieldVal[p], field);
			ret.push(item);
		}
		return ret;

	} else if(field.fType == "User" || field.fType == "UserMulti"){
		itemFieldVal.userName = itemFieldVal.get_lookupValue();
		itemFieldVal.Id = itemFieldVal.get_lookupId();
	}  else if(field.fType.indexOf("Lookup") > -1){
		if(itemFieldVal.get_lookupId){
			itemFieldVal.ID = itemFieldVal.get_lookupId();
		}
	} else if(field.fType.indexOf("TaxonomyFieldType") >  -1){
		//console.log("setting tax field value");
		var ret = {};
		var termArr = itemFieldVal.split("|");
		ret.termId = termArr[1];
		ret.termName = termArr[0];
		
		return ret;
	} else if(field.fType == "URL"){
		itemFieldVal.url = itemFieldVal.get_url();
	}

	return itemFieldVal;

}

SpListUtil.prototype.batchAction = function(func, ops){
	var _this = this;
	var count = 0;
	var updates = 0;
	var dfds = [];



	if(ops && ops.items){

		if(ops.items.length == 0){
			if(ops.success){
				ops.success(0);
				return;
			}
		}

		var batchCount = Math.floor(ops.items.length / 200);

		if(ops.items.length % 200 != 0){
			batchCount++;
		}

		//console.log("batc count: " + batchCount);

		var batchUpdated = function(){
			updates++;
			debugger;
			if(updates == batchCount){
				//console.log("updates done");
				if(ops.success){
					ops.success(updates);
				}
			}
		}	

		for(var i = 0; i < ops.items.length; i++){
			var item = ops.items[i];
			//console.log(item);
			if(item == undefined){
				continue;
			}

			func(item);

			count++;

			if(count > 199 || i == ops.items.length - 1){
				//console.log("updating batch: " + i);
				
				count = 0;

		
				_this.clientContext.executeQueryAsync(function(){
					batchUpdated();
					//console.log("updated batch");
				}, function(){
					if(ops.error){
						ops.error(arguments);
					}
				});	
			
				

				
			}
		}
	}

}

SpListUtil.prototype.createBatch = function(ops){
	var _this = this;

	_this.batchAction(function(item){
		_this.create(item, {
			executeQuery: false
		});
	}, ops);

}


SpListUtil.prototype.updateBatch = function(ops){
	var _this = this;

	_this.batchAction(function(item){
		item.update({
			executeQuery: false
		});
		item.spUpdate();
	}, ops);

	/*
	var count = 0;
	var updates = 0;
	var dfds = [];



	if(ops && ops.items){

		var batchCount = Math.floor(ops.items.length / 200);

		if(ops.items.length % 200 != 0){
			batchCount++;
		}

		var batchUpdated = function(){
			updates++;
			if(updates == batchCount){
				//console.log("updates done");
				if(ops.success){
					ops.success(updates);
				}
			}
		}	

		for(var i = 0; i < ops.items.length; i++){
			var item = ops.items[i];

			if(item == undefined){
				continue;
			}

			
			count++;

			if(count > 199 || i == ops.items.length - 1){
				//console.log("updating batch: " + i);
				
				count = 0;

		
				_this.clientContext.executeQueryAsync(function(){
					batchUpdated();
					//console.log("updated batch");
				});	
			
				

				
			}
		}
	}*/

}

SpListUtil.prototype.each = function each(func, options){//visitFn, viewXml, forceUpdate){
	var _this = this;
	options = options || {};
	//var dfd = $.Deferred();
	var items = [];

	var iterate = function(){
		 	var listItemEnumerator = _this.listItems.getEnumerator();
		 	var index = 0;
		 	var i = 0;
		 	//debugger;
			while (listItemEnumerator.moveNext()) {
				var oListItem = listItemEnumerator.get_current();
				
				oListItem = _this.addFieldsToItem(oListItem, options.fieldsToLoad);
				
				items[items.length] = oListItem;

				if(func) {
					func(oListItem, index++);
				}
				
			}
			if(options.complete){
				options.complete(items);
			}

			return items;
			//console.log(badFields);
	}

	
	this.loadListItems({
		success: function success(){ 

			$.when(_this.listInfoPromise).done(function(){
				iterate();	
			});
		 }, 
		override: options.override,
		viewXml: options.viewXml,
		folderPath: options.folderPath,
		fieldsToLoad: options.fieldsToLoad
	});

	//return dfd;
	return items;
	
};

SpListUtil.prototype.getAllItems = function(options){
	this.each(0, {
			complete: function(items){
				if(options.success){
					options.success(items);
				}
			}
		});
};

SpListUtil.prototype.GetTermPrivateField = function(field){
	//var staticName = field.staticName;
	var ret = null;
    
	for(i in this.fields){
		var curField = this.fields[i];
		/*Need to find hidden note field which has display name of [fielddisplayname]_0*/
		if(curField.isHidden && curField.fType === "Note"){

			if(curField.displayName == field + "_0"){
				//console.log("found field: " + curField.staticName);
				return curField.staticName;
			}
		}
	}
};

SpListUtil.prototype.toSpDto = function(item, field){


	if(!field || !item){
		return item;
	}

	if(field.isReadOnly || field === "Attachments" || field.isHidden){
		return item;
	}

	//console.log("field: " + field)
	var type = field.fType;
	var ret = item;
	//console.log("in toSpDto " + field + type);
	if($.isArray(item)){
		//console.log("this is an array")
		var ret = [];

		var uDfd = $.Deferred();
		ret.uprom = uDfd.promise();
		var dfds = [];
		for(var i = 0; i < item.length; i++){
			
			try{
				var val = this.toSpDto(item[i], field);
					
				if(val){
					ret.push(val);
				}

				if(ret[i] && ret[i].uprom){
					dfds.push(ret[i].uprom);
				}
			} catch(e){
				debugger;
			}
		}

		$.when.apply($, dfds).done(function(){
			uDfd.resolve();
		}).fail(function(err){
			uDfd.reject(err);
		})


		//taxonomy field has to be serialized into a string
		if(type.indexOf("TaxonomyFieldType") > -1){
			ret2 = "";
			for(var i = 0; i < ret.length; i++){
				if(i == ret.length -1){
					ret2 += ret[i];
					continue;	
				} 
				ret2 += ret[i] + ";#"
			}
			//console.log(ret2);
			return ret2;
		} 


		return ret;

	} else {
		//console.log("this is an item");
		if(type == "User" || type == "UserMulti")	{
			//debugger;
			//console.log("this is a user");
			//console.log(item)
			 if (item.Id && item.Id != -1){
				var ret = new SP.FieldUserValue();
				ret.set_lookupId(item.Id);
				return ret;
			} else if(item.userName){
				var ret = SP.FieldUserValue.fromUser(item.userName);
				return ret;
			} 

			return null;
		} else if(type.indexOf("Lookup") > -1) {
			var ret = new SP.FieldLookupValue();
			ret.set_lookupId(item.ID);
			return ret;
		} else if(type.indexOf("TaxonomyFieldType") >  -1){
			
			if(item.termId && item.termName){
				return "-1;#" + item.termName + "|" + item.termId;
			} else {
				return null;
			}
		}
		else{
			//console.log("not user")
			return item;
		} 
	}
};


SpListUtil.prototype.prepareDto = function(props, oListItem){
	var dfds = [];
	var _this = this;
	var privateField;
	for(prop in props){
		//console.log("updating " + prop);
		var toAdd = _this.toSpDto(props[prop], _this.fields[prop]);
		
		if(toAdd != null && toAdd != undefined){
			var p = toAdd.uprom;

			dfds.push(p);
			delete toAdd["uprom"];
		}

		



		$.when(p).done(function(){ 

			//console.log("setting item: ");
			//console.log(toAdd);
			var field = _this.fields[prop];

			if(field.fType.indexOf("TaxonomyFieldType") > -1){
				var privateField = _this.GetTermPrivateField(field);
				if(privateField){
					oListItem.set_item(privateField, toAdd);
				}
			}

			oListItem.set_item(prop, toAdd);
		});
		
	}

	return dfds;
}

SpListUtil.prototype.create = function(props, options){
	var _this = this;
	options = options || {};
	

	this.onReady(function(){
		var itemCreateInfo = new SP.ListItemCreationInformation();
		
		if(options.type == "Folder"){
			itemCreateInfo.set_underlyingObjectType(SP.FileSystemObjectType.folder);
			itemCreateInfo.set_leafName(props.Title);
		}
		
		var oListItem = _this.list.addItem(itemCreateInfo);
		
		var dfds = _this.prepareDto(props, oListItem);

		$.when.apply($, dfds).done(function(){
			//console.log("about to update!");
			
			oListItem.update();
			_this.clientContext.load(oListItem);

			if(options.executeQuery !== false){
				_this.executeAndUpdateList(function(){
					oListItem = _this.addFieldsToItem(oListItem);
					if(options.success){
						options.success(oListItem);
					}
				}, function(a, b){
					//console.log("error creating item next line is item and error");
					//console.log(props);
					//console.log(b);
					if(options.error){
						options.error();
					}
				});
			} 
		}).fail(function(err){
			//console.log("error in creating spdto ljik")
			if(options.error){

				options.error(err);
			}
		})

		
	});

}

SpListUtil.prototype.remove = function(item, callbacks){
	if(item && item.deleteObject){
		callbacks = callbacks || {};
		item.deleteObject();
		this.clientContext.executeQueryAsync(function(){
			if(callbacks.success){
				callbacks.success();
			} 
		}, function(){
			if(callbacks.error){
				callbacks.error();
			}
		});
	}
};

SpListUtil.prototype.query = function(query, options){
	var viewXml = "<View",
	 _this = this,
	xmlQuery = "";

	if(options){
		$.extend(query, options);
	}

	query = query || {};

	if(query.ViewAttributes){
		viewXml += " " + query.ViewAttributes;
	}

	viewXml += ">";


	if(query.Query){
		viewXml += "<Query>";

		if(query.Query && query.Query.Where){
			viewXml = query.Query.Where ? viewXml + "<Where>[QRT]</Where>" : viewXml;
		}

		if(query.Query.OrderBy){
			var asc = query.Query.OrderBy.ascending;
			asc = asc === "FALSE" || asc === false ? "FALSE" : "TRUE";
			viewXml += "<OrderBy><FieldRef Name='" + query.Query.OrderBy.name + "' Ascending='" + asc + "' /></OrderBy>";
		}	

		if(query.Query.GroupBy){
			var asc = query.Query.GroupBy.ascending;
			asc = asc === "FALSE" || asc === false ? "FALSE" : "TRUE";
			viewXml += "<GroupBy><FieldRef Name='" + query.Query.GroupBy.name + "' /></GroupBy>";
		}	

		viewXml += "</Query>";

	}

	

	if(query.ViewFields){
		viewXml += "<ViewFields>";
		for(f in query.ViewFields){
			viewXml += "<FieldRef Name='" + query.ViewFields[f] + "'/>";
		}
		viewXml += "</ViewFields>"
	}


	if(query.RowLimit){
		viewXml += "<RowLimit>";
		viewXml += query.RowLimit;
		viewXml += "</RowLimit>";	
	}

	viewXml += "</View>";
	//console.log(viewXml);
	this.onReady(function(){
		
		var xmlQuery = "";	

		if(query.Query && query.Query.Where){

			if(typeof query.Query.Where == "object"){
				for(p in query.Query.Where){
					var obj = query.Query.Where[p]
					var val =  obj.Value || obj;
					var type = obj.Type || "Text";
					var comparison = obj.Comp || "Eq";
					var fieldName = p;
					
					xmlQuery = "<" + comparison + "><FieldRef Name='" + p + "' /><Value Type='" + type + "'>" + val + "</Value></" + comparison + ">";
					
					
				}
				//console.log(xmlQuery);
				
			} else{

				xmlQuery = query.Query.Where;
			}

			

			viewXml = viewXml.replace("[QRT]", xmlQuery);
		}

		var items;

		_this.each(0, {
			viewXml: viewXml,
			folderPath: query.folderPath,
			complete: function(items){
			
				if(query.complete){
					query.complete(items, query);
				}
			},
			fieldsToLoad: query.ViewFields
		});

	});


};

SpListUtil.prototype.filter = function(options){
	var options = $.extend({
		complete: function(){},
		override: false,
		items: null
	}, options);

	var results = [];
	
	var filterFunc = function(item){
		if(options.func(item) === true){
			results.push(item);
		}
	}

	if(items){
		for(i in items){
			var item = items[i];
			filterFunc(item);
		}
		options.complete(results);
		return results;
	} else{
		this.each(filterFunc, {
			override: options.override,
			complete: function(items){
				options.complete(results);
			}
		});
	}

}

var SpUserUtil = function(options){
	SpUtil.call(this, options)
	var _this = this;
	this.user = {};
	var init = function(){
		$.when(_this.initPromise).done(function(){
			_this.user = _this.web.get_currentUser();
			_this.clientContext.load(_this.user);
		});
	}
	init();
}

//SpUserUtil.prototype = Object.create(SpUtil.prototype);
SpUserUtil.prototype = new SpUtil();

SpUserUtil.prototype.findUser = function findUser(name, options){
	var _this = this;
	$.when(this.initPromise).done(function(){
		//var vals = SP.Utilities.Utility.searchPrincipals(_this.clientContext, _this.web, "a");
		vals = SP.Utilities.Utility.searchPrincipals(_this.clientContext, _this.web, name, SP.Utilities.PrincipalType.user, SP.Utilities.PrincipalSource.all, null, 100);

		_this.clientContext.executeQueryAsync(function(sender, args){
			if(options.success){
				options.success(vals);
			}
		});
				
	});


}


SpUserUtil.prototype.getGroupByName = function(options){
	var groupName = options.groupName;

	if(!groupName){
		if(options.error){
			options.err("No groupName provided");
		}
		return;
	}

	var _this = this;


	$.when(this.initPromise).done(function(){

			//var vals = SP.Utilities.Utility.searchPrincipals(_this.clientContext, _this.web, "a");
		_this.groups = _this.web.get_siteGroups();;
		_this.clientContext.load(_this.groups);
		_this.clientContext.executeQueryAsync(function(sender, args){

			var gE = _this.groups.getEnumerator();
			var id = -1;

			while(gE.moveNext()){
				var group = gE.get_current();
				var title = group.get_title();
				if(title == groupName){
					id = group.get_id();
					break;
				}
			}

			if(options.success){
				options.success(group);
			}

		}, function err (sender, args){
			alert("error in user util");
		});
	});	
};



SpUserUtil.prototype.getGroupById = function(options){
	var groupId = options.groupId;

	if(!groupId){
		if(options.error){
			options.err("No groupId provided");
		}
		return;
	}



	if(isNaN(groupId)){
		if(options.error){
			options.err("groupId provided is not a valid number");
		}
		return;	
	}

	var _this = this;


	$.when(this.initPromise).done(function(){

		var group = _this.web.get_siteGroups().getById(groupId);
		var userCollection = group.get_users()
		_this.clientContext.load(group);
		_this.clientContext.load(userCollection);
		_this.clientContext.executeQueryAsync(function(sender, args){

			
			if(options.success){
				options.success(group, userCollection);
			}

		}, function err (sender, args){
			if(options.error){
				options.error(sender);
			}
		});
	});	
};

SpUserUtil.prototype.isUserInGroup = function(options){
	
	var _this = this;

	var method = options.groupId ? "id" : "name";


	if(method == "id"){
		_this.getGroupById({
			groupId: options.groupId,
			success: function(group, users){
				var u = users.getEnumerator();
				var userLogin = _this.user.get_loginName();

				var done = function(result){
					if(options.success){
						options.success(result, group, users);
					}	
				}

				while(u.moveNext()){
					var curUser = u.get_current();
					if(curUser.get_loginName() === userLogin){
						done(true)
						return;
					}
				}
				done(false);
				return;
			},
			error: function(err){

				//most likely the current user doesn't have permissions to see the group
				if(options.success){
					options.success(false);
				}
			}
		});
	}

				
	

};



SpUserUtil.findUser = function(userString, options){
	var userUtil = new SpUserUtil();
   	userUtil.findUser(userString, options);	
}

/*
var userUtil = new SpUserUtil();
userUtil.findUser("mhijazi", {
	success: function(ret){
		
	}
});*/

