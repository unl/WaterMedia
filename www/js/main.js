//set up the locations array from the json information.
var locations    = new Array();
var markers      = new Array();
var infoBoxes    = new Array();
var locationIcon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
var maxMAF       = 0;
var maxCFS       = 0;

WDN.jQuery(document).ready(function(){
    WDN.get('http://ucommfairchild.unl.edu/mediahub/www/channels/1?format=json', function(data){
        for (url in data['media']) {
            //skip if we don't have geo data.
            if (data['media'][url]['geo_lat'] == undefined) {
                continue;
            }
            
            if (data['media'][url]['geo_long'] == undefined) {
                continue;
            }
            
            //make sure things are formatted well.
            if (data['media'][url]['mediahub_water_cfs'] == undefined) {
                data['media'][url]['mediahub_water_cfs'] = null;
            }
            
            if (data['media'][url]['mediahub_water_af'] == undefined) {
                data['media'][url]['mediahub_water_af'] = null;
            }
            
            //set max cfs.
            if (data['media'][url]['mediahub_water_cfs'] > maxCFS) {
                maxCFS = data['media'][url]['mediahub_water_cfs'];
            }
            
            //set max maf.
            if (data['media'][url]['mediahub_water_maf'] > maxMAF) {
                maxMAF = data['media'][url]['mediahub_water_maf'];
            }
            
            //generate the key (group by geo locaiton).
            var key = data['media'][url]['geo_lat'] + "," + data['media'][url]['geo_long'];
            
            //Set the location array.
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
            locations[key][data['media'][url]['id']]['date']  = data['media'][url]['pubDate'];
        }
        
        initialize();
    });
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

function initialize() {
    var latlng = new google.maps.LatLng(41.6,-99.75);
    var options = {
        zoom: 7,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"), options);
    setUpMarkers(map);
    
    $("#maf_slider").slider({
        orientation: "vertical",
        value:0,
        min: 0,
        max: maxMAF,
        slide: function( event, ui ) {
            $("#maf_amount").html(ui.value);
        }
    });
    
    $("#cfs_slider").slider({
        orientation: "vertical",
        value:0,
        min: 0,
        max: maxCFS,
        slide: function( event, ui ) {
            $("#cfs_amount").html(ui.value);
        }
    });
    
    //Set min, med and max for slider lables.
    $("#maf_min").html(0);
    $("#maf_med").html(maxMAF/2);
    $("#maf_max").html(maxMAF);
    
    $("#cfs_min").html(0);
    $("#cfs_med").html(maxCFS/2);
    $("#cfs_max").html(maxCFS);
}