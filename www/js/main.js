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

WDN.loadCSS(WDN.getTemplateFilePath('scripts/plugins/ui/ui.all.css'));

WDN.jQuery(document).ready(function(){
    WDN.loadJS(WDN.getTemplateFilePath('scripts/plugins/ui/jQuery.ui.js'), function () {
        init();
    });
});

function formatDate(date)
{
    return date.getFullYear() + "-" + (date.getMonth() + 1)  + "-" + date.getDate();
}

function formatNumber(number)
{
    return WDN.jQuery.formatNumber(number, {format:"#,###", locale:"us"});
}

function init()
{
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

            //sanitize data
            data['media'][url]['mediahub_water_cfs'] = parseInt(data['media'][url]['mediahub_water_cfs']);
            data['media'][url]['mediahub_water_af'] = parseInt(data['media'][url]['mediahub_water_af']);

            //make sure things are formatted well.
            if (data['media'][url]['mediahub_water_cfs'] == undefined
                || isNaN(data['media'][url]['mediahub_water_cfs'])) {
                data['media'][url]['mediahub_water_cfs'] = null;
            }

            
            if (data['media'][url]['mediahub_water_af'] == undefined
                || isNaN(data['media'][url]['mediahub_water_af'])) {
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

            data['media'][url]['date'] = new Date(year, month-1, day);

            if (maxDate == 0 || data['media'][url]['date'] > maxDate) {
                maxDate = data['media'][url]['date'];
            }

            if (minDate == 0 || data['media'][url]['date'] < minDate) {
                minDate = data['media'][url]['date'];
            }

            //set max cfs.
            if (data['media'][url]['mediahub_water_cfs'] > maxCFS) {
                maxCFS = data['media'][url]['mediahub_water_cfs'];
                //WDN.log('maxCFS: ' + maxCFS);
            }

            //set max af.
            if (data['media'][url]['mediahub_water_af'] > maxAF) {
                maxAF = data['media'][url]['mediahub_water_af'];
                //WDN.log('maxAF: ' + maxAF);
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

        WDN.initializePlugin('modal', [function() {
            start();
        }]);
    }, 'json'); 
}

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
    var content = "<div id='infoWindow'>";
    content += "<table class='infoBoxTable'><tr><td class='media'>Media</td><td class='cfs'>cfs</td><td class='af'>af</td><td class='date'>Date</td></tr>";
    
    for (mediaID in locations[id]) {
        var link = "<a href='" + locations[id][mediaID]['url'] + "' class='colorBoxElement'>" + locations[id][mediaID]['title'] + "</a>";
        var af   = '';
        var cfs  = '';
        var date = formatDate(locations[id][mediaID]['date']);
        
        if (locations[id][mediaID]['af'] !== null) {
            af = locations[id][mediaID]['af'];
        }
        
        if (locations[id][mediaID]['cfs'] !== null) {
            cfs = locations[id][mediaID]['cfs'];
        }
        
        content += "<tr><td>" + link + "</td><td>" + formatNumber(cfs) + "</td><td>" + formatNumber(af) + "</td><td>" + date + "</td></tr>";
    }
    
    content += "</table></div>";
    
    infoBoxes[id] = new google.maps.InfoWindow({
        content: content
    });

    google.maps.event.addListener(markers[id], 'click', function() {
        for (i in infoBoxes) {
            infoBoxes[i].close();
        }
        
        infoBoxes[id].open(map, markers[id]);
        
        WDN.jQuery(".colorBoxElement").click(function(){
           updateMedia(media[this]);
           WDN.jQuery().colorbox({width:"700px", height:"570px",inline:true, href:"#waterMedia"});
           return false;
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
    if (WDN.jQuery('#cfs_slider_container').is(':visible')) {
        showHideForType('cfs', values);
    } else if (WDN.jQuery('#af_slider_container').is(':visible')) {
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
            values = WDN.jQuery("#cfs_slider").slider("values");
        }
        
        if (type == 'af') {
            values = WDN.jQuery("#af_slider").slider("values");
        }
        
        if (type == 'date') {
            values = new Array();
            values[0] = minDate;
            values[1] = maxDate;
        }
    }
    
    //Compare
    //WDN.log('Handle AF, date or CFS compare');
    for (key in locations) {
        //WDN.log('type:' + type + ' min:' + extremes[key][type]['min'] + ' max:' + extremes[key][type]['max'] + ' values:' + values);
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
            WDN.jQuery("#cfs_slider_container").hide();
            WDN.jQuery("#af_slider_container").show();
            WDN.jQuery("#date_slider_container").hide();
            break;
        case 'cfs':
            name = "Flow (cfs)";
            WDN.jQuery("#cfs_slider_container").show();
            WDN.jQuery("#af_slider_container").hide();
            WDN.jQuery("#date_slider_container").hide();
            break;
        case 'date':
            name = "Date";
            WDN.jQuery("#cfs_slider_container").hide();
            WDN.jQuery("#af_slider_container").hide();
            WDN.jQuery("#date_slider_container").show();
            break;
    }
    
    //Display values
    if (values[0] instanceof Date) {
        values[0] = formatDate(values[0]); 
    }
    
    if (values[1] instanceof Date) {
        values[1] = formatDate(values[1]); 
    }
    
    WDN.jQuery("#amount_min_input").val(values[0]);
    WDN.jQuery("#amount_max_input").val(values[1]);
    WDN.jQuery("#display_type").html(name);
}

function getCurrentSlider()
{
    if (WDN.jQuery('#cfs_slider_container').is(':visible')) {
        return '#cfs_slider';
    } else if (WDN.jQuery('#af_slider_container').is(':visible')) {
        return '#af_slider';
    } else {
        return '#date_slider';
    }
}

function destroyDatePickers()
{
    if (WDN.jQuery('#amount_min_input').hasClass('hasDatepicker') == true) {
        WDN.jQuery('#amount_min_input').datepicker("destroy");
    }
    
    if (WDN.jQuery('#amount_max_input').hasClass('hasDatepicker') == true) {
        WDN.jQuery('#amount_max_input').datepicker("destroy");
    }
}

function createDatePickers()
{
    var options = {'dateFormat': 'yy-mm-dd',
                   'changeMonth': true,
                   'changeYear': true,
                   'maxDate': formatDate(maxDate),
                   'minDate': formatDate(minDate)}
    if (WDN.jQuery('#amount_min_input').hasClass('hasDatepicker') == false) {
        WDN.jQuery('#amount_min_input').datepicker(options);
    }
    
    if (WDN.jQuery('#amount_max_input').hasClass('hasDatepicker') == false) {
        WDN.jQuery('#amount_max_input').datepicker(options);
    }
}

function getCurrentDates()
{
    ui_values = WDN.jQuery('#date_slider').slider('values');
    values = new Array();
    values[0] = new Date(minDate.getTime());
    values[0].setDate(values[0].getDate() + ui_values[0]);
    
    values[1] = new Date(minDate.getTime());
    values[1].setDate(values[1].getDate() + ui_values[1]);
    
    return values;
}

function start()
{
    var latlng = new google.maps.LatLng(41.6,-99.75);
    var options = {
        zoom: 7,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };
    
    var map = new google.maps.Map(document.getElementById("map_canvas"), options);
    
    setUpMarkers(map);
    
    var kmlLayer = new google.maps.KmlLayer('http://watercenter.unl.edu/WaterFlowMap/data/all_raster_crushed.kmz', {'preserveViewport': true});
    
    kmlLayer.setMap(map);
    
    google.maps.event.addListener(map, 'zoom_changed', function() {
        zoomLevel = map.getZoom();
        
        //At 9 disable kml layer.
        if (zoomLevel < 9) {
            if (!kmlLayer.getMap()) {
                kmlLayer.setMap(map);
            }
        } else {
            if (kmlLayer.getMap()) {
                kmlLayer.setMap(null);
            }
        }
        
        return true;
        //map.setZoom(zoomLevel);
    });

    initExtremes();
    
    WDN.jQuery("#af_slider").slider({
        range: true,
        orientation: "vertical",
        values: [0, maxAF],
        min:   0,
        max:   maxAF,
        slide: function( event, ui ) {
            showHideLocations(ui.values);
        }
    });
    
    WDN.jQuery("#cfs_slider").slider({
        range: true,
        orientation: "vertical",
        values: [0, maxCFS],
        min:   0,
        max:   maxCFS,
        slide: function( event, ui ) {
            showHideLocations(ui.values);
        }
    });
    
    WDN.jQuery("#date_slider").slider({
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
            //WDN.log(values);
            showHideLocations(values);
        }
    });
    
    //Set min, med and max for slider lables.
    WDN.jQuery("#af_min").html(0);
    WDN.jQuery("#af_med").html(formatNumber(maxAF/2));
    WDN.jQuery("#af_max").html(formatNumber(maxAF));
    
    WDN.jQuery("#cfs_min").html(0);
    WDN.jQuery("#cfs_med").html(formatNumber(maxCFS/2));
    WDN.jQuery("#cfs_max").html(formatNumber(maxCFS));
    
    WDN.jQuery("#date_min").html(formatDate(minDate));
    var date = new Date(Math.floor(minDate.getTime() + ((maxDate.getTime() - minDate.getTime()) / 2)));
    WDN.jQuery("#date_med").html(formatDate(date));
    WDN.jQuery("#date_max").html(formatDate(maxDate));
    
    WDN.jQuery('#afTab').click(function(){
        //WDN.log('selector clicked');
        destroyDatePickers();
        showHideForType('af');
        return false;
    })
    
    WDN.jQuery('#cfsTab').click(function(){
        //WDN.log('selector clicked');
        destroyDatePickers();
        showHideForType('cfs');
        return false;
    })
    
    WDN.jQuery('#dateTab').click(function(){
        //WDN.log('selector clicked');
        createDatePickers();
        showHideForType('date');
        return false;
    })
    
    WDN.jQuery('#amount_min_input, #amount_max_input').keydown(function(event){
       if (isValidAmount(event.which)) {
           return true;
       }
       
       return false;
    });
    
    WDN.jQuery('#amount_min_input').keyup(function(){
        handleUserInputForAmount('#amount_min_input')
    });
    
    WDN.jQuery('#amount_min_input').change(function(){
        handleUserInputForAmount('#amount_min_input')
    });
    
    WDN.jQuery('#amount_max_input').keyup(function(){
        handleUserInputForAmount('#amount_max_input');
    });
    
    WDN.jQuery('#amount_max_input').change(function(){
        handleUserInputForAmount('#amount_max_input');
    });
    
    showHideLocations();

    WDN.jQuery('body').chardinJs('start');
    
    WDN.jQuery('#toggle_instructions').click(function() {
        WDN.jQuery('body').chardinJs('toggle');
        return false;
    });
}

function handleUserInputForAmount(inputID)
{
    var index = 0;
    
    if (inputID == '#amount_max_input') {
       index = 1;
    }
    
    var slider = getCurrentSlider();
    
    
    
    //Hande the sepecial case of the date slider.
    if (slider == '#date_slider') {
        var amount = WDN.jQuery(inputID).val();
        
        values = getCurrentDates();
        
        var newDate = new Date(amount);
        
        //We have to add one day for some reason.
        newDate = new Date(newDate.getTime() + 86400000);
        
        //Make sure it is within bounds.
        if (newDate > maxDate) {
            newDate = maxDate;
        }
        
        if (newDate < minDate) {
            newDate = minDate;
        }
        
        values[index] = newDate;
        
        sliderTime = parseInt(minDate.getDate() + ((newDate.getTime() - minDate.getTime())/86400000));
        
        //Update the slider
        WDN.jQuery(slider).slider('values', index, sliderTime);
        
        //Show and hide locations
        return showHideLocations(values);
    }
    
    var amount = parseFloat(WDN.jQuery(inputID).val());
    
    if (isNaN(amount) && slider !== '#date_slider') {
        amount = 0;
    }
    
    WDN.jQuery(slider).slider('values', index, amount);
    showHideLocations(WDN.jQuery(slider).slider('values'));
}

function isValidAmount(amount)
{
   switch(amount){
   case 48:
   case 49:
   case 50:
   case 51:
   case 52:
   case 53:
   case 54:
   case 55:
   case 56:
   case 57:
   case 58:
   case 96:
   case 97:
   case 98:
   case 99:
   case 100:
   case 101:
   case 102:
   case 103:
   case 104:
   case 105:
   case 106:
   case 116:
   case 224:
   case 9:
   case 8:
   case 17:
   case 18:
       return true;
       break;
   default: 
       return false;
   }
}