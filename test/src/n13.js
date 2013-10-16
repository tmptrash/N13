/*global App, EmptyParent, Child, Parent, Parent1, Parent2, Grandson, ChildOfChild */

//
// TODO: Add mixed tests. For example: how config changes mixin methods and so on...
// TODO: tests for ns, require methods
//

/**
 * Shortcuts section
 */
var isFunc  = N13.isFunction;
var isObj   = N13.isObject;
var isStr   = N13.isString;
var emptyFn = N13.emptyFn;
var define  = N13.define;
var create  = N13.create;
var init    = N13.init;
var ns      = N13.ns;

/**
 * N13 library test suite. It was tuned for jsTestDriver framework and it has some special issues regarded
 * asynchronous files loading. See this link for details:
 * http://www.sencha.com/forum/showthread.php?148326-Ext4-Ext.Loader-and-JsTestDriver-WORKING!
 */
AsyncTestCase("N13 library", {
    /*
     * This test checks all variants of class creation: new operator and N13.create() method
     */
    testClassCreation: function () {
        N13.define('EmptyParent');
        N13.define('Parent', {
            method: emptyFn,
            prop  : 'parent'
        });
        N13.define('Child');

        assertTrue('EmptyParent class exists',          isFunc(EmptyParent));
        assertTrue('Parent class exists',               isFunc(Parent));
        assertTrue('Parent instance has correct type',  (new Parent()) instanceof Parent);
        assertTrue('N13.define must return class',      isFunc(define('SecondParent')));
        assertTrue('N13.create must return instance 1', create('Parent') instanceof Parent);
        assertTrue('N13.create must return instance 2', create('EmptyParent') instanceof EmptyParent);
    },

    /*
     * This test checks multiple classes creation. It also checks if instances contain
     * correct properties and methods after creation. If we create two classes with the same
     * name, the last one should remove previous.
     */
    testMultipleClassCreation: function () {
        var parent1;
        var parent2;

        define('Parent1', {
            method: function () {return 'parent first';},
            prop  : 'parent first'
        });
        define('Parent1', {
            method: function () {return 'parent';},
            prop  : 'parent'
        });
        define('Parent2', {
            method: function () {return 'parent';},
            prop  : 'parent'
        });
        parent1 = new Parent1();
        parent2 = new Parent2();

        assertTrue('Last defined class has a priority', parent1.prop === 'parent' && isFunc(parent1.method) && parent1.method() === 'parent');
        assertTrue('Default parent is Function',        Parent1.base instanceof Object && !(Parent1.base instanceof Parent1));
        assertTrue('Prototypes collision',              Parent2.prototype !== Parent1.prototype);
        assertTrue('Classes collision',                 Parent2 !== Parent1);
        assertTrue('Parent1 has correct class name',    parent1.className === 'Parent1');
        assertTrue('Parent2 has correct class name',    parent2.className === 'Parent2');
        assertTrue('Parent1 has no requires',           parent1.requires.length === 0);
        assertTrue('Parent1 has correct parent',        isFunc(parent1.parent));
    },

    /*
     * This test checks simple inheritance of N13 classes. Simple, means two level inheritance:
     * Child extends Parent extends Function
     */
    testSimpleInheritance: function () {
        var child;
        var parent;

        define('Parent', {
            parentMethod: function () {},
            method      : function () {return this.parentProp;},
            method1     : function () {return this.parentProp;},
            parentProp  : 'parent'
        });
        define('Child', {
            extend      : 'Parent',
            method      : function () {return this.childProp + '+' + Child.base.method.call(this);},
            method1     : function () {return this.childProp + '+' + this.callParent();},
            childMethod : function () {},
            childProp   : 'child'
        });
        child  = new Child();
        parent = new Parent();

        assertTrue('Child has a method from Parent',               isFunc(child.parentMethod));
        assertTrue('Child has a property from Parent',             child.parentProp === 'parent');
        assertTrue('Child has it\'s own method',                   isFunc(child.childMethod));
        assertTrue('Child has it\'s own property',                 child.childProp === 'child');
        assertTrue('Child has a correct class type',               child instanceof Child);
        assertTrue('Child has a correct constructor 1',            child.constructor === Child);
        assertTrue('Child has a correct constructor 2',            Child.prototype.constructor === Child);
        assertTrue('Child method can call super method 1',         child.method() === 'child+parent');
        assertTrue('Child method can call super method 2',         child.method1() === 'child+parent');
        child.parentProp = 'new parentProp value';
        child.childProp  = 'new childProp value';
        assertTrue('Child and Parent classes must be separated 1', child.parentProp !== parent.parentProp);
        assertTrue('Child and Parent classes must be separated 2', child.childProp !== parent.childProp && parent.childProp === udef);
        assertTrue('Child should have extends property',           child.extend === 'Parent');
        assertTrue('Child instance has correct self property',     child.self === Child);
        assertTrue('Child has correct base property',              Child.base === Parent.prototype);
        assertTrue('Child has correct class name',                 Child.prototype.className === 'Child' && child.className === 'Child');
        assertTrue('Child has correct requires',                   Child.prototype.requires === child.requires && child.requires.length === 1 && child.requires[0] === 'Parent');
        assertTrue('Child has correct parent',                     child.parent === 'Parent');
        assertTrue('Parent constructor shouldn\'t be broken',      parent.constructor === Parent && Parent.prototype.constructor === Parent && parent instanceof Parent);
        assertTrue('Parent shouldn\'t has extends property',       parent.extend === udef);
        assertTrue('Parent instance has correct self property',    parent.self === Parent);
        assertTrue('Parent has correct base property',             Parent.base !== Child.base);
        assertTrue('Parent has correct class name',                Parent.prototype.className === 'Parent' && parent.className === 'Parent');
        assertTrue('Parent has correct requires',                  Parent.prototype.requires === parent.requires && parent.requires.length === 0);
    },

    /*
     * Complex inheritance test. It checks if three classes, which have inheritance between each other, have
     * correct internal structure and properties.
     */
    testComplexInheritance: function () {
        var grand;
        var child;
        var parent;

        define('Parent', {
            parentMethod: function () {},
            method      : function () {return this.parentProp;},
            method1     : function () {return this.parentProp;},
            parentProp  : 'parent'
        });
        define('Child', {
            extend      : 'Parent',
            method      : function () {return this.childProp + '+' + Child.base.method.call(this);},
            method1     : function () {return this.childProp + '+' + this.callParent();},
            childMethod : function () {},
            childProp   : 'child'
        });
        define('Grandson', {
            extend      : 'Child',
            method      : function () {return this.grandProp + '+' + Grandson.base.method.call(this);},
            method1     : function () {return this.grandProp + '+' + this.callParent(this);},
            grandMethod : function () {},
            grandProp   : 'grandson'
        });
        grand  = new Grandson();
        child  = new Child();
        parent = new Parent();

        assertTrue('Grandson has a method from Child',             isFunc(grand.childMethod));
        assertTrue('Grandson has a method from Parent',            isFunc(grand.parentMethod));
        assertTrue('Grandson has own method',                      isFunc(grand.grandMethod));
        assertTrue('Grandson has a property from Child',           grand.childProp === 'child');
        assertTrue('Grandson has a property from Parent',          grand.parentProp === 'parent');
        assertTrue('Grandson has own property',                    grand.grandProp === 'grandson');
        assertTrue('Grandson has a correct class type',            grand instanceof Grandson);
        assertTrue('Grandson has a correct constructor 1',         grand.constructor === Grandson);
        assertTrue('Grandson has a correct constructor 2',         Grandson.prototype.constructor === Grandson);
        assertTrue('Grandson method calls super method 1',         grand.method() === 'grandson+child+parent');
        assertTrue('Grandson method calls super method 2',         grand.method1() === 'grandson+child+parent');
        assertTrue('Grandson has correct class name',              Grandson.prototype.className === 'Grandson' && grand.className === 'Grandson');
        assertTrue('Grandson has correct requires',                Grandson.prototype.requires === grand.requires && grand.requires.length === 1 && grand.requires[0] === 'Child');
        assertTrue('Grandson has correct parent',                  grand.parent === 'Child');
        grand.parentProp = 'new parentProp value';
        grand.childProp  = 'new childProp value';
        grand.grandProp  = 'new grandProp value';
        assertTrue('All classes must be separated 1',              grand.parentProp !== child.parentProp && child.parentProp === parent.parentProp);
        assertTrue('All classes must be separated 2',              grand.childProp !== child.childProp && parent.childProp === udef);
        assertTrue('All classes must be separated 3',              grand.grandProp !== child.grandProp && child.grandProp === udef && parent.grandProp === udef);

        assertTrue('Grandson constructor shouldn\'t be broken',    grand.constructor === Grandson && Grandson.prototype.constructor === Grandson);
        assertTrue('Child constructor shouldn\'t be broken',       child.constructor === Child && Child.prototype.constructor === Child);
        assertTrue('Child has correct class name',                 Child.prototype.className === 'Child' && child.className === 'Child');
        assertTrue('Child has correct requires',                   Child.prototype.requires === child.requires && child.requires.length === 1 && child.requires[0] === 'Parent');
        assertTrue('Child has correct parent',                     child.parent === 'Parent');
        assertTrue('Parent constructor shouldn\'t be broken',      parent.constructor === Parent && Parent.prototype.constructor === Parent);
        assertTrue('Parent has correct class name',                Parent.prototype.className === 'Parent' && parent.className === 'Parent');
        assertTrue('Parent has correct requires',                  Parent.prototype.requires === parent.requires && parent.requires.length === 0);
    },

    /*
     * Test of mixins support. It also checks mixins inheritance. Yes! it supports it!
     */
    testMixins: function () {
        var parent;
        var child;

        define('Mixin', {
            mixinMethod : function () {return 'mixin method';},
            mixinMethod1: function () {return 'mixin method';},
            mixinMethod2: function () {return 'mixin';},
            mixinMethod3: function () {return 'mixin';},
            method      : function () {return this.prop;},
            prop        : 'mixin',
            mixinProp   : 'mixin'
        });
        define('ChildMixin', {
            extend      : 'Mixin',
            mixinMethod1: function () {return this.callParent();},
            mixinMethod2: function () {return this.callParent();},
            mixinMethod3: function () {return this.callParent();},
            mixinMethod4: function () {return this.callParent();}
        });
        define('Parent', {
            mixins      : {mix: 'Mixin'},
            mixinMethod1: function () {return 'parent ' + this.callMixin('mix');},
            mixinMethod2: function () {return 'parent';},
            mixinMethod3: function () {return 'parent';},
            mixinMethod4: function () {return 'parent';},
            method      : function () {return this.prop;},
            prop        : 'parent'
        });
        define('Child', {
            extend      : 'Parent',
            mixins      : {mix: 'ChildMixin'},
            mixinMethod1: function () {return this.callParent();},
            mixinMethod2: function () {return this.callMixin('mix');}
        });
        parent = new Parent();
        child  = new Child();

        assertTrue('Parent class has a mixin',           parent.mixins !== udef && parent.mixins.mix !== udef);
        assertTrue('Parent class has mixin method',      isFunc(parent.mixinMethod) && parent.mixinMethod() === 'mixin method');
        assertTrue('Parent class has own method',        isFunc(parent.method) && parent.method() === 'parent');
        assertTrue('Parent class has mixin property',    parent.mixinProp === 'mixin');
        assertTrue('Parent class has own property',      parent.prop === 'parent');
        assertTrue('Parent class can access mixin',      isFunc(parent.mixins.mix.method) && parent.mixins.mix.method() === 'mixin');
        assertTrue('callMixin() method works correctly', parent.mixinMethod1() === 'parent mixin method');
        assertTrue('Mixins hierarchy calls 1',           child.mixinMethod1() === 'parent mixin method');
        assertTrue('Mixins hierarchy calls 2',           child.mixinMethod2() === 'mixin');
        assertTrue('Mixins hierarchy calls 3',           child.mixinMethod3() === 'mixin');
        assertTrue('Mixins hierarchy calls 4',           child.mixinMethod4() === 'parent');
    },

    /*
     * Test of static properties and methods
     */
    testStatics: function () {
        var parent;
        var child;

        define('Parent', {
            statics: {
                method: function () {return this.prop;},
                prop  : 'static'
            }
        });
        define('Child', {
            statics: {
                method: function () {return this.prop;},
                prop  : 'static1'
            }
        });
        parent = new Parent();
        child  = new Child();

        assertTrue('Parent class has static property',  Parent.prop === 'static' && parent.self.prop === 'static');
        assertTrue('Parent class has static method 1',  isFunc(Parent.method) && Parent.method() === 'static');
        assertTrue('Parent class has static method 2',  isFunc(parent.self.method) && parent.self.method() === 'static');
        assertTrue('Parent method has correct context', Parent.method() === Parent.prop);

        assertTrue('Child class has static property',   Child.prop === 'static1' && child.self.prop === 'static1');
        assertTrue('Child class has static method 1',   isFunc(Child.method) && Child.method() === 'static1');
        assertTrue('Child class has static method 2',   isFunc(child.self.method) && child.self.method() === 'static1');
        assertTrue('Child method has correct context',  Child.method() === Child.prop);
    },

    /*
     * Checks if class configuration works correctly
     */
    testConfig: function () {
        var p1;
        var p2;
        var ch1;
        var ch2;

        define('Parent', {
            configs: {
                cfg1: 1,
                cfg2: 2
            }
        });
        define('Child', {
            extend : 'Parent',
            configs: {
                cfg2: 'new 2'
            }
        });
        p1  = new Parent();
        p2  = new Parent({cfg1: 'new'});
        ch1 = new Child();
        ch2 = new Child({cfg1: 'new one', cfg2: 'cfg2'});

        assertTrue('Parent class contains config properties',        p1.cfg1 === 1 && p1.cfg2 === 2);
        assertTrue('Parent class config override',                   p2.cfg1 === 'new' && p2.cfg2 === 2);
        assertTrue('Parent class hasn\'t static for config',         Parent.cfg1 === udef && Parent.cfg2 === udef);
        assertTrue('Parent class has config in prototype',           Parent.prototype.cfg1 === 1 && Parent.prototype.cfg2 === 2);
        assertTrue('Parent class has no config in instance',         p1.hasOwnProperty('cfg1') === false && p1.hasOwnProperty('cfg2') === false);

        assertTrue('Child class has config property',                ch1.cfg1 === 1);
        assertTrue('Child class override config property',           ch1.cfg2 === 'new 2');
        assertTrue('Child class has config property from new',       ch2.cfg1 === 'new one');
        assertTrue('Child class overrides config property from new', ch2.cfg2 === 'cfg2');
    },

    /*
     * Test if constructor function is correct and is called correctly
     */
    testConstructor: function () {
        var parent;
        var child;
        var child1;

        define('Parent', {
            prop   : 'parent',
            init   : function () {this.prop = 'ok';}
        });
        define('Child', {
            extend : 'Parent',
            paramCh: 'child',
            init   : function () {
                this.paramCh = 'okay';
                this.prop    = 2;
                Child.base.init.call(this);
            }
        });
        parent = new Parent();
        child  = new Child();
        child1 = new Child({init: function () {this.paramCh = 1; Child.base.init.call(this);}});

        assertTrue('Parent class has a constructor',                 isFunc(parent.init));
        assertTrue('Parent class called constructor',                parent.prop === 'ok');
        assertTrue('Child class has a constructor',                  isFunc(child.init));
        assertTrue('Child class calls super constructor',            child.prop === 'ok');
        assertTrue('Child class calls own constructor',              child.paramCh === 'okay');
        assertTrue('Child class overrides constructor',              child1.paramCh === 1);
        assertTrue('Overridden constructor calls super constructor', child1.prop === 'ok');
    },

    /*
     * Checks if this.callParent() method works correctly. It should work not only with
     * our classes, but also, with any third-party classes too.
     */
    testCallParent: function () {
        var parent;
        var child;
        var child1;
        var chch;

        define('Parent', {
            prop  : null,
            init  : function () {this.prop = 'parent';},
            method: function () {this.prop = 1;}
        });
        define('Child', {
            extend : 'Parent',
            chParam: null,
            init   : function () {
                this.chParam = 'child';
                this.callParent(arguments);
            },
            method : function () {this.chParam = 2; this.callParent(arguments);}
        });
        define('ChildOfChild', {
            extend : 'Child',
            init   : function () {
                this.callParent(arguments);
            },
            method : function () {this.callParent(arguments);}
        });

        parent = new Parent();
        child  = new Child();
        child1 = new Child({init: function () {this.callParent(arguments);}});
        chch   = new ChildOfChild();

        assertTrue('Parent class calls callParent in constructor',         parent.prop === 'parent');
        child.method();
        assertTrue('Child class calls callParent in method',               child.prop === 1);
        assertTrue('Child class calls callParent in override',             child1.prop === 'parent');
        assertTrue('ChildOfChild class calls callParent in constructor 1', chch.chParam === 'child');
        assertTrue('ChildOfChild class calls callParent in constructor 2', chch.prop === 'parent');
        chch.method();
        assertTrue('ChildOfChild class calls callParent in method',        chch.chParam === 2 && chch.prop === 1);
    },

    /*
     * Checks asynchronous behavior of N13 library. Asynchronous logic is implemented in N13.create() method.
     * @param {Object} q Queue of asynchronous steps
     */
    testAsynchronousBehavior: function (q) {
        init({
            appRoot: ['App', 'src/js'],
            baseUrl: '/test/'
        });

        /*
         * Checks files/scripts dependencies. Mixins, parent and requires are all dependencies and should be loaded and run
         * before main class will be created
         */
        q.call('Dependencies (parent, mixins and requires) should be loaded before main class', function (callbacks) {
            create('App.Class', callbacks.add(function (instance) {
                assertTrue('Class was instantiated',                                  isObj(instance));
                assertTrue('Class loaded parent class',                               instance.e === 'e');
                assertTrue('Parent class of require class was loaded',                isFunc(App.ReqBase));
                assertTrue('Check parent class of one require',                       create('App.Req') instanceof App.ReqBase);
                assertTrue('One require has correct base class property',             instance.cl.baseProp === 'prop');
                assertTrue('Class loaded mixin',                                      instance.mixMethod() === 'mixin');
                assertTrue('Class loaded require class',                              instance.cl instanceof App.Req);
                assertTrue('App.Class extends App.Empty',                             instance instanceof App.Empty);
                assertTrue('App.Class has correct type',                              instance instanceof App.Class);
                assertTrue('All dependencies should be loaded',                       isFunc(App.Empty) && isFunc(App.mixin.Mixin) && isFunc(App.Req) && isFunc(App.Req1));
                assertTrue('N13.create should return an instance for loaded classes', isObj(create('App.Class')) && isObj(create('App.Empty')) && isObj(create('App.mixin.Mixin')) && isObj(create('App.Req')) && isObj(create('App.Req1')));
            }));
        });

        q.call('We should check if N13.define() can wrap third party classes', function (callbacks) {
            create('App.Other', callbacks.add(function (instance) {
                assertTrue('Class was instantiated',                                  N13.isObject(instance));
                assertTrue('Class has correct type',                                  instance instanceof App.Other);
                assertTrue('Class was inherited correctly',                           instance instanceof Backbone.Model);
                assertTrue('Class has method from parent',                            N13.isFunction(instance.get) && instance.get('p1') === 1);
                assertTrue('Parent method works correctly',                           instance.set('p2', 'p2') && instance.get('p2') === 'p2');
            }));
        });
    },

    /*
     * Checks asynchronous behavior of N13.create() function. This test checks two or more N13.create() calls
     * @param {Object} q Queue of asynchronous steps
     */
    testAsynchronousBehaviorOfCreation: function (q) {
        init({
            appRoot: ['App', 'src/js'],
            baseUrl: '/test/'
        });

        q.call('N13.create() should be called two or more times', function (callbacks) {
            create('App.MClass1', callbacks.add(function () {
                assertTrue('MClass2 shouldn\'t be created', ns('App.MClass2', false) === false);
            }));
            create('App.MClass2', callbacks.add(function () {
                assertTrue('MClass1 should be created', ns('App.MClass1', false) !== false);

                //
                // Here we should remove created namespaces. Otherwise, this test will be crashed in future
                //
                delete window.App;
            }));
        });
    },

    /*
     * Checks N13.isString() function with invalid values
     */
    testIsStringWithInvalidValue: function () {
        Test.util.Common.mapValues(function (val) {
            assertNoException('N13.isString shouldn\'t throw an exception', function () {
                isStr(val);
            });
        });
    },

    /*
     * Checks N13.isString() function with correct values
     */
    testIsStringWithCorrectValues: function () {
        assertTrue('isString should return true for correct string', isStr('correct'));
        assertTrue('isString should return true for empty string', isStr(''));
        assertTrue('isString should return true for long string', isStr('correctalsdjkfljals;dj f;lasjdf; ljas;ldf;lasj;lj435o423uj 6034504305u[023u4 5u[3u45[ jasjf asdf jas;ljasl;jf ;asjd;f j;j ;jl;j5423 ;lj34;5 j;j2345l;j l;jl;sjdfl;jlasjdfljslajdfljsajl;fjal;sjjrf34854308508438508438v5g230gp5823048vb504328vb[084235v[08432vb$@#^&%^&*&%^*$^%&^$#%$#%TSDGDFYHTYHFGSDTGRYGDFGSDGERGHSTRFEWSR$TTYE%YTRHDFHDFHUERHDFGTRDTGRTYDTRHDFHDRTYHDER^%$^$#Y^%$Y%YWWEjsdtgrp;jio;sdtgjio;jio;sdghl;sdgrsdghil;dgpio[eyri[-09u0afghasfhsdgjrqat4whhhurio[tio[ewjquio[trawtyretio[reuutio[ewr4u3f5h9w-g7=f7twsgrd54w8f7ew89[w7hg89[w7gvwtj9[8gt9[gf8gs98js8j9tf-08vjd985478856i5riopu;yobmdujtio;8gj0nouhskf;askd ;fksd;kf;ksdl;fa;sdfk;g;dfk;ghkka;skfsdjaks;dkfsad;fk;;slajdf;lja;sldjfl;jal;sjgsdl;jl  lsajd l;asjd; lf;asjf90843060849304398608464306084305608340856 -0486 08456 408 60406804856080430860 80436057694=-5 84308 6-0834856-0860483 693046=-3906-340-6-43690437956730947694374304843 6408435443=643=6=46=4386=4396-43-69=3-496=-94356=-934=-956=-3496=-943=-96=-3496=-9436=-94=3-96=-4936=-3946=-'));
        assertTrue('isString should return true for one symbol string', isStr('w'));
        assertTrue('isString should return true for one symbol string', isStr('w'));
        assertTrue('isString should return true for string with special symbols', isStr('!@#$%^&*()_+=-0987654321`~\|][p]{}:;\'".,/?'));
    }
});