N13.define('App.Class', {
    extend  : 'App.Empty',
    mixins  : {mix: 'App.mixin.Mixin'},
    requires: ['App.Req'],
    init    : function () {
        this.cl = new App.Req();
    }
});