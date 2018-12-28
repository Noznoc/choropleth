$(document).ready(function() {	

	$('title').html(config.mapTitle);
	$('#layers').html(buildLayerMenu());
	$(function () {
		$('[data-toggle="tooltip"]').tooltip();
	})

	var choroplethData = getChoroplethData(); // data for choropleth

	// colors for choropleth, change here to update colors on choropleth
	var colors = config.mapColors;

	// initialize map
	var map = new mapboxgl.Map({
	    container: 'map', // container id
	    style: lmi_map, // stylesheet
	    center: config.mapInitialCenter, // starting position [lng, lat]
	    maxBounds: [config.mapBoundsSW, config.mapBoundsNE], // set bounds of map
	    zoom: config.mapInitialZoom // starting zoom
	});

	// initialize popup for map
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    function buildLayerMenu() {
    	var title = '<h2>'+config.mapTitle.toUpperCase()+'</h2>',
    		description = '<p>'+config.mapDescription+'<p>Select the variable to see on the map and feel free to select the classification method and the number of bins</p></p>',
    		dropMenu = '<select class="select select-class browser-default custom-select"><option value="jenks">Jenks</option><option value="eqInterval">Equal Interval</option><option value="stdDeviation">Standard Deviation</option><option value="arithmeticProgression">Arithmetic Progression</option><option value="geometricProgression">Geometric Progression</option><option value="quantile">Quantile</option></select>',
    		bins = '<select class="select select-bin browser-default custom-select"><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option selected="selected">8</option><option>9</option><option>10</option><option>11</option></select>',
    		buttons = '',
    		hide = '<button class="button-hide hide active">Hide Census Layer</button>',
    		error = '<div class="error"></div>';
    	for (var i in config.mapVariablesNames) {
    		buttons += '<button class="button-layer" data-toggle="tooltip" data-placement="left" title="View '+config.mapVariablesNames[i]+' on the map" value="'+config.mapVariables[i]+'">'+config.mapVariablesNames[i]+'</button>'
    	}
    	var html = title + description + '<div class="selects">' + dropMenu + bins + '</div>' + buttons + hide + error;
    	return html;
    }

	// function for building the legend
	function buildLegend(bins, variable) {
    	var legend = '<div class="legend-title">'+variable.toUpperCase()+'</div>';
    	for (var i in bins){
    		var iter = parseInt(i);
    		if (iter !== bins.length-1) {
    			var past = iter+1,
    				value = bins[i].toFixed(1);
    			if (value == 0.00) {
    				value = 0;
    			}
    			if (value.toString().indexOf('.0') >= 0) {
    				value = value.toString().split('.')[0];
    			}
    			legend += '<div><span style="background-color:'+colors[i]+'"></span>'+value+' - '+(((bins[past].toFixed(1))-0.1)+0.09).toFixed(2)+'</div>';
    		} else {
    			legend += '<div><span style="background-color:'+colors[i]+'"></span>>='+bins[i].toFixed(1)+'</div>';
    		}
    	}
    	legend += '<div><span style="background-color:#000"></span>No Data</div>';
    	return legend;
    }

    // function to add a variable values to an array to be binned for choropleth
    function getValues(data, variable){
		var values = [];
	    Object.keys(data.features).forEach(function(key) {
	    	if (data.features[key].properties[variable] !== null) {
				var val = data.features[key].properties[variable]; //get the value of name
				values.push(val); //push the name string in the array
			}
		});
		return values;
    }

    function interpolateBins(binNumber, bins, colors) {
    	var interpolation = []; //bins[bins.length-1],'#fff'
    	for (var i = 0; i <= binNumber; i++) {
	    	interpolation.push(bins[i], colors[i]);
    	}
    	return interpolation;    
	}

	function buildClasses(selectedClass, choroplethStats, binNumber) {
		try {
	    	if (selectedClass == 'jenks'){
	    		var bins = choroplethStats.getClassJenks(binNumber);
	    	} else if (selectedClass == 'eqInterval') {
	    		var bins = choroplethStats.getEqInterval(binNumber);
	    	} else if (selectedClass == 'stdDeviation') {
	    		var bins = choroplethStats.getStdDeviation(binNumber);
	    	} else if (selectedClass == 'arithmeticProgression') {
	    		var bins = choroplethStats.getArithmeticProgression(binNumber);
	    	} else if (selectedClass == 'geometricProgression') {
	    		var bins = choroplethStats.getGeometricProgression(binNumber);
	    	} else {
	    		var bins = choroplethStats.getQuantile(binNumber);
	    	}
	    	return bins;
		} catch(err) {
			$('.error').html(err + '<strong> Please select a different classification method or Census variable.</strong>');
		}
	}

	function updateMap(button) {
		// adjust the button colors
    	$('.button-layer').removeClass('selected');
    	$(button).addClass('selected');
    	$('.error').html('');

    	var variable =  $(button).attr('value'),
    		uid = $(button).attr('id'),
    		selectedClass = $('.select-class').val(),
    		name = $(button).html(),
    		binNumber = parseInt($('.select-bin option:selected').text()),
    		choroplethStats = new geostats(getValues(choroplethData[0], variable)),
    		bins = buildClasses(selectedClass,choroplethStats,binNumber),
			fill = ['interpolate', ['linear'], ['get', variable]].concat(interpolateBins(binNumber, bins, colors));
    	
    	map.setPaintProperty('choropleth', 'fill-color', fill);
    	$('#legend').html(buildLegend(bins,name.toUpperCase()));
	}

	// once map loads, run the following
	map.on('load', function() {
		var choroplethStats = new geostats(getValues(choroplethData[0], config.mapInitialVar[0])),
			bins = buildClasses(config.mapClassMethod,choroplethStats,config.mapBins),
			binsNull = [];
		binsNull = bins.slice();
		//binsNull.push(null);
		// add map layer of census tracts
	    map.addLayer({
	        'id': 'choropleth',
	        'type': 'fill',
	        'source': {
	            'type': 'geojson',
	            'data': choroplethData[0]
	        },
	        'layout': {},
	        'paint': {
	            'fill-color': [
	                'interpolate',
	                ['linear'],
	                ['get', config.mapInitialVar[0]]
	            ].concat(interpolateBins(config.mapBins, binsNull, colors)),
	            'fill-opacity': 0.7,
	            'fill-outline-color': '#4B515D'
        	}
	    }, 'place-town');
	    console.log(bins)
	    $('#legend').html(buildLegend(bins,config.mapInitialVar[1])); // update legend
	    $('.button-layer').first().addClass('selected'); // change button color to indicate it is active on map

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

	    map.on('click', 'choropleth', function(e) {
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

	    map.on('mouseleave', 'choropleth', function() {
	        map.getCanvas().style.cursor = '';
	        popup.remove();
	    });

	    $('.button-layer').on('click', function(){
	    	updateMap(this);
	    });

	    $('.select-class').on('change', function(){
	    	updateMap($('.button-layer.selected'));
	    })

	    $('.select-bin').on('change', function(){
	    	updateMap($('.button-layer.selected'));
	    })
	});
});