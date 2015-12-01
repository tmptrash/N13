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



### Example 1: How to create simple class:

```javascript
N13.define('App.Class');       // App object and App.Class function will be created

> App.Class;                   // Shows childConstructor, created by N13
> var cl = new App.Class;      // May be used with native new, if no dependencies needed
````


### Example 1: How to create static fields or static methods:

```javascript
N13.define('App.Drum', {
    statics: {
        title   : 'drum',
        getTitle: function () {
            return this.title; // 'this' points to App.Drum function
        }
    }
});

> App.Drum.title;              // Shows 'drum'
> App.Drum.getTitles();        // Shows 'drum'
```


### Example 2: Classic inheritance:

```javascript
N13.define('App.Drum', {       // Mixin - is a simple class
    getTitle: function () {return 'drum '}
});
N13.define('App.Bass', {
    extend  : 'App.Drum',      // extend keyword is used for inheritance
    getTitle: function () {    // callParent() calls getTitle from App.Drum
        return this.callParent() + '& bass';
    }
});

> var drum = new App.Bass;
> drum.getTitle();             // Shows 'drum & bass'
```


### Example 3: Class configuration:

```javascript
N13.define('App.Drum', {
    configs: {
        vol: 10                // This is how default value for config is set
    }
});

> var drum = new App.Drum;
> drum.vol;                    // Shows 10. Default value is used
> var drum = new App.Drum({vol: 20});
> drum.vol;                    // Shows 20. Default value is available in drum.configs.vol
> drum.setConfig({vol: 30});
> drum.vol;                    // Shows 30
```


### Example 4: Constructor method:

```javascript
N13.define('App.Drum', {
    init: function () {        // May be overridden in child class. callParent() is also supported
        console.log('boom');
    }
});

var drum = new App.Drum();     // Shows 'boom'
```


### Example 5: Simple mixin example:

```javascript
N13.define('App.Vocal', {      // This is our mixin. It's a simple class
    voice: function () {return 'aaa'}
});

N13.define('App.Drum', {
    mixins: {v: 'App.Vocal'},  // Here we include the mixin
    voice : function () {      // callMixin() is used for call voice() method from App.Vocal
        return this.callMixin('v') + ' boom';
    }
});
```


### Example 6: View class, which is inherited from Backbone.View:

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


### Example 7: Multiple inheritance with mixin:

```javascript
N13.define('Mixin', {method: function () {return ' mixed';}});
N13.define('Base',  {method: function () {return ' base'; }});

N13.define('App.Class', {        // App.Class is a function
    extend: 'Base',              // Parent class
    mixins: {mix: 'Mixin'},      // List of mixins
    method: function () {        // Overridden method
        return 'Hello' +
        this.callMixin('mix') +  // Calls method() from Mixin
        this.callParent();       // Calls method() from Base
    }
});


var cl = new App.Class();        // App.Class instantiation
cl.method();                     // Returns 'hello mixed base'

```