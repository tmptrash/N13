N13
===

JavaScript Object Oriented Library. It supports:
 - mixin classes with inheritance
 - static properties and methods
 - string namespaces
 - classic inheritance
 - class configuration
 - constructor method
 - super method calls
 - mixin methods calls
 - dependencies loading
 - other libraries compatibility
 - simple utils



# Here is simple example of it:

```javascript
N13.define('App.View', {        // String namespace
    extend  : 'Backbone.View',  // Parent class
    statics : {
        prop: 'hello',          // Static property
        func: function () {     // Static method
            return this.prop;   // Correct this - App.Class
        }
    },
    configs : {cfg: 'default'}, // Сonfiguration property
    requires: ['App.Class1'],   // Will be loaded first
    init    : function () {     // Constructor function
        this.callParent();      // Calls Backbone.View::init()
    }
});

var cl = new App.View({         // Instantiates class
    cfg: 'new value'            // Class configuration
});
```
