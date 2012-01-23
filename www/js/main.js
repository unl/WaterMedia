//set up the locations array from the json information.
var locations    = new Array();
var media        = new Array();
var markers      = new Array();
var infoBoxes    = new Array();
var extremes     = new Array();
var locationIcon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
var maxAF        = 0;
var maxCFS       = 0;
var maxDate      = 0;
var minDate      = 0;

WDN.jQuery(document).ready(function(){
    WDN.get('http://mediahub.unl.edu/channels/319?format=json', function(data){
        media = data['media'];
        for (url in data['media']) {
            //skip if we don't have geo data.
            if (data['media'][url]['geo_lat'] == undefined) {
                continue;
            }
            
            if (data['media'][url]['geo_long'] == undefined) {
                continue;
            }
            
            //sanatize data
            data['media'][url]['mediahub_water_cfs'] = parseInt(data['media'][url]['mediahub_water_cfs']);
            data['media'][url]['mediahub_water_af'] = parseInt(data['media'][url]['mediahub_water_af']);
            
            //make sure things are formatted well.
            if (data['media'][url]['mediahub_water_cfs'] == undefined) {
                data['media'][url]['mediahub_water_cfs'] = null;
            }
            
            if (data['media'][url]['mediahub_water_af'] == undefined) {
                data['media'][url]['mediahub_water_af'] = null;
            }
            
            if (data['media'][url]['mediahub_media_creation_date'] == undefined) {
                data['media'][url]['mediahub_media_creation_date'] = data['media'][url]['pubDate'];
            }
            
            //Set up the date object;
            var year, month, day;
            
            year  = data['media'][url]['mediahub_media_creation_date'].substr(0,4);
            month = data['media'][url]['mediahub_media_creation_date'].substr(5,2);
            day   = data['media'][url]['mediahub_media_creation_date'].substr(8,2);
            
            WDN.log(year + "-" + month + "-" + day);
            
            data['media'][url]['date'] = new Date(year, month, day);
            
            if (maxDate == 0 || data['media'][url]['date'] > maxDate) {
                maxDate = data['media'][url]['date'];
            }
            
            if (minDate == 0 || data['media'][url]['date'] < minDate) {
                minDate = data['media'][url]['date'];
            }
            
            //set max cfs.
            if (data['media'][url]['mediahub_water_cfs'] > maxCFS) {
                maxCFS = data['media'][url]['mediahub_water_cfs'];
                WDN.log('maxCFS: ' + maxCFS);
            }
            
            //set max af.
            if (data['media'][url]['mediahub_water_af'] > maxAF) {
                maxAF = data['media'][url]['mediahub_water_af'];
                WDN.log('maxAF: ' + maxAF);
            }
            
            //generate the key (group by geo locaiton).
            var key = data['media'][url]['geo_lat'] + "," + data['media'][url]['geo_long'];
            
            /**Set the location array.**/
            if (locations[key] == undefined) {
                locations[key] = new Array();
            }
            
            locations[key][data['media'][url]['id']]          = new Array();
            locations[key][data['media'][url]['id']]['url']   = url;
            locations[key][data['media'][url]['id']]['title'] = data['media'][url]['title'];
            locations[key][data['media'][url]['id']]['lat']   = data['media'][url]['geo_lat'];
            locations[key][data['media'][url]['id']]['lng']   = data['media'][url]['geo_long'];
            locations[key][data['media'][url]['id']]['cfs']   = data['media'][url]['mediahub_water_cfs'];
            locations[key][data['media'][url]['id']]['af']    = data['media'][url]['mediahub_water_af'];
            locations[key][data['media'][url]['id']]['date']  = data['media'][url]['date'];
            locations[key][data['media'][url]['id']]['media'] = data['media'][url]['url'];
        }
        
        initialize();
    }, 'json');
});

function setUpMarkers(map)
{
    markers   = new Array();
    infoBoxes = new Array();
    for (locationID in locations) {
        if (markers[locationID] != undefined) {
            continue;
        }	
        
        //get the geo data [0] = lat, [1] = long.
        var currentLocation = locationID.split(',');
        
        var color = locationIcon;
            
        markers[locationID] = new google.maps.Marker({
            position: new google.maps.LatLng(currentLocation[0], currentLocation[1]),
            map: map,
            title: "location: " + locationID,
            icon: color
        });
        
        setUpInfoBox(map, locationID);
    }
}

function setUpInfoBox(map, id)
{
    var content = "<div id='infoWindow'>Location: " + id  + "<br />";
    content += "<table class='infoBoxTable'><tr><td class='media'>Media</td><td class='cfs'>cfs</td><td class='af'>af</td><td class='date'>Date</td></tr>";
    
    for (mediaID in locations[id]) {
        var link = "<a href='" + locations[id][mediaID]['url'] + "' class='colorBoxElement'>media</a>";
        var af   = '';
        var cfs  = '';
        var date = locations[id][mediaID]['date'].toDateString();
        
        if (locations[id][mediaID]['af'] !== null) {
            af = locations[id][mediaID]['af'];
        }
        
        if (locations[id][mediaID]['cfs'] !== null) {
            cfs = locations[id][mediaID]['cfs'];
        }
        
        content += "<tr><td>" + link + "</td><td>" + cfs + "</td><td>" + af + "</td><td>" + date + "</td></tr>";
    }
    
    content += "</table></div>";
    
    infoBoxes[id] = new google.maps.InfoWindow({
        content: content,
    });

    google.maps.event.addListener(markers[id], 'click', function() {
        infoBoxes[id].open(map, markers[id]);
        
        WDN.jQuery(".colorBoxElement").click(function(){
           updateMedia(media[this]);
           
           WDN.jQuery(".colorBoxElement").colorbox({width:"700px", height:"570px",inline:true, href:"#waterMedia"}, function(){
               return false;
           });
        });

    });
}

function updateMedia(element)
{
    var html = "<video id='player' height='480' width='640' src='" + element['url'] + "' controls poster='http://itunes.unl.edu/thumbnails.php?url=" + element['url'] + "'></video>";
    $('#waterMedia').html(html);
    player = new MediaElementPlayer('#player');
}

function initExtremes()
{
    extremes = new Array();
    
    for (key in locations) {
        for (mediaID in locations[key]) {
            if (extremes[key] == undefined) {
                extremes[key] = new Array();
            }
            
            if (locations[key][mediaID]['cfs'] != null) {
                if (extremes[key]['cfs'] == undefined) {
                    extremes[key]['cfs'] = new Array();
                }
                
                if (extremes[key]['cfs']['max'] == undefined || locations[key][mediaID]['cfs'] > extremes[key]['cfs']['max']) {
                    extremes[key]['cfs']['max'] = locations[key][mediaID]['cfs'];
                }
            }
            
            if (locations[key][mediaID]['af'] != null) {
                if (extremes[key]['af'] == undefined) {
                    extremes[key]['af'] = new Array();
                }
                
                if (extremes[key]['af']['max'] == undefined || locations[key][mediaID]['af'] > extremes[key]['af']['max']) {
                    extremes[key]['af']['max'] = locations[key][mediaID]['af'];
                }
            }
            
            if (locations[key][mediaID]['date'] != null) {
                if (extremes[key]['date'] == undefined) {
                    extremes[key]['date'] = new Array();
                }
                
                if (extremes[key]['date']['max'] == undefined || locations[key][mediaID]['date'] > extremes[key]['date']['max']) {
                    extremes[key]['date']['max'] = locations[key][mediaID]['date'];
                }
            }
            
            if (locations[key][mediaID]['cfs'] != null) {
                if (extremes[key]['cfs'] == undefined) {
                    extremes[key]['cfs'] = new Array();
                }
                
                if (extremes[key]['cfs']['min'] == undefined || locations[key][mediaID]['cfs'] < extremes[key]['cfs']['min']) {
                    extremes[key]['cfs']['min'] = locations[key][mediaID]['cfs'];
                }
            }
            
            if (locations[key][mediaID]['af'] != null) {
                if (extremes[key]['af'] == undefined) {
                    extremes[key]['af'] = new Array();
                }
                
                if (extremes[key]['af']['min'] == undefined || locations[key][mediaID]['af'] < extremes[key]['af']['min']) {
                    extremes[key]['af']['min'] = locations[key][mediaID]['af'];
                }
            }
            
            if (locations[key][mediaID]['date'] != null) {
                if (extremes[key]['date'] == undefined) {
                    extremes[key]['date'] = new Array();
                }
                
                if (extremes[key]['date']['min'] == undefined || locations[key][mediaID]['date'] < extremes[key]['date']['min']) {
                    extremes[key]['date']['min'] = locations[key][mediaID]['date'];
                }
            }
        }
    }
    
    //finally, loop though and set all the unset extremes
    for (key in locations) {
        if (extremes[key]['af'] == undefined) {
            extremes[key]['af']        = new Array();
            extremes[key]['af']['max'] = 0;
            extremes[key]['af']['min'] = 0;
        }
        
        if (extremes[key]['cfs'] == undefined) {
            extremes[key]['cfs']        = new Array();
            extremes[key]['cfs']['max'] = 0;
            extremes[key]['cfs']['min'] = 0;
        }
        
        if (extremes[key]['date'] == undefined) {
            extremes[key]['date']        = 0;
            extremes[key]['date']['max'] = 0;
            extremes[key]['date']['min'] = 0;
        }
    }
}

function showHideLocations(values)
{
    if ($('#cfs_slider_container').is(':visible')) {
        showHideForType('cfs', values);
    } else if ($('#af_slider_container').is(':visible')) {
        showHideForType('af', values);
    } else {
        showHideForType('date', values);
    }
}

function showHideForType(type, values)
{
    //Can we handle this type?
    if (!(type == 'cfs' || type == 'af' || type == 'date')) {
        return false;
    }
    
    //Get values if they were not sent...
    if (values == undefined) {
        var values;
        
        if (type == 'cfs') {
            values = $("#cfs_slider").slider("values");
        }
        
        if (type == 'af') {
            values = $("#af_slider").slider("values");
        }
        
        if (type == 'date') {
            values = new Array();
            values[0] = minDate;
            values[1] = maxDate;
        }
    }
    
    //Compare
    WDN.log('Handle AF, date or CFS compare');
    for (key in locations) {
        WDN.log('type:' + type + ' min:' + extremes[key][type]['min'] + ' max:' + extremes[key][type]['max'] + ' values:' + values);
        if (extremes[key][type]['min'] > 0 && extremes[key][type]['min'] >= values[0] && extremes[key][type]['max'] <= values[1]) {
            markers[key].setVisible(true);
        } else {
            markers[key].setVisible(false);
        }
    }

    
    //Show hide and set name.
    var name;
    
    switch (type) {
        case 'af':
            name = "Volume (af)";
            $("#cfs_slider_container").hide();
            $("#af_slider_container").show();
            $("#date_slider_container").hide();
            break;
        case 'cfs':
            name = "Flow (cfs)";
            $("#cfs_slider_container").show();
            $("#af_slider_container").hide();
            $("#date_slider_container").hide();
            break;
        case 'date':
            name = "Date";
            $("#cfs_slider_container").hide();
            $("#af_slider_container").hide();
            $("#date_slider_container").show();
            break;
    }
    
    //Display values
    if (values[0] instanceof Date) {
        values[0] = values[0].toDateString(); 
    }
    
    if (values[1] instanceof Date) {
        values[1] = values[1].toDateString(); 
    }
    
    $("#amount_min").html("Min: " + values[0]);
    $("#amount_max").html("Max: " + values[1]);
    $("#display_type").html(name);
}

function initialize()
{
    var latlng = new google.maps.LatLng(41.6,-99.75);
    var options = {
        zoom: 7,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    
    var map = new google.maps.Map(document.getElementById("map_canvas"), options);
    
    setUpMarkers(map);
    
    var kmlLayer = new google.maps.KmlLayer('http://watercenter.unl.edu/WaterFlowMap/data/all_raster_crushed.kmz');
    kmlLayer.setMap(map);
    
    initExtremes();
    
    $("#af_slider").slider({
        range: true,
        orientation: "vertical",
        values: [0, maxAF],
        min:   0,
        max:   maxAF,
        slide: function( event, ui ) {
            showHideLocations(ui.values);
        }
    });
    
    $("#cfs_slider").slider({
        range: true,
        orientation: "vertical",
        values: [0, maxCFS],
        min:   0,
        max:   maxCFS,
        slide: function( event, ui ) {
            showHideLocations(ui.values);
        }
    });
    
    $("#date_slider").slider({
        range: true,
        orientation: "vertical",
        values: [0, maxDate],
        min:   0,
        max:   Math.floor((maxDate.getTime() + 86400000 - minDate.getTime()) / 86400000),
        slide: function( event, ui ) {
            values = new Array();
            values[0] = new Date(minDate.getTime());
            values[0].setDate(values[0].getDate() + ui.values[0]);
            
            values[1] = new Date(minDate.getTime());
            values[1].setDate(values[1].getDate() + ui.values[1]);
            WDN.log(values);
            showHideLocations(values);
        }
    });
    
    //Set min, med and max for slider lables.
    $("#af_min").html(0);
    $("#af_med").html(maxAF/2);
    $("#af_max").html(maxAF);
    
    $("#cfs_min").html(0);
    $("#cfs_med").html(maxCFS/2);
    $("#cfs_max").html(maxCFS);
    
    $("#date_min").html(minDate.toDateString());
    var date = new Date(Math.floor(minDate.getTime() + ((maxDate.getTime() - minDate.getTime()) / 2)));
    $("#date_med").html(date.toDateString());
    $("#date_max").html(maxDate.toDateString());
    
    $('#afTab').click(function(){
        WDN.log('selector clicked');
        showHideForType('af');
        return false;
    })
    
    $('#cfsTab').click(function(){
        WDN.log('selector clicked');
        showHideForType('cfs');
        return false;
    })
    
    $('#dateTab').click(function(){
        WDN.log('selector clicked');
        showHideForType('date');
        return false;
    })
    
    showHideLocations();
}