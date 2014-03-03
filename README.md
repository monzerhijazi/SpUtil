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

var list = new SpListUtil("list_guid");

```
You now have access to your SharePoint list and can use all of itsutility functions!

###Get List Info