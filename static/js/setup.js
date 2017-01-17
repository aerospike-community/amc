require.config({
    paths: {
        //Libraries
        jquery: "libs/jquery/consolidated-jquery-functionalities.min",
        underscore: "libs/underscore/underscore",
        backbone: "libs/backbone/backbone",
        poller: "libs/backbone/backbone.poller",
        d3: "libs/d3/d3",
        d3Layout: "libs/d3/d3.layout.min",
        timechart: "libs/timechart/timechart",
    },
    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
        }
    }
});

require(["onepage"],function(onepage){
    onepage();
});
