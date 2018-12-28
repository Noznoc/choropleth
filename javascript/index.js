$(document).ready(function() {	

	// CREATE DATA VARIABLES
	var choroplethData = getChoroplethData(); // store data for choropleth map from data.js
	var colors = config.mapColors; // store colors for choropleth map from config.js

	// INITIALIZE MAP
	var map = new mapboxgl.Map({
	    container: 'map', // container id
	    style: lmi_map, // stylesheet for basemap
	    center: config.mapInitialCenter, // initil center position [lng, lat]
	    maxBounds: [config.mapBoundsSW, config.mapBoundsNE], // set bounds of map
	    zoom: config.mapInitialZoom // initial zoom level
	});

	// INITIALIZE AND BUILD MAP FEATURES
	$('title').html(config.mapTitle); // update title of HTML
	$('#layers').html(buildLayerMenu()); // build menu based on what is in config.js
	$(function () { // initialize material design bootstrap tooltips
		$('[data-toggle="tooltip"]').tooltip(); 
	})
    var popup = new mapboxgl.Popup({ // initialize map popups
        closeButton: false,
        closeOnClick: false
    });

    // FUNCTION FOR CREATING COLOR RANGE FOR CHOROPLETH BASED ON NUMBER OF DATA CLASSES (**THIS COULD BE IMPROVED**)
    function buildColors(classes,colors) {
    	var colorsAdjust = [];
    	if (classes.length >= 7) {
    		colorsAdjust = colors.slice();
    	} else  {
    		colorsAdjust.push(colors[0],colors[2],colors[3],colors[5],colors[7],colors[9]);
    	} 
    	return colorsAdjust;
    }

    // FUNCTION FOR BUILDING THE MAP MENU (IN THE TOP RIGHT CORNER OF MAP)
    function buildLayerMenu() {
    	var title = '<h2>'+config.mapTitle.toUpperCase()+'</h2>',
    		description = '<p>'+config.mapDescription+'</p><p>'+config.mapInfo+'</p>',
    		dropMenu = '<select data-toggle="tooltip" data-placement="left" title="Select the classification method (Note: Geometric Progression method will not work with data that has null and 0 values)" class="select select-class browser-default custom-select"><option value="jenks">Jenks</option><option value="eqInterval">Equal Interval</option><option value="stdDeviation">Standard Deviation</option><option value="arithmeticProgression">Arithmetic Progression</option><option value="geometricProgression">Geometric Progression</option><option value="quantile">Quantile</option></select>',
    		classes = '<select data-toggle="tooltip" data-placement="top" title="Select the number of data classes" class="select select-bin browser-default custom-select"><option>5</option><option>6</option><option>7</option><option selected="selected">8</option><option>9</option></select>',
    		buttons = '',
    		hide = '<button class="button-hide hide active">Hide Census Layer</button>',
    		error = '<div class="error"></div>';
    	for (var i in config.mapVariablesNames) {
    		buttons += '<button class="button-layer" value="'+config.mapVariables[i]+'">'+config.mapVariablesNames[i]+'</button>'
    	}
    	var html = title + description + '<div class="selects"><ul class=select-label><li><strong>Classification</strong> Method</li><li>Number</li></ul>' + dropMenu + classes + '</div>' + buttons + hide + error;
    	return html;
    }

    // FUNCTION TO ADD A VARIABLE'S VALUES TO AN ARRAY TO BE CLASSIFIED FOR CHOROPLETH
    function getValues(data, variable){
		var values = [];
	    Object.keys(data.features).forEach(function(key) {
	    	if (data.features[key].properties[variable] !== null) {
				var val = data.features[key].properties[variable]; // get the value of name
				values.push(val); // push the name string in the array
			}
		});
		return values;
    }

    // FUNCTION THAT CLASSIFIES THE DATA VALUES BASED ON WHICH METHOD USER SELECTS
	function buildClasses(selectedClass, choroplethStats, binNumber) {
		var classes;
		try {
	    	if (selectedClass == 'jenks'){
	    		classes = choroplethStats.getClassJenks(binNumber);
	    	} else if (selectedClass == 'eqInterval') {
	    		classes = choroplethStats.getEqInterval(binNumber);
	    	} else if (selectedClass == 'stdDeviation') {
	    		classes = choroplethStats.getStdDeviation(binNumber);
	    	} else if (selectedClass == 'arithmeticProgression') {
	    		classes = choroplethStats.getArithmeticProgression(binNumber);
	    	} else if (selectedClass == 'geometricProgression') {
	    		classes = choroplethStats.getGeometricProgression(binNumber);
	    	} else {
	    		classes = choroplethStats.getQuantile(binNumber);
	    	}
	    	return classes;
		} catch(err) {
			$('.error').html(err + '<strong> Please select a different classification method or Census variable.</strong>');
		}
	}

    // FUNCTION THAT CREATES AN ARRAY OF STOPS AND COLORS FOR THE DATA CLASSES
    function interpolateClasses(binNumber, classes, colors) {
    	var interpolation = []; //classes[classes.length-1],'#fff'
    	var colorsAdj = buildColors(classes,colors);
    	for (var i = 0; i <= binNumber; i++) {
	    	interpolation.push(classes[i], colorsAdj[i]);
    	}
    	return interpolation;    
	}

	// FUNCTION FOR BUILDING THE MAP LEGEND (IN THE BOTTOM LEFT CORNER OF MAP)
	function buildLegend(classes, variable) {
    	var legend = '<div class="legend-title">'+variable.toUpperCase()+'</div>';
    	var colorsAdj = buildColors(classes,colors);
    	for (var i in classes){
    		var iter = parseInt(i);
    		if (iter !== classes.length-1) {
    			var past = iter+1,
    				value = classes[i].toFixed(1);
    			if (value == 0.00) {
    				value = 0;
    			}
    			if (value.toString().indexOf('.0') >= 0) {
    				value = value.toString().split('.')[0];
    			}
    			legend += '<div><span style="background-color:'+colorsAdj[i]+'"></span>'+value+' - '+(((classes[past].toFixed(1))-0.1)+0.09).toFixed(2)+'</div>';
    		} else {
    			legend += '<div><span style="background-color:'+colorsAdj[i]+'"></span>>='+classes[i].toFixed(1)+'</div>';
    		}
    	}
    	legend += '<div><span style="background-color:#000"></span>No Data</div>';
    	return legend;
    }

    // FUNCTION THAT UPDATES THE MAP BASED ON USER'S SELECTION
	function updateMap(button) {
    	$('.button-layer').removeClass('selected');
    	$(button).addClass('selected');
    	$('.error').html('');

    	var variable =  $(button).attr('value'),
    		uid = $(button).attr('id'),
    		selectedClass = $('.select-class').val(),
    		name = $(button).html(),
    		binNumber = parseInt($('.select-bin option:selected').text()),
    		choroplethStats = new geostats(getValues(choroplethData[0], variable)),
    		classes = buildClasses(selectedClass,choroplethStats,binNumber),
			fill = ['interpolate', ['linear'], ['get', variable]].concat(interpolateClasses(binNumber, classes, colors));
    	
    	map.setPaintProperty('choropleth', 'fill-color', fill);
    	$('#legend').html(buildLegend(classes,name.toUpperCase()));
	}

	// ONCE THE MAP LOADS, LOAD THE DEFAULT DATA/SETTINGS FROM CONFIG.JS
	map.on('load', function() {
		var choroplethStats = new geostats(getValues(choroplethData[0], config.mapInitialVar[0])), // generate the classes
			classes = buildClasses(config.mapClassMethod,choroplethStats,config.mapBins), // with the classess, organize data in an array with the colors
			classesNull = [];
		classesNull = classes.slice(); // TO DO: figure out how to modify the color of null values
		//classesNull.push(null);
		
		// add map layer of census tracts
	    map.addLayer({
	        'id': 'choropleth', // map layer id
	        'type': 'fill', // type of geometric object (fill indicates polygon in this case)
	        'source': {
	            'type': 'geojson', // specify the data source type, in this case geojson
	            'data': choroplethData[0] // call the data variable that has stored the geojson data from data.js
	        },
	        'paint': {
	            'fill-color': [
	                'interpolate', // use the interpolate method to match the class stops to the colors
	                ['linear'],
	                ['get', config.mapInitialVar[0]]
	            ].concat(interpolateClasses(config.mapBins, classesNull, colors)),
	            'fill-opacity': 0.7,
	            'fill-outline-color': '#4B515D'
        	}
	    }, 'place-town'); // 'place-town' allows for the labels from lmi-style.js to appear over the choropleth map layer

	    $('#legend').html(buildLegend(classes,config.mapInitialVar[1])); // update legend
	    $('.button-layer').first().addClass('selected'); // change button color to indicate it is active on map

	    // WHEN USER CLICKS THIS BUTTON, HIDE/SHOW (TOGGLE) THE CHOROPLETH LAYER
	    $('.button-hide').on('click', function(){
	        var visibility = map.getLayoutProperty('choropleth', 'visibility'),
	        	layer = 'choropleth';
	        if (visibility === 'visible') {
	            map.setLayoutProperty(layer, 'visibility', 'none');
	            $(this).html('Show Census Layer');
	            $(this).addClass('hide').removeClass('active');
	        } else {
	            $(this).addClass('active').removeClass('hide');
	            map.setLayoutProperty(layer, 'visibility', 'visible');
	            $(this).html('Hide Census Layer');
	        }
	    });

	    // WHEN USER HOVERS OVER THE CHOROPLETH MAP LAYER, GENERATE THE POPUPS
	    map.on('mouseover', 'choropleth', function(e) {
	        map.getCanvas().style.cursor = 'pointer';
	        var rows = '';
	        for (var i in config.mapVariablesNames) {
	        	rows += '<tr><td>'+config.mapVariablesNames[i]+'</td><td>' + e.features[0].properties[config.mapVariables[i]] + '</td></tr>';
	        }
	        var description = '<table>' + rows + '</table>';
	        popup.setLngLat(e.lngLat)
	            .setHTML(description)
	            .addTo(map);
	    });

	    // WHEN USER LEAVES THE CHOROPLETH MAP LAYER, RETURN CURSOR AND REMOVE POPUP
	    map.on('mouseleave', 'choropleth', function() {
	        map.getCanvas().style.cursor = '';
	        popup.remove();
	    });

	    // WHEN USER CLICKS A DATA VARIABLE BUTTON, UPDATE THE MAP WITH THE SELECTED DATA VARIABLE
	    $('.button-layer').on('click', function(){
	    	updateMap(this);
	    });

	    // WHEN USER SELECTS A DIFFERENT CLASSIFICATION METHOD, UPDATE THE MAP WITH THE NEW CLASSIFICATION METHOD
	    $('.select-class').on('change', function(){
	    	updateMap($('.button-layer.selected'));
	    })

	    // WHEN USER SELECTS A DIFFERENT NUMBER OF CLASSES, UPDATE THE MAP WITH THE NEW NUMBER OF CLASSES
	    $('.select-bin').on('change', function(){
	    	updateMap($('.button-layer.selected'));
	    })
	});
});