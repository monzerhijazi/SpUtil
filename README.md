SpUtil
======

A SharePoint JavaScript library which makes utilizing the SharePoint JSOM feel more natural via utility functions

There are 3 utility classes that will become available to you as soon as you include the SpUtil.js library:

1. SpUtil
2. SpListUtil
3. SpUserUtil

Each of these classes provide utility functions for many of the typical things we client side developers do with the SharePoint CSOM.

The **SpListUtil** functions are by far the most helpful as they allow you to do all sorts of things with lists.

##SpListUtil

###Initialize List###
You initialize your list via the following command: 

```
//by list title
var list = new SpListUtil("list_title");

//or by list GUID
var list = new SpListUtil("list_guid", { type: 'id' });

```
You now have access to your SharePoint list and can use all of its utility functions!

###Get List Info

Our utility can grab the following about your list upon initialization:

1. Your list's title
2. Your list's URL
3. Your list's ID
4. Your list's fields and their info
	* the field's type
	* the field's static name
	* the field's display name
	* if the field is required
	* if the field is hidden
	* the field's choices (for lookup and choice fields)
	* and more...

You can get this info in a couple ways:

```

//set the getListInfo option to true when initializing your list
var list2 = new SpListUtil("list_title", { 
	getListInfo: true,
	onInit: function(list){
		//do what you want with the list info
	}});

//use the getListInfo function
list.getListInfo(function(list){
	//do what you need to do
});

//note: using any of the other SpListUtil utility functions will also get your list info if you haven't done so already

```

##Get Item by ID
You can easily get an item by its ID
```
list.getItemById(1, {
	success: function(item){
		//access item values using dot notation
		alert(item.Title);
	}
});

When returning list items SpUtil will always create an object for you with all of its values accessible as properties using the field's static name. (yaay no more get_item calls!) 
So you can easily get the item's title by using the Title field's static name: item.Title.

This makes development so much easier because you're not stuck wondering if you have the right static name or not, much less trial and error.

##Getting all list items
```
list.getAllItems({
	success: function(items){
		//do what you want with array of items
		var i = items[0];
		alert(i.Title);
	}
});
```

##Iterate over all list items
You can call a list's .each command and pass a function which will get called on each item in that list. 
```
list.each(function(item){
	//do something with item
});

//you can also pass in a function which is called after the iteration is done
list.each(function(item){

}, {
	complete: function(items){
		//do something
	}
});
