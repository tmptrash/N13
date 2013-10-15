N13.define('App.Req', {
    extend  : 'App.ReqBase',
    requires: ['App.Req1'],
    init    : function () {
        this.r = new App.Req1();
    }
});