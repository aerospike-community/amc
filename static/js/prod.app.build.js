/******************************************************************************
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
******************************************************************************/

({
    appDir : "../",
    baseUrl: "./js",
    dir: "../../script-build",
    
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
    
    modules: [
    	{
			name : "setup",
			include : [],
			exclude:["onepage"]
		},
        {
		name : "onepage",
		include : [
			//core library
			"backbone","d3","libs/spin/spin.min","underscore","timechart",
			
			//helpers library
			"helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			"helper/bulletchart","piechart","helper/util","helper/servicemanager","helper/usermanager","helper/authmanager",
			"helper/sessionmanager","helper/login",

			//Config files
			"config/app-config","config/var-details","config/view-config",

			//Model/common
			"models/common/PopupModel",

			//View/common
			"views/common/nodelistview"
				
		],
		exclude:[
			"jquery","require"	
		]
	},
    //For dashboard tab
    {
		name : "models/dashboard/clustermodel",
		include:[
			//Helpers
			"helper/drilldown-charts","helper/namespace-table","helper/namespace-clusterwide-table","helper/node-table","timeseriesChart",
            "helper/xdr-table","helper/toggle",         

			//models
			"models/dashboard/clusterwidenamespacemodel","models/dashboard/namespacemodel","models/dashboard/nodemodel","models/dashboard/throughputmodel","models/dashboard/xdrmodel",

			//views
			"views/dashboard/clusterwidenamespaceview","views/dashboard/namespaceview","views/dashboard/nodeview",
            "views/dashboard/pieview","views/dashboard/summaryView","views/dashboard/throughputview",

			//collections
			"collections/dashboard/clusterwidenamespaces","collections/dashboard/namespaces","collections/dashboard/nodes","collections/dashboard/xdrs"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
             "helper/bulletchart","piechart","helper/util",
			 "models/common/PopupModel","views/common/nodelistview","helper/login",
			 "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager"
	
		]
	},
    
    //For statistics tabs
	{
		name : "models/statistics/clustermodel",
		include:[
			//Helpers
			"helper/stat-table",

			//models
			"models/statistics/statmodel",
			"models/statistics/stattracker",

			//views
			"views/statistics/statview",
			"views/statistics/stattrackerview",

			//collections
			"collections/statistics/namespaces","collections/statistics/nodes","collections/statistics/sindex","collections/statistics/xdr"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
             "helper/bulletchart","piechart","helper/util",
			 "models/common/PopupModel","views/common/nodelistview",
			 "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager","helper/login",
		]
	},
      //For definitions tabs
	{
		name : "models/definitions/clustermodel",
		include:[
			//Helpers
			"helper/def-table","helper/definitions/set-table","helper/definitions/sindex-table","helper/definitions/udf-table","helper/definitions/xdr-table",

			//models
			"models/definitions/setsmodel","models/definitions/sindexmodel","models/definitions/storagemodel","models/definitions/udfmodel","models/definitions/xdrmodel",

			//views
			"views/definitions/setsview","views/definitions/sindexview","views/definitions/storageview","views/definitions/udfview","views/definitions/xdrview",

			//collections
			"collections/definitions/sets","collections/definitions/sindexes","collections/definitions/udf","collections/definitions/xdrs"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
             "helper/bulletchart","piechart","helper/util","helper/notification","helper/login",
			 "models/common/PopupModel","views/common/nodelistview","helper/stat-table",
             "models/statistics/statmodel","views/statistics/statview",
             "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager"
		]
	},
    
    //For jobs tabs
	{
		name : "models/jobs/clustermodel",
		include:[
			//Helpers
			"helper/job-table",

			//models
			"models/jobs/nodemodel",

			//views
			"views/jobs/nodeview",

			//collections
			"collections/jobs/nodes"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
             "helper/bulletchart","piechart","helper/util",
			 "models/common/PopupModel","views/common/nodelistview",
			 "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager","helper/login",
		]
	},
    //For latency tabs
	{
		name : "models/latency/clustermodel",
		include:[
			//helpers
			"helper/job-table",
			//models
			"models/latency/nodeCentralisedModel","models/latency/nodemodel",

			//views
			"views/latency/nodeview",

			//collections
			"collections/latency/nodes"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
                        "helper/bulletchart","piechart","helper/util",
			 "models/common/PopupModel","views/common/nodelistview",
			 "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager","helper/login"
	
		]
	},
    //For admin console tabs
	{
		name : "models/configs/clustermodel",
		include:[
            //Helpers   
			"helper/edit-config",
            
			//models
			"models/configs/backupmodel","models/configs/restoremodel","models/configs/statmodel",

			//views
			"views/configs/backupview","views/configs/restoreview","views/configs/statview",

			//collections
			"collections/configs/namespaces","collections/configs/nodes","collections/configs/sindex","collections/configs/xdr"
			
		],
		exclude:[
			 "backbone","d3","libs/spin/spin.min","underscore","timechart",
			 "helper/AjaxManager","helper/jqgrid-helper","helper/overlay",
			 "config/app-config","config/var-details","config/view-config",
             "helper/bulletchart","piechart","helper/util",
			 "models/common/PopupModel","views/common/nodelistview",
			 "helper/servicemanager","helper/usermanager","helper/authmanager","helper/sessionmanager","helper/login"
		]
	}
    ]
})


