//set up the locations array from the json information.
var locations    = new Array();
var markers      = new Array();
var infoBoxes    = new Array();
var extremes     = new Array();
var locationIcon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
var maxAF        = 0;
var maxCFS       = 0;

WDN.jQuery(document).ready(function(){
    WDN.get('http://mediahub.unl.edu/channels/319?format=json', function(data){
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
            locations[key][data['media'][url]['id']]['date']  = data['media'][url]['mediahub_media_creation_date'];
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
    var content = "<h4>Location: " + id  + "</h4>";
    content += "<table class='infoBoxTable'><tr><td class='media'>Media</td><td class='cfs'>cfs</td><td class='af'>af</td><td class='date'>Date</td></tr>";
    
    for (mediaID in locations[id]) {
        var link = "<a href='" + locations[id][mediaID]['url'] + "'>media</a>";
        var af   = '';
        var cfs  = '';
        var date = locations[id][mediaID]['date'];
        
        if (locations[id][mediaID]['af'] !== null) {
            af = locations[id][mediaID]['af'];
        }
        
        if (locations[id][mediaID]['cfs'] !== null) {
            cfs = locations[id][mediaID]['cfs'];
        }
        
        content += "<tr><td>" + link + "</td><td>" + cfs + "</td><td>" + af + "</td><td>" + date + "</td></tr>";
    }
    
    content += "</table>";
    
    infoBoxes[id] = new google.maps.InfoWindow({
        content: content,
    });

    google.maps.event.addListener(markers[id], 'click', function() {
        infoBoxes[id].open(map, markers[id]);
    });
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
    }
}

function showHideLocations(values)
{
    if ($('#cfs_slider_container').is(':visible')) {
        showHideForType('cfs', values);
    } else {
        showHideForType('af', values);
    }
}

function showHideForType(type, values)
{
    if (!(type == 'cfs' || type == 'af')) {
        return false;
    }
    
    if (values == undefined) {
        var values;
        
        if (type == 'cfs') {
            values = $("#cfs_slider").slider("values");
        }
        
        if (type == 'af') {
            values = $("#af_slider").slider("values");
        }
    }
    
    for (key in locations) {
        WDN.log('type:' + type + ' min:' + extremes[key][type]['min'] + ' max:' + extremes[key][type]['max'] + ' values:' + values);
        if (extremes[key][type]['min'] > 0 && extremes[key][type]['min'] >= values[0] && extremes[key][type]['max'] <= values[1]) {
            markers[key].setVisible(true);
        } else {
            markers[key].setVisible(false);
        }
    }
    
    var name = "Volume (af)";
    if (type == 'cfs') {
        name = "Flow (cfs)";
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
    
    //Set min, med and max for slider lables.
    $("#af_min").html(0);
    $("#af_med").html(maxAF/2);
    $("#af_max").html(maxAF);
    $("#af_amount").html(maxAF);
    
    $("#cfs_min").html(0);
    $("#cfs_med").html(maxCFS/2);
    $("#cfs_max").html(maxCFS);
    $("#cfs_amount").html(maxCFS);
    
    $('#afTab').click(function(){
        WDN.log('selector clicked');
        showHideForType('af');
    })
    
    $('#cfsTab').click(function(){
        WDN.log('selector clicked');
        showHideForType('cfs');
    })
    
    showHideLocations();
}