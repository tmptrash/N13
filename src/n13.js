/**
 * This library emulates Object oriented features in JavaScript. It calls N13 and supports few important things.
 * Here they are:
 * - mixin classes with inheritance
 * - static properties and methods
 * - string namespaces
 * - classic inheritance
 * - class configuration
 * - constructor method
 * - super method calls
 * - mixin methods calls
 * - dependencies loading
 * - other libraries compatibility
 * - simple utils
 *
 * The main functions, which do the job is N13.define. It gets all the parameters and creates the class.
 * See it's description for details. Second, important function is N13.create(). It creates a class instance and loads
 * all dependencies asynchronously at the first time and just creates and return the instance at second.
 *
 * P.S. Inspired by ExtJs 4
 *
 * @author DeadbraiN
 * @email  tmptrash@mail.ru
 * @source https://github.com/tmptrash/N13
 */
(function (global) {
    /**
     * {Object} _config                  Configuration of N13 library. Is used in N13.init() method.
     * {Array}  _config.appRoot          Map of application name and application folder on server. e.g.:
     *
     *     N13.init({appRoot: [App: 'js']});
     *
     *                                   appRoot means the root folder of our application. In this case -
     *                                   'js'. Key - 'App' means the name of out application, which is
     *                                   used in all namespaces at the beginning. Example: App.view.Edit
     *                                   or App.util.String and so on. By default this value equals to
     *                                   App: 'js'
     *
     * {Boolean} _config.cache           Set to true and browser will be able to cache loaded files
     * {Number}  _config.timeout         Maximum timeout for loading of one file in milliseconds
     * {Number}  _config.timeoutInterval An interval in milliseconds, which is used for files timeout
     *                                   check. This is how we checks if some files haven't loaded
     *                                   during period of time set by _config.timeout
     * {String}  _config.baseUrl         URL of current html page without index file at the end. It
     *                                   also contains slash at the end.
     *                                   e.g: http://www.g.gl/do/index.html -> http://www.g.gl/do/
     * @private
     */
    var _config      = {
        appRoot        : ['App', 'js'],
        cache          : false,
        timeout        : 10000,
        timeoutInterval: 500,
        baseUrl        : (function () {
            var url     = document.location.href;
            var baseUrl = url.split('#');

            if (baseUrl.length > 1) {
                baseUrl.pop();
            }

            baseUrl = baseUrl[0].split('/');
            baseUrl.pop();

            return baseUrl.join('/') + '/';
        }())
    };
    /**
     * {RegExp} RegExp for class namespace. e.g. "App.view.Grid". Pattern: "Uppercase.lowercase.UpperCase" or
     * "Uppercase"
     * @private
     */
    var _nsRe         = /^([A-Z][A-Za-z0-9]*)(((\.[a-z][A-Za-z0-9]*)*\.[A-Z][A-Za-z0-9]*)?|(\.[A-Z][A-Za-z0-9]*)?)$/;
    /**
     * {Number} Amount of files, which are loading at the moment. Loading process should be started by N13.create()
     * function. This amount will be set into the amount of required files and will be decreased to zero. Zero means
     * that all dependencies has loaded and we can create full classes.
     * @private
     */
    var _filesLoading = 0;
    /**
     * @private
     * {Boolean} true if user has called N13.create() and now required files (dependencies) are loading.
     */
    var _isCreating  = false;
    /**
     * {Object} The map of classes, which are loading at the moment. It contains all deep dependencies.
     * Key is a class name (e.g. App.Class), value is a time, when loading of this class has started.
     * It's used for loading timeout check.
     * @private
     */
    var _loadClasses = {};
    /**
     * @private
     * {Number} Id for setInterval() function, which checks file loading timeout expiration
     */
    var _loadTimerId = null;
    /**
     * @private
     * {Function} This callback will be called when all dependencies will be loaded.
     */
    var _loadCallback;
    /**
     * @private
     * {Object} Scope for _loadCallback callback
     */
    var _loadScope;
    /**
     * @private
     * {Array} FIFO Stack of parameters of N13.create() calls. They will be called one by one from this stack. We need for
     * stack, because this library doesn't load two or more classes at the same time. So, we load all dependencies
     * for first N13.create() and only after that next N13.create() will be called (from stack) and so on. This case
     * is actual for code like this:
     *
     *     N13.create('App.Class1');
     *     N13.create('App.Class2');
     *     ...
     *
     * For single N13.create() calls, this variable will not be used.
     */
    var _createStack = [];


    /**
     * All these variables are shortcuts for the appropriate N13.xxx methods.
     * e.g.: isObject is a shortcut to N13.isObject
     */
    var isString;
    var isFunction;
    var isArray;
    var isObject;
    var emptyFn;
    var create;
    var ns;


    /**
     * Returns true if specified class was created with N13.define() function
     * @param {String} cl Class full name. e.g.: 'App.Class'
     * @returns {Boolean}
     * @private
     */
    function _isN13Class(cl) {
        var parts = cl.split('.');

        return parts[0] === _config.appRoot[0];
    }

    /**
     * Loads required class file into the DOM and run it. If class file has already loaded, then it returns true.
     * It returns false, if some files haven't loaded and wil be loaded soon asynchronously.
     * Callback function will be called in any case.
     *
     * @param {String|Array} cl Class name. e.g.: 'App.Class'
     * @param {Function|undefined} callback Will be called after file will load
     * @param {Object} scope Scope for callback function
     */
    function _require(cl, callback, scope) {
        var clFunc = ns(cl, false);

        _onLoadStart(callback, scope);
        //
        // If current class has already loaded
        //
        if (clFunc && clFunc.prototype.finished) {
            _onLoadEnd();
        } else {
            _loadClass(cl);
        }
    }

    /**
     * @private
     * Converts class name (or class names array) to the file path (or path's array). e.g.: 'App.Class' -> 'js/Class.js'
     * @param {String|Array} classes Class name or names array. e.g.: 'App.Class' or ['App.Class', 'App.Utils']
     * @return {String|Array} path to the file or array of path's. e.g.: 'js/Class.js' or ['js/Class.js', 'js/Utils.js']
     */
    function _classToFile(classes) {
        classes   = isString(classes) ? [classes] : classes;
        var app   = _config.appRoot[0];
        var files = [];
        var i;
        var len;
        var file;
        var cl;

        for (i = 0, len = classes.length; i < len; i++) {
            cl = classes[i];
            //
            // We should skip all empty class names
            //
            if (cl) {
                file = classes[i].split('.');
                //
                // Cut App part from namespace and replace it by application folder. e.g.: 'App.util.String' -> 'js.util.String'
                //
                if (file[0] === app) {
                    file.shift();
                }
                files.push(file.join('/'));
            }
        }

        return files.length === 1 ? files[0] : files;
    }

    /**
     * Callback function, which will be called for every asynchronously loaded script. This callback is a guaranty of
     * that the file was loaded and translated by JS interpreter fully to the end.
     * @param {String} cl Full class name win namespace. e.g. "App.xxx.Class"
     * @private
     */
    function _onFileLoaded(cl) {
        //
        // File has loaded and we need to remove it's loading time
        // from time map, otherwise, N13 may trows a timeout error.
        //
        delete _loadClasses[cl];
        //
        // All files have already loaded
        //
        if (!(--_filesLoading)) {
            _onLoadEnd();
        }
    }

    /**
     * Calls before N13.create() calls. It starts the loading timer checker
     * @param {Function|undefined} cb Callback function, which will be called when all dependencies will be loaded
     * @param {Object} scope Scope for callback
     * @private
     */
    function _onLoadStart(cb, scope) {
        _isCreating    = true;
        _loadTimerId   = setInterval(_onFileLoadTimer, _config.timeoutInterval);
        _loadCallback  = cb || emptyFn;
        _loadScope     = scope;
    }

    /**
     * Calls after all dependencies will be loaded. Stops the interval checker and call final callback function
     * @private
     */
    function _onLoadEnd() {
        _isCreating = false;
        clearInterval(_loadTimerId);
        _loadClasses = {};
        _loadCallback.call(_loadScope);
    }

    /**
     * Calls with small period during asynchronous dependency loading and checks if loading timeout for every file is
     * not over. If it's over, then it rises an exception and stops polling.
     * @private
     */
    function _onFileLoadTimer() {
        var time   = (new Date()).getTime();
        var cl;

        for (cl in _loadClasses) {
            if (_loadClasses.hasOwnProperty(cl)) {
                if (time - _loadClasses[cl] > _config.timeout) {
                    clearInterval(_loadTimerId);
                    throw new Error('During the dependency loading, file ' + cl + ' hasn\'t loaded within timeout ' + _config.timeout + 'ms');
                }
            }
        }
    }

    /**
     * This is asynchronous files loader. It takes a class and loads it and all it's dependencies. After that, it create
     * full class function and we can use new operator for this.
     * @param {String} cl Name of the class. e.g.: 'App.Class'
     * @private
     */
    function _loadClass(cl) {
        var baseUrl = _config.baseUrl;

        /**
         * @private
         * This method inserts specified class(file) into the DOM. It creates <script> tag for that.
         * It works only for our classes. For example it doesn't work for Backbone.Model or any third party classes.
         * @param {String} cl Name of the class
         */
        function insertScript(cl) {
            if (_isN13Class(cl) && !_loadClasses[cl]) {
                var node = document.createElement('script');
                var head = document.getElementsByTagName('head')[0] || document.firstChild;

                node.type    = 'text/javascript';
                node.charset = 'utf-8';
                node.async   = true;
                node.src     = baseUrl + _config.appRoot[1] + '/' + _classToFile(cl) + '.js' + (_config.cache ? '?u=' + (new Date()).getTime() : '');

                head.appendChild(node);
                _filesLoading++;
                _loadClasses[cl] = (new Date()).getTime();
            }
        }

        /**
         * Loads classes recursively. It takes all dependencies and calls insertScript() for them. So all required
         * classes will be loaded.
         * @param {Array} classes Array of class names
         */
        function loadClasses(classes) {
            var i;
            var len;
            var cl;

            if (classes) {
                for (i = 0, len = classes.length; i < len; i++) {
                    cl = ns(classes[i], false);
                    if (isFunction(cl)) {
                        loadClasses(ns(classes[i], false).prototype.requires);
                    } else {
                        insertScript(classes[i]);
                    }
                }
            }
        }


        loadClasses(isArray(cl) ? cl : [cl]);
        //
        // All scripts have already loaded
        //
        if (!_filesLoading) {
            _onLoadEnd();
        }
    }


    /**
     * @global
     * {Object} Main namespace of N13 library. It available as a property in window
     * object or simply like N13.
     */
    global.N13 = global.N13 || {
        /**
         * @property
         * {String} Version in format Major.Minor
         */
        version: '0.2',
        /**
         * {Function} Just empty function. We don't need to create new functions all the time.
         * We should use one function instead.
         */
        emptyFn: emptyFn = function emptyFn() {},

        /**
         * Returns true, if specified argument is a function type
         * @param {Object} f Argument to check
         * @return {Boolean}
         */
        isFunction: isFunction = function isFunction(f) {
            return 'function' === typeof f;
        },

        /**
         * Returns true, if specified argument is a string type
         * @param {Object} s Argument to check
         * @return {Boolean}
         */
        isString: isString = function isString(s) {
            return Object.prototype.toString.call(s) === '[object String]';
        },

        /**
         * Returns true, if specified argument is an array type
         * @param {Object} a Argument to check
         * @return {Boolean}
         */
        isArray: isArray = function isArray(a) {
            return Object.prototype.toString.call(a) === '[object Array]';
        },

        /**
         * Returns true, if specified argument is an object type
         * @param {Object} obj Argument to check
         * @return {Boolean}
         */
        isObject: isObject = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Object]';
        },

        /**
         * Set N13 configuration. See _config at the file beginning for details.
         * @param {Object} cfg Configuration
         */
        init: function (cfg) {
            var i;

            for (i in cfg) {
                if (cfg.hasOwnProperty(i)) {
                    _config[i] = cfg[i];
                }
            }
        },

        /**
         * Parses specified namespace string and returns objects chunk. For example, if ns === 'App.view.Widget',
         * then this method will return this function: App.view.Widget // N13.isFunction(App.view.Widget) === true
         * @param {String|Function} namespace
         * @param {Boolean} createFn If true, then creates empty function at the end of namespace, false -
         * doesn't create an empty object at the end, undefined - creates empty object at the end.
         * @return {Object|Function|Boolean} false if namespace wasn't created before and createFn === false,
         * Function if createFn === true, Object if createFn was undefined.
         */
        ns: ns = function ns(namespace, createFn) {
            var obj;
            var nsArr;
            var i;
            var len;
            var lenButOne;
            var item;

            if (!isString(namespace)) {
                return namespace;
            }

            obj   = global;
            nsArr = namespace.split('.');
            if (nsArr.length === 1 && createFn) {
                item = obj[nsArr[0]] = function emptyClass() {};

                return item;
            }
            for (i = 0, len = nsArr.length, lenButOne = len - 1; i < len; i++) {
                item = nsArr[i];
                if (obj[item] === undefined || i === lenButOne) {
                    if (createFn && i === lenButOne) {
                        //
                        // We must create new function every time. We shouldn't use N13.emptyFn.
                        //
                        //noinspection JSHint
                        obj[item] = function emptyClass() {};
                    } else {
                        if (obj[item] === undefined) {
                            if (createFn === false) {
                                return false;
                            }
                            obj[item] = {};
                        }
                    }
                }
                obj = obj[item];
            }

            return obj;
        },

        /**
         * Defines new class (Function) in specified namespace with mixins, statics and so on. You should use
         * string names for classes instead of functions. Class will be created asynchronously if parent class or it's
         * dependencies weren't created yet. Synchronously - otherwise. In case, then parent class or dependencies weren't
         * created they will be loaded with RequireJs library. Important moment here is that all dependencies like
         * parent, mixins and requires will not be loaded until N13.create() will be called.
         *
         * For example, lets create some string class with all these features:
         *
         *     N13.define('App.util.String', {
         *         extend : 'App.util.Observable',
         *         mixins : {format: 'App.util.Format', ...},
         *         statics: {format: function (str) {...}, ...},
         *         config : {maxLen: 256},
         *
         *         method : function () {...},
         *         prop   : 123,
         *         ...
         *     });
         *
         *     //
         *     // This is how we can create the instance of our string class, if all dependencies were loaded
         *     //
         *     var str = new App.util.String();
         *     //
         *     // This is how we can obtain name of the class
         *     //
         *     str.className; // 'App.util.String'
         *
         * May be you mentioned, that all class names in this example - are strings (e.g.: 'App.util.String'). N13 uses "ns"
         * method for parsing strings like this. This method creates all nested namespaces as objects if they weren't created
         * before. By the way, you can use it directly:
         *
         *     N13.ns('App.util.String');        // returns window.App.util.String object, but not a function!
         *     N13.ns('App.util.String', false); // returns window.App.util object
         *     N13.ns('App.util.String, true);   // returns window.App.util.String function
         *
         * In the example above, N13.define creates "App.util" object in global scope and adds new property "String" into this
         * namespace. After that, class App.util.String will be inherited from App.util.Observable. Then, all unique methods/props
         * from App.util.Format mixin will be copied into the class. The same story with statics. They will be added into
         * the App.util.String class as well. Every property from config section will be added into the prototype as default
         * values. And finally "method" and "prop" will be also copied into the App.util.String prototype.
         *
         * Okay, lets check another examples more deeply. How about extension details? Let's create simple class Parent and it's
         * child class called - Child. We need Child < Parent inheritance and super methods access through "base" property. Also,
         * you can access to self property to obtain reference to the constructor function (see example below).
         *
         *     //
         *     // If extend wasn't specified, then Function based class will be created as a parent
         *     //
         *     N13.define('Parent', {
         *         method: function () {return this.prop;},
         *         prop  : 'parent'
         *     });
         *
         *     //
         *     // We can use "base" property for access to super methods. See method for details
         *     //
         *     N13.define('Child', {
         *         extend : 'Parent',
         *         method : function () {return this.prop + '-' + Child.base.method.call(this);},
         *         prop   : 'child'
         *     });
         *
         *     var child = new Child();
         *     child.prop;           // 'child'
         *     child.method();       // 'child-child' - because prop was overridden in Child class
         *     child.self === Child; // true
         *     Child.base.prop;      // 'parent'
         *
         * What about mixins? As you remember mixin is a special class which will be injected into the destination class.
         * So, this is how we create multiple inheritance. Let's create mixin class and add it into the ChildWithMixin
         * class. This example uses Parent class from previous example:
         *
         *     N13.define('Mixin', {
         *         //
         *         // "this" property will be pointed to the ChildWithMixin instance
         *         //
         *         mixinMethod: function () {return this.mixinProp;},
         *         mixinProp  : 'mixin'
         *     });
         *     N13.define('ChildWithMixin', {
         *         extend : 'Parent', // from previous example
         *         mixins : {mix: 'Mixin'}
         *     });
         *
         *     var child = new ChildWithMixin();
         *     child.mixinMethod(); // 'mixin'
         *     child.method();      // 'parent'
         *
         * Important note about mixins, that all methods/properties from mixins will not be added if destination class
         * already has these methods/properties. Here is an example:
         *
         *     N13.define('Mixin', {
         *         method: function () {return this.prop;},
         *         prop  : 'mixin'
         *     });
         *     N13.define('Class', {
         *         mixins: {mix: 'Mixin'},
         *         method: function () {return this.prop;},
         *         prop  : 'class'
         *     });
         *
         *     var child = new Class();
         *     //
         *     // method() from Class and not from Mixin
         *     //
         *     child.method(); // 'class'
         *     //
         *     // prop from Class and not from Mixin
         *     //
         *     child.prop;     // 'class'
         *
         * To fix this, we should use special property called "mixins" and unique property names. Example:
         *
         *     N13.define('Mixin', {
         *         method : function () {return this.mixProp;},
         *         mixProp: 'mixin'
         *     });
         *     N13.define('Class', {
         *         mixins: {mix: 'Mixin'},
         *         method: function () {return this.mixins.mix.method.call(this);},
         *         prop  : 'class'
         *     });
         *
         *     var child = new Class();
         *     child.method(); // 'mixin'
         *     child.prop;     // 'class'
         *     child.mixProp;  // 'mixin'
         *
         * As you can see reference to the "method" method from mixin is to long. We can use short version of this,
         * using special callMixin() method. For example:
         *
         *     N13.define('Mixin', {
         *         method : function () {return this.mixProp;},
         *         mixProp: 'mixin'
         *     });
         *     N13.define('Class', {
         *         mixins: {mix: 'Mixin'},
         *         //
         *         // Call "method" method from Mixin by it's short name - "mix"
         *         //
         *         method: function () {return this.callMixin('mix');},
         *         prop  : 'class'
         *     });
         *
         *     var child = new Class();
         *     child.method(); // 'mixin'
         *     child.prop;     // 'class'
         *     child.mixProp;  // 'mixin'
         *
         * We can use callMixin() method with different parameters. For example we can set the name of the method
         * within mixin: this.callMixin('mix', 'otherMethod') or use some arguments: this.callMixin('mix', [1,2,3]) or
         * with special method name: this.callMixin('mix', 'otherMethod', [1,2,3])
         *
         * Next example regarded to the static members and properties. This is analog of static members and properties
         * in other OOP languages like C++ or Java. One tip about statics is we don't need to create class instance for
         * accessing to the properties and methods. Let's create class with statics:
         *
         *     N13.define('Class', {
         *         statics: {
         *             method: function () {return this.prop;},
         *             prop  : 'static'
         *         }
         *     });
         *
         *     var cl = new Class();
         *     cl.self.method(); // 'static'
         *     cl.self.prop;     // 'static'
         *     Class.method();   // 'static'
         *     Class.prop;       // 'static'
         *
         * Next item i want to speak about is configuration. We can change behavior of the class if we change it's
         * configuration. In case of inheritance (e.g.: Child extend Parent) configuration from child class will
         * override parent's configuration. All config parameters are passed into the instance, not the prototype.
         * Let's imagine, that we have a class with two configuration parameters:
         *
         *     //
         *     // "value1" and "value2" will be used as default values
         *     //
         *     N13.define('App.Class', {
         *         configs: {
         *             cfg1: 'value1',
         *             cfg2: 'value2'
         *         }
         *     });
         *
         *     var cl  = new App.Class();
         *     var cl1 = new App.Class({cfg1: 'hello'});
         *     cl.cfg1;  // 'value1'
         *     cl.cfg2;  // 'value2'
         *     cl1.cfg1; // 'hello'
         *     cl1.cfg2; // 'value2'
         *
         * What about constructor? You can specify your own construct function using "init" property. If it's
         * skipped, then default constructor will be called. The constructor is a simple function, which is called
         * every time you create the class instance. You can call superclass constructor as well also. Example:
         *
         *     N13.define('App.Parent', {
         *         init: function () {console.log('parent');}
         *     });
         *     N13.define('App.Child', {
         *         extend : 'App.Parent',
         *         init   : function () {
         *             console.log('child');
         *             //
         *             // We can use short variant of this: this.callParent(arguments) to call init() method from App.Parent
         *             //
         *             App.Child.base.init.call(this);
         *         }
         *     });
         *
         *     var cl = new App.Child(); // 'child\nparent'
         *
         * What about dependencies? We can set any amount of dependencies in our class. Dependencies are: a parent class,
         * mixin classes and require classes. You already know about parent and mixins classes. Let's talk about requires.
         * They are used for aggregation: if some class uses or create an instance inside of it's methods. For example:
         *
         *     N13.define('Class', {
         *         requires: ['Util'],
         *         init    : function () {
         *             //
         *             // Aggregation example. At the moment when init() method will be run, Util class will be already loaded
         *             //
         *             this.util = new Util();
         *         }
         *     });
         *
         *     N13.create('Class', function(cl) {
         *         // Do something with Class instance - cl
         *     });
         *
         * Important moment here is N13.create() method. It creates an instance and loads all dependencies asynchronously.
         * See N13.create description for details.
         *
         * The last thing i wanted tell about is instantiating. JavaScript has a special operator for that. It calls
         * "new". This library uses similar approach, but reserves first argument of the constructor. Let's create
         * some class:
         *
         *     N13.define('Class', {
         *         configs: {cfg: 'default'},
         *         prop   : 'prop',
         *         method : function () {return 'method';}
         *     });
         *
         *     var cl  = new Class();
         *     var cl1 = new Class({cfg: 'new', prop: 'newProp', method: N13.emptyFn});
         *
         *     cl.cfg;       // 'default'
         *     cl.prop;      // 'prop'
         *     cl.method();  // 'method'
         *     cl1.cfg;      // 'new'
         *     cl1.prop;     // 'newProp'
         *     cl1.method(); // undefined
         *
         * @param {String}    child Name of the child class or it's function
         * @param {Object=}   props Class configuration. A map of properties and methods of this class.
         * @return {Function} Function if parent class was already loaded, undefined if not
         */
        define: function define(child, props) {
            if (!_nsRe.test(child)) {
                throw new Error('Invalid class name "' + child + '" in N13.define() method. Pattern: "UpperCase.lowercase.UpperCase".');
            }
            if (props !== undefined && !N13.isObject(props)) {
                throw new Error('Invalid prototype argument in N13.define() method. Object is required.');
            }

            props          = props || {};
            var emptyClass = function emptyClass() {};
            var parent     = props.extend || emptyClass;
            var childNs    = child;
            var childCl    = child;
            var childStr;
            var childArr;
            var childProto;

            /**
             * @private
             * Classical inheritance. Adds "self" and "base" properties into the class and connects
             * child and parent classes by prototype inheritance. Also important, that first argument
             * of new operator is always configuration. Example: var cl = new Class({...}, <custom arguments>)
             * @param {Function} parent Parent class
             * @param {Function} child Child class
             * @param {Object} properties Properties sent by second parameter in N13.define method
             * @return {Function} New child class inherited from parent
             */
            function extend(parent, child, properties) {
                /**
                 * We need this wrapper for parsing of configuration, which is passed by first
                 * argument in new operator. This configuration will be applied into the instance,
                 * not in prototype. Also, this wrapper calls the constructor function stored in
                 * "init" property.
                 * @param {Object} config Class configuration
                 * @return {Object} Class instance
                 */
                var childConstructor = function childConstructor(config) {
                    var ctor = properties.hasOwnProperty('init') ? properties.init : undefined;
                    var c;
                    var cfg;

                    for (c in config) {
                        if (config.hasOwnProperty(c)) {
                            cfg = config[c];
                            if (isFunction(cfg)) {
                                //
                                // Name of the property, where we store current function name. It will be used in
                                // callParent() method, which calls same method from parent class.
                                //
                                cfg.fn   = c;
                                //
                                // Here we must use this.self.base instead child.base
                                //
                                cfg.base = this.self.prototype;
                                //
                                // Save reference to current class
                                //
                                cfg.cl   = this.self.prototype;
                            }
                            this[c] = cfg;
                        }
                    }
                    return (this.init || ctor || parent).apply(this, arguments);
                };
                var childProto;
                var oldProto;

                function F() {}
                F.prototype                            = parent.prototype;
                childConstructor.prototype             = new F();
                childConstructor.prototype.constructor = childConstructor.prototype.self = childConstructor;
                //
                // You can use it for accessing to the parent class. See N13.define() comment for details
                //
                childConstructor.base                  = parent.prototype;

                childProto                             = childConstructor.prototype;
                oldProto                               = child.prototype;
                //
                // All these properties are used for post inheritance and dependency loading. Post inheritance means
                // that inheritance and dependency loading will be started on N13.create() and not in N13.define().
                //
                childProto.className                   = oldProto.className;
                childProto.setConfig                   = oldProto.setConfig;
                childProto.requires                    = oldProto.requires;
                childProto.props                       = oldProto.props;
                childProto.childStr                    = oldProto.childStr;
                childProto.childNs                     = oldProto.childNs;
                childProto.applyProps                  = oldProto.applyProps;
                childProto.inherit                     = oldProto.inherit;
                childProto.parent                      = oldProto.parent || undefined;

                return childConstructor;
            }

            /**
             * @private
             * Applies properties to new created class and call feature handlers for special parameters
             * like mixins, statics, extend and so on.
             * @param {Function} cl Class we need to apply
             * @param {Object}   cl.base Reference to the parent's prototype
             * @param {Object} properties Properties
             */
            function applyProperties(cl, properties) {
                /**
                 * @private
                 * Statics properties/methods handler. Adds statics into the class function. Analog of
                 * statics in other OOP languages. Example:
                 *
                 *     N13.define('Class', {
                 *         statics: {
                 *             prop  : 1,
                 *             method: function () {return this.prop;}
                 *         }
                 *     });
                 *
                 *     Class.prop;     // 1
                 *     Class.method(); //
                 *
                 * @param {Function} cl      Class, we need statics to add
                 * @param {Object}   cl.base Reference to the class parent's prototype
                 * @param {Object}   statics Statics map
                 */
                function addStatics(cl, statics) {
                    var s;
                    var stat;

                    for (s in statics) {
                        if (statics.hasOwnProperty(s)) {
                            stat = statics[s];
                            if (cl[s] === undefined) {
                                if (isFunction(stat)) {
                                    //
                                    // Name of the property, where we store current function name. It will be used in
                                    // callParent() method, which calls same method from parent class.
                                    //
                                    stat.fn   = s;
                                    stat.base = cl.base;
                                    stat.cl   = cl.prototype;
                                }
                                cl[s] = stat;
                            }
                        }
                    }
                }

                /**
                 * @private
                 * Mixin classes handler. Adds methods/properties from mixins to the class function. Analog of
                 * mixins in other OOP languages. If some methods/properties are already exist, then they
                 * will be skipped. Very important moment here is that All methods will be copied, except init()
                 * and destroy(). These methods should be called using callMixin() method or manually, using
                 * self or class function (Class.prototype.destroy.apply(this, [args])) Example:
                 *
                 *     N13.define('Mixin', {
                 *         mixMethod: function () {return this.mix;},
                 *         mix      : 'mixin'
                 *     });
                 *     N13.define('Class', {
                 *         mixins: {
                 *             mix: 'Mixin'
                 *         }
                 *     });
                 *
                 *     var cl = new Class();
                 *     cl.mixMethod()  // 'mixin'
                 *     cl.mix;         // 'mixin'
                 *
                 * @param {Function} cl         Class, we need mixins to add
                 * @param {Object}   cl.base    Reference to the class parent's prototype
                 * @param {Object}   mixins     Mixins map
                 * @param {Object}   properties Properties sent by second parameter in N13.define method
                 */
                function addMixins(cl, mixins, properties) {
                    var clProto  = cl.prototype;
                    var protoMix = clProto.mixins = {};
                    var m;
                    var i;
                    var mixinProto;
                    var mixin;
                    var mixinCl;
                    var mixinBase;
                    var configs;
                    var cfg;

                    for (i in mixins) {
                        if (mixins.hasOwnProperty(i)) {
                            //
                            // Save mixins map in the "mixins" property
                            //
                            mixinCl     = ns(mixins[i]);
                            mixinBase   = mixinCl.base;
                            protoMix[i] = mixinProto = mixinCl.prototype;

                            for (m in mixinProto) {
                                mixin = mixinProto[m];

                                //
                                // It's possible to apply configuration from mixin. If main class doesn't
                                // contain properties, which mixin does, then they may be copied into main one
                                //
                                if (m === 'configs') {
                                    configs = properties.configs = properties.configs || {};
                                    //
                                    // Walks through config properties and apply only unique for main class
                                    //
                                    for (cfg in mixin) {
                                        //
                                        // Applies config only if main class doesn't contain same config
                                        //
                                        if (mixin.hasOwnProperty(cfg) && configs[cfg] === undefined) {
                                            configs[cfg] = mixin[cfg];
                                        }
                                    }
                                    //
                                    // We should copy mixed method, only in case when main class doesn't contain them
                                    //
                                } else if (!clProto.hasOwnProperty(m) && properties[m] === undefined && m !== 'init' && m !== 'destroy') {
                                    if (isFunction(mixin)) {
                                        //
                                        // Name of the property, where we store current function name. It will be used in
                                        // callParent() method, which calls same method from parent class.
                                        //
                                        mixin.fn   = m;
                                        //
                                        // Important!!! If current class uses mixin with some hierarchy inside and
                                        // current class has no some method (e.g.: method()) which mixin has,
                                        // then if later we call callParent() in the method() of current class,
                                        // super method from mixin will be called. You should understand, that
                                        // if current class contains this method in superclass, it will not be
                                        // called.
                                        //
                                        mixin.base = mixinBase.hasOwnProperty(m) ? mixinBase : cl.base;
                                        mixin.cl   = mixinCl.prototype;
                                    }
                                    clProto[m] = mixin;
                                }
                            }
                        }
                    }
                }

                /**
                 * @private
                 * Configuration handler. Adds configuration properties into the class prototype. You should use
                 * special property for this called "configs".
                 * Here is an example:
                 *
                 *     N13.define('App.Class', {
                 *         configs: {
                 *             cfg1: 'value1',
                 *             cfg2: 'value2'
                 *         }
                 *     });
                 *
                 *     var cl  = new App.Class();
                 *     var cl1 = new App.Class({cfg1: 'hello'});
                 *     cl.cfg1;  // 'value1'
                 *     cl.cfg2;  // 'value2'
                 *     cl1.cfg1; // 'hello'
                 *     cl1.cfg2; // 'value2'
                 *
                 * @param {{base: Object}} cl Class, we need configs to add
                 * @param {Object} configs Configuration object
                 */
                function addConfigs(cl, configs) {
                    var clProto = cl.prototype;
                    var cfg;
                    var config;

                    for (cfg in configs) {
                        if (configs.hasOwnProperty(cfg)) {
                            config = configs[cfg];
                            //
                            // Name of the property, where we store current function name. It will be used in
                            // callParent() method, which calls same method from parent class.
                            //
                            if (isFunction(config)) {
                                config.fn   = cfg;
                                config.base = cl.base;
                                config.cl   = cl.prototype;
                            }
                            clProto[cfg] = config;
                        }
                    }
                    //
                    // We should store original configuration in prototype
                    //
                    clProto.configs = configs;
                }


                var proto    = cl.prototype;
                //
                // Here is a map of supported Object Oriented features. This list shouldn't contain "extend" property,
                // because we need it later for inheritance.
                //
                var features = {
                    statics : addStatics,
                    mixins  : addMixins,
                    configs : addConfigs,
                    //
                    // We need only exclude "requires" property from child class, because we already have processed it.
                    //
                    requires: emptyFn
                };
                var property;
                var p;


                for (p in properties) {
                    if (properties.hasOwnProperty(p)) {
                        property = properties[p];
                        //
                        // This is features handler. If current property is a feature (e.g.: mixins, statics,...), then
                        // it calls special handler function, which do the job (e.g.: adds all mixins into the class).
                        // Finally, this property will not appear in the class.
                        //
                        if (features.hasOwnProperty(p)) {
                            features[p](cl, property, properties);
                        } else {
                            if (isFunction(property)) {
                                //
                                // Name of the property, where we store current function name. It will be used in
                                // callParent() method, which calls same method from parent class.
                                //
                                property.fn   = p;
                                property.base = cl.base;
                                property.cl   = cl.prototype;
                            }
                            proto[p] = property;
                        }
                    }
                }

                /**
                 * {Boolean} It means that this class is fully created. It also means that all dependencies has loaded.
                 */
                proto.finished = true;
            }

            /**
             * Do main job - makes a child class
             * @param {Function} parent Parent class
             * @param {String} childNs Namespace of child class. e.g.: App.view.Widget -> 'App.view'
             * @param {String} childStr Name of child class. e.g.: 'Widget'
             * @return {Function} Updated child class
             */
            function inherit(parent, childNs, childStr) {
                var parentName;

                if (isString(parent)) {
                    parentName = parent;
                    parent     = ns(parent, false);
                    if (parent === false) {
                        throw new Error('Child class (' + (childNs ? childNs + '.' : '') + childStr + ') has undefined parent class (' + parentName + ').');
                    }
                }

                //
                // Classical inheritance: child extends parent.
                //
                ns(childNs || global)[childStr] = child = extend(parent, child, props);

                /**
                 * Add callParent() method. It will be used for calling of method from parent class. Example:
                 *
                 *   N13.define('App.Parent', {
                 *       init: function () {
                 *           console.log('Parent');
                 *       }
                 *   });
                 *   N13.define('App.Child', {
                 *       extend : 'App.Parent',
                 *       init   : function () {
                 *           console.log('Child');
                 *           this.callParent(arguments);
                 *       }
                 *   });
                 *
                 *   var ch = new App.Child(); //Child\nParent
                 *
                 * @param {Array=} args Array of arguments
                 * @return {Object|undefined} Depends on parent method
                 */
                child.prototype.callParent = function callParent(args) {
                    //noinspection JSHint
                    var caller = arguments.callee.caller;

                    if (caller.base) {
                        if (caller.base[caller.fn]) {
                            //noinspection JSHint
                            return caller.base[caller.fn].apply(this, args);
                        } else {
                            parent = caller.base.parent && caller.base.parent.init || caller.base.constructor;
                            if (parent) {
                                return parent.apply(this, args);
                            }
                        }
                    }

                    return undefined;
                };

                /**
                 *   N13.define('App.Mixin', {
                 *       init: function () {
                 *           console.log('Mixin');
                 *       }
                 *   });
                 *   N13.define('App.Class', {
                 *       mixins: {mix: 'App.Mixin'},
                 *       init  : function () {
                 *           console.log('Child');
                 *           this.callMixin('mix');
                 *       }
                 *   });
                 *
                 *   var cl = new App.Class(); // Child\nMixin
                 *
                 * @param {String} mixin Name of the mixin's shortcut
                 * @param {String|Array=} method Name of the method within mixin class. undefined if call
                 * the same method. Array if call the same method with this array as arguments.
                 * @param {Array=} args Array of arguments or undefined if no arguments
                 * @return {Object} method related value
                 */
                child.prototype.callMixin = function callMixin(mixin, method, args) {
                    //noinspection JSHint
                    var caller = arguments.callee.caller;
                    var mix    = caller.cl.mixins[mixin];

                    //noinspection JSHint
                    method = isString(method) ? method : caller.fn;
                    args   = isArray(args) ? args : isArray(method) ? method : [];

                    //
                    // It's possible, that mixin or method is(are) undefined
                    //
                    if (!mix) {
                        throw new Error('Invalid mixin "' + mixin + '" in method callMixin() in class "' + this.className + '"');
                    }
                    if (!mix[method]) {
                        throw new Error('Invalid method "' + method + '" of mixin: "' + mixin + '" in class "' + this.className + '"');
                    }
                    return mix[method].apply(this, args);
                };

                return child;
            }

            /**
             * @private
             * Appends one require file at the end of requires list (array). Requires list - it's a dependencies list
             * of classes for current child class.
             * @param {Function} cl Class in which we need to add require
             * @param {Array|String} classes Name of the class or names array
             */
            function addRequires(cl, classes) {
                classes = isString(classes) ? [classes] : classes;
                var req = cl.prototype.requires;
                var i;

                if (classes) {
                    if (isObject(classes)) {
                        for (i in classes) {
                            if (classes.hasOwnProperty(i)) {
                                req.push(classes[i]);
                            }
                        }
                    } else {
                        cl.prototype.requires = req.concat(classes);
                    }
                }
            }

            /**
             * @private
             * Sets special configuration to the current instance. Fro example:
             *
             *     obj.setConfig({cfg1: 1, cfg2: 2});
             *
             * This example shows how to set two arguments into the obj. After this line
             * obj will contain these two parameters with appropriate values (1,2).
             * @param {Object} cfg Key value object to set
             * @return {Boolean} true if configuration was set successfully, false - otherwise
             */
            function setConfig(cfg) {
                var i;

                if (!isObject(cfg)) {
                    return false;
                }

                for (i in cfg) {
                    if (cfg.hasOwnProperty(i) && this[i] !== undefined) {
                        this[i] = cfg[i];
                    }
                }

                return true;
            }


            //
            // Obtains class from it's name
            //
            child = ns(childNs, true);

            //
            // Here we convert string namespace with function at the end into the namespace+class.
            // Example: 'App.view.Widget' -> 'App.view', 'Widget'
            //
            childArr = childNs.split('.');
            childStr = childArr.pop();
            childNs  = childArr.join('.');

            if (childStr === '') {
                throw new Error('Invalid class name "' + childCl + '"');
            }

            //
            // These data will be needed for post inheritance. After all required classes will be loaded.
            //
            childProto            = child.prototype;
            childProto.className  = childCl;
            childProto.setConfig  = childProto.setConfig || setConfig || undefined;
            childProto.requires   = [];
            childProto.props      = props;
            childProto.childStr   = childStr;
            childProto.childNs    = childNs;
            childProto.applyProps = applyProperties;
            childProto.inherit    = inherit;
            childProto.parent     = parent || undefined;

            //
            // Create requires array. It contains requires, mixins and parent classes
            //
            addRequires(child, isString(parent) ? parent : undefined);
            addRequires(child, props.mixins);
            addRequires(child, props.requires);

            //
            // If first call was N13.create(), then all N13.define() calls will be from loaded files and not from
            // already loaded. So we need to call _onFileLoaded() callback for every of them. Also, we need to load
            // all requires classes too. This process will be continued until the last dependency will be loaded.
            //
            if (_isCreating) {
                _loadClass(childProto.requires);
                _onFileLoaded(childCl);
            //
            // This case is working only for local N13.define() calls, when we don't need to load files asynchronously.
            // So we need to create real full class here, not later, when all dependencies will be loaded. This case
            // also means that, all dependencies have already loaded before current N13.define() call.
            //
            } else {
                child = inherit(parent, childNs, childStr);
                applyProperties(child, props);
            }

            return child;
        },

        /**
         * Creates class instance synchronously/asynchronously and call callback function after that. In case if all
         * classes have been already loaded, then N13.create() will return a new class instance. Otherwise it will
         * return false and load all dependencies later and call callback. By the way, callback function will
         * be called in any case. Also, please remember that before call of N13.create() you should configure N13
         * library with N13.init() method. See N13.init for details.
         *
         * N13.create() has dependencies manager inside. It loads all the dependencies from all sub levels and call
         * callback function after that. After this, you can use this creator in synchronously mode. But you must be
         * sure about nested dependencies. Consider, we have this file structure with specified code inside:
         *
         *     [js]
         *         Child.js
         *             N13.define('App.Child', {
         *                 extend  : 'App.Parent',
         *                 requires: ['App.Inner'],
         *                 init    : function () {
         *                     this.inner = new App.Inner();
         *                 }
         *             });
         *         Parent.js
         *             N13.define('App.Parent');
         *         Inner.js
         *             N13.define('App.Inner', {
         *                 requires: ['App.util.Util'],
         *                 init    : function () {
         *                     this.util = new App.util.Util();
         *                 }
         *             });
         *         [util]
         *             Util.js
         *                 N13.define('App.Inner');
         *
         * And we have this code:
         *
         *     N13.init({appRoot: ['App', 'js']});
         *     N13.create('App.Child', function (instance) {
         *         //
         *         // If we are here, it means that these dependencies have been loaded:
         *         // App.Parent, App.Inner, App.util.Util
         *         // Here and later, you can use new operator instead N13.create() for these classes.
         *         var child = N13.create('App.Child');
         *     });
         *
         * As i told above N13.create() uses dependency loader for mixins, parent class and all requires classes. The
         * loading works in a special way. First, it loads all nested dependencies of all levels. Second, it walks
         * recursively through all nested classes and creates full (finished) classes. By finished i mean: inherited from
         * it's parent, mixed with mixins and so on. The loading is fully asynchronous and we shouldn't speak about
         * any ordering here.
         *
         * @param {String} cl Name of the class
         * @param {Function|undefined} finalCb Callback function to call
         * @param {Object} scope Scope for callback function
         * @param {Object|undefined} cfg Configuration of the instance. It will be passed as a parameter into the new operator
         * @param {Function|undefined} beforeCb Calls before class will be created
         * @return {Boolean|Object} false if class will be loaded asynchronously, instance - if all required classes have already loaded
         */
        create: create = function (cl, finalCb, scope, cfg, beforeCb) {
            var ret = false;

            if (!_nsRe.test(cl)) {
                throw new Error('Invalid class name "' + cl + '" in N13.create() method. Example: "UpperCase.lowercase.UpperCase".');
            }
            //
            // If user has called N13.create() more then once synchronously, then we need to call them one by one,
            // later, because this library doesn't support loading of two or more classes at the same time. So, now
            // we should add this call to the stack and call later in the N13.define() callback
            //
            if (_isCreating) {
                _createStack.push(Array.prototype.slice.call(arguments));
                return ret;
            }

            //
            // If all nested(required) files have already loaded, then callback function will be called immediately
            //
            _require(cl, function () {
                var Ctor = ns(cl, false);
                var instance;

                /**
                 * @private
                 * This method walks thought all class dependencies recursively and creates full classes if they
                 * haven't created yet. If we are here, then all dependencies have already loaded and we can create all
                 * these classes.
                 * @param {String} curCl Class name
                 */
                function walkParent(curCl) {
                    var Ctor     = ns(curCl, false);
                    var proto    = Ctor.prototype;
                    var requires = proto.requires;
                    var i;
                    var len;

                    //
                    // If current class is N13 class and it wasn't finished, then finish him! (mortal combat!)
                    //
                    if (!proto.finished && _isN13Class(curCl)) {
                        for (i = 0, len = requires.length; i < len; i++) {
                            walkParent(requires[i]);
                        }

                        //
                        // Make inheritance, after all dependencies have loaded copy all properties from props argument into the child class
                        //
                        Ctor = proto.inherit(proto.parent ? ns(proto.parent) : ns(proto.props.extend), proto.childNs, proto.childStr);
                        proto.applyProps(Ctor, proto.props);
                    }
                }


                //
                // Current class has already created before. So we don't need to call all it's dependencies.
                //
                if (!isFunction(Ctor) || !Ctor.prototype.finished) {
                    walkParent(cl);
                    //
                    // We must update class, because it was updated inside walkParent() method
                    //
                    Ctor = ns(cl, false);
                }

                if (beforeCb) {
                    beforeCb(cl, Ctor, cfg);
                }
                instance = new Ctor(cfg);
                if (finalCb) {
                    finalCb.call(scope, instance);
                }
                ret = instance;

                //
                // If user has called N13.create() more then once synchronously, then we need to call them one by one,
                // because this library doesn't support loading of two or more classes at the same time.
                //
                if (_createStack.length) {
                    create.apply(undefined, _createStack.pop());
                }
            });

            return ret;
        }
    };
}(window));