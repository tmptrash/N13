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



### Example 1: How to create static fields or static methods:

N13.define('App.Drum', {
    statics: {
        title   : 'drum',
        getTitle: function () {
            return this.title;
        }
    }
});

> App.Drum.title;       // Shows 'drum'
> App.Drum.getTitles(); // Shows 'drum'


### Example 2: Classic inheritance:

N13.define('App.Drum', {
    getTitle: function () {return 'drum '}
});
N13.define('App.Bass', {
    extend  : 'App.Drum',
    getTitle: function () {
        return this.callParent() + '& bass';
    }
});

> var drum = new App.Drum;
> drum.getTitle();  // Shows 'drum & bass'


### Example 3: View class, which is inherited from Backbone.View:

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
        this.cl1 = new App.Class1();
    }
});


var cl = new App.View({         // Instantiates class and calls init() method
    cfg: 'new value'            // Class configuration
});
cl.cfg;                         // Contains 'new value'

App.View.prop;                  // Contains 'hello'
App.View.func();                // Returns 'hello'
```


### Example 4: Multiple inheritance with mixin:

```javascript
N13.define('Mixin', {method: function () {return ' mixed';}});
N13.define('Base',  {method: function () {return ' base'; }});

N13.define('App.Class', {        // App.Class is a function
    extend: 'Base',              // Parent class
    mixins: {mix: 'Mixin'},      // List of mixins
    method: function () {        // Overridden method
        return 'Hello' +
        this.callMixin('mix') +  // Calls method() from Base
        this.callParent();       // Calls method() from Mixin
    }
});


var cl = new App.Class();        // App.Class instantiation
cl.method();                     // Returns 'hello mixed base'

```
