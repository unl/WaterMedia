//set up the locations array from the json information.
var locations = new Array();
var markers   = new Array();
var infoBoxes = new Array();
var mafIcon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png';
var cfsIcon = 'http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png';
var maxMAF = 0;
var maxCFS = 0;

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
            
            if (data['media'][url]['mediahub_water_maf'] == undefined) {
                data['media'][url]['mediahub_water_maf'] = null;
            }
            
            //set max cfs.
            if (data['media'][url]['mediahub_water_cfs'] > maxCFS) {
                maxCFS = data['media'][url]['mediahub_water_cfs'];
            }
            
            //set max maf.
            if (data['media'][url]['mediahub_water_maf'] > maxMAF) {
                maxMAF = data['media'][url]['mediahub_water_maf'];
            }
            
            locations[data['media'][url]['id']]          = new Array();
            locations[data['media'][url]['id']]['url']   = url;
            locations[data['media'][url]['id']]['title'] = data['media'][url]['title'];
            locations[data['media'][url]['id']]['lat']   = data['media'][url]['geo_lat'];
            locations[data['media'][url]['id']]['lng']   = data['media'][url]['geo_long'];
            locations[data['media'][url]['id']]['cfs']   = data['media'][url]['mediahub_water_cfs'];
            locations[data['media'][url]['id']]['maf']   = data['media'][url]['mediahub_water_maf'];
        }
        initialize();
    });
});

function setUpMarkers(map)
{
    markers   = new Array();
    infoBoxes = new Array();
    for (id in locations) {
        var color = cfsIcon;
        
        if (locations[id]['cfs'] == null){
            color = mafIcon;
        }
        
        markers[id] = new google.maps.Marker({
            position: new google.maps.LatLng(locations[id]['lat'], locations[id]['lng']),
            map: map,
            title: locations[id]['title'],
            mediahub_locationID: id,
            icon: color
        });
        
        setUpInfoBox(map, id);
    }
}

function setUpInfoBox(map, id)
{
    var maf = '';
    var cfs = '';
    
    if (locations[id]['maf'] !== null) {
        maf = "MAF: " + locations[id]['maf'] + "<br />";
    }
    
    if (locations[id]['cfs'] !== null) {
        maf = "CFS: " + locations[id]['cfs'] + "<br />";
    }
    
    var content = "Title: " + locations[id]['title'] + "<br />" +
                    "<a href='" + locations[id]['url'] + "'>media</a><br />" +
                    maf + cfs;
    
    infoBoxes[id] = new google.maps.InfoWindow({
        content: content
    });

    google.maps.event.addListener(markers[id], 'click', function() {
        infoBoxes[id].open(map, markers[id]);
    });
}

function initialize() {
    var latlng = new google.maps.LatLng(41.6,-99.7);
    var options = {
        zoom: 7,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"), options);
    setUpMarkers(map);
    
    $("#maf_slider").slider({
        value:0,
        min: 0,
        max: maxMAF,
        slide: function( event, ui ) {
            $("#maf_amount").html(ui.value);
        }
    });
    
    $("#cfs_slider").slider({
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