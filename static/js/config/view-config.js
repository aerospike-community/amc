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

define(["jquery", "underscore", "backbone" ], function($, _, Backbone){
     var ViewConfig = {        
            clusterPieConfig:{
                width : 150,
                height : 150,
                outerRadius : 50,
                innerRadius : 40,
                textOffset : 5,
                tweenDuration : 1000,
                outerBorderWidth : 3,
				innerBorderWidth : 3,
                color : ["#61CAFF", "#FFFFFF"],
				textColor : ["#61CAFF", "#000000"]
            },
            tablePieConfig: {
                width : 45,
                height : 50,
                outerRadius : 20,
                innerRadius : 0,
                textOffset : 5,
                tweenDuration : 1000,
                outerBorderWidth : 2,
                color : ["#61CAFF", "#FFFFFF"]
            },
            throughputChartConfig: {
                gWidth : 440,
                gHeight : 250,
                initMaxY : 1000,
                initMinY : 0
            }
            
     };
     
     return ViewConfig;
    
    
});