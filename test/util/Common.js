/**
 * JsTestDriver Unit tests helper class. Contains helper functions for JsTestDriver framework.
 *
 * @author Dima Tarasenko
 */
N13.define('Test.util.Common', {
    statics: {
        /**
         * @constant
         * All available values for tests
         */
        VALUES: {
            emptyString   : '',
            string        : 'hello',
            capitalString : 'Capital',
            longString    : 'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'jkfal;sjflajsldf jlj lsdjfgl;j54lj6[34pit-0s9id 09gfisd09g8054uj6tjerkl;jasl kjdf l;asjfl;jsdal;fjasl;jgldfsjgl;asjfl;jaow3u54o3jtl;jafk;sadkfljdslajflkadsjlfjlasdjflsdjfljasdljflsjflkasdjflk+))(dfgdfkgl;#$%!@#~!^&*/dfg\\\"\'',
            specialString : '~!@#$%^&*()_+`1234567890-=[]{}\'\"\\\n\t/.,<>;:',
            emptyObject   : {},
            object        : {key: 'value', key2: 123},
            emptyArray    : [],
            array         : [1,2,3,'ff',{}],
            emptyFunction : N13.emptyFn,
            simpleFunction: function () {return 'hello';},
            nil           : null,
            regexp        : /.+/,
            boolTrue      : true,
            boolFalse     : false,
            udef          : undefined,
            nan           : NaN,
            infinity      : Infinity,
            minusInfinity : -Infinity,
            number        : 123,
            negativeNumber: -17,
            zero          : 0,
            float         : 1.22,
            negativeFloat : -0.359,
            instance      : (function () {function F() {} return new F();})()
        },

        /**
         * Maps all available values and calls callback function
         * @param {Function} cb Callback function to call
         * @param {Array} skip Array of keys, which will be skipped
         */
        mapValues: function (cb, skip) {
            var i;
            var values = this.VALUES;

            skip = skip || [];
            for (i in values) {
                if (values.hasOwnProperty(i) && skip.indexOf(i) === -1) {
                    cb.call(this, values[i], i, values);
                }
            }
        }
    }
});