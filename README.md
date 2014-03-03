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

Our utility will can grab the following about your list upon initialization:
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

//note: using any of the utility functions will also get your list info if you haven't done so already

```

