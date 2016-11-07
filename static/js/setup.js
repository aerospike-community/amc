var requireConfig = {
    paths: {
        //Libraries
        jquery: "libs/jquery/consolidated-jquery-functionalities.min",
        underscore: "libs/underscore/underscore",
        backbone: "libs/backbone/backbone",
        poller: "libs/backbone/backbone.poller.min",
        d3: "libs/d3/d3",
        d3Layout: "libs/d3/d3.layout.min",
        timechart: "libs/timechart/timechart",
        //Aerospike JS
        piechart: "helper/piechart",
        timeseriesChart: "helper/timechart-helper"
    },
    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
        }
    }
};

if( _AMC_VERSION_.indexOf("DEV") === -1 )
    requireConfig.urlArgs = ("v=" + ( _AMC_VERSION_ != null ? _AMC_VERSION_ : (new Date()).getTime() ) );

require.config( requireConfig );

require(["onepage"],function(onepage){
    onepage();
});