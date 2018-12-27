$(document).ready(function() {	

	$('title').html(config.mapTitle);
	$('#layers').html(buildLayerMenu());

	var choroplethData = getChoroplethData(), // data for choropleth
		choropleth;  // initialize variable for choropleth map layer

	// variable for the slider, change here to update labels on slider
	var sliderVar = config.sliderVar;

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
    		hide = '<button title="Hide/Show Census map layer" class="button-hide hide active">Hide Census Layer</button>';
    	for (var i in config.mapVariablesNames) {
    		buttons += '<button class="button-layer" value="'+config.mapVariables[i]+'">'+config.mapVariablesNames[i]+'</button>'
    	}
    	var html = title + description + '<div class="selects">' + dropMenu + bins + '</div>' + buttons + hide;
    	return html;
    }

	// function for building the legend
	function buildLegend(bins, variable) {
    	var legend = '<div class="legend-title">'+variable+'</div>';
    	for (var i in bins){
    		var iter = parseInt(i);
    		if (iter !== bins.length-1) {
    			var past = iter+1;
    			legend += '<div><span style="background-color:'+colors[i]+'"></span>'+bins[i]+' - '+(parseInt((bins[past]-0.1).toFixed(1))+0.99)+'</div>';
    		} else {
    			legend += '<div><span style="background-color:'+colors[i]+'"></span>>='+bins[i]+'</div>';
    		}
    	}
    	legend += '<div><span style="background-color:#000"></span>Aucune donnée</div>';
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
    	var interpolation = [];

    	for (var i = 0; i <= binNumber; i++) {
	    	interpolation.push(bins[i], colors[i]);
    	}

    	return interpolation;    
	}

	function updateMap(button) {
		// adjust the button colors
    	$('.button-layer').css('background-color', '#8c96c6').removeClass('selected');
    	$(button).css('background-color','#88419d').addClass('selected');

    	var variable =  $(button).attr('value'),
    		uid = $(button).attr('id'),
    		name = $(button).html(),
    		binNumber = parseInt($('.select-bin option:selected').text()),
    		choroplethStats = new geostats(getValues(choroplethData[0], variable));

    	if ($('.select-class').val() == 'jenks'){
    		var bins = choroplethStats.getClassJenks(binNumber);
    	} else if ($('.select-class').val() == 'EqInterval') {
    		var bins = choroplethStats.getEqInterval(binNumber);
    	} else if ($('.select-class').val() == 'StdDeviation') {
    		var bins = choroplethStats.getStdDeviation(binNumber);
    	} else if ($('.select-class').val() == 'ArithmeticProgression') {
    		var bins = choroplethStats.getArithmeticProgression(binNumber);
    	}  else if ($('.select-class').val() == 'GeometricProgression') {
    		var bins = choroplethStats.getGeometricProgression(binNumber);
    	} else {
    		var bins = choroplethStats.getQuantile(binNumber);
    	}

    	var fill = ['interpolate', ['linear'], ['get', variable]].concat(interpolateBins(binNumber, bins, colors));
    	map.setPaintProperty('choropleth', 'fill-color', fill);
    	$('#legend').html(buildLegend(bins,name.toUpperCase()));
	}

	// once map loads, run the following
	map.on('load', function() {
		var choroplethStats = new geostats(getValues(choroplethData[0], config.mapInitialVar[0]));
		var bins = choroplethStats.getClassJenks(config.mapBins);
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
	            ].concat(interpolateBins(config.mapBins, bins, colors)),
	            'fill-opacity': 0.7,
	            'fill-outline-color': '#eee'
        	}
	    }, choropleth);

	    $('#legend').html(buildLegend(bins,config.mapInitialVar[1])); // update legend
	    $('.button-layer').first().addClass('selected'); // change button color to indicate it is active on map

	    $('.button-hide').on('click', function(){
	        var visibility = map.getLayoutProperty('choropleth', 'visibility'),
	        	layer = 'choropleth';
	        if (visibility === 'visible') {
	            map.setLayoutProperty(layer, 'visibility', 'none');
	            $(this).html('Show Census Layer');
	            this.className = 'hide';
	        } else {
	            this.className = 'active';
	            map.setLayoutProperty(layer, 'visibility', 'visible');
	            $(this).html('Hide Census Layer');
	        }
	    });

	    map.on('mouseenter', 'choropleth', function(e) {
	        // Change the cursor style as a UI indicator.
	        map.getCanvas().style.cursor = 'pointer';

	        var coordinates = e.features[0].geometry.coordinates.slice();
	        var density = '<tr><td>Population Density (km&#178): </td><td>' + e.features[0].properties.PpltnDn + '</td></tr>';
	        var age = '<tr><td>Median Age: </td><td>' + e.features[0].properties.MedinAg + '</td></tr>';
	        var income = '<tr><td>Prevalence of low income based on the Low-income measure, after tax (LIM-AT) (%): </td><td>' + e.features[0].properties.LIM_AT + '</td></tr>';
	        var population = '<tr><td>Population: </td><td>' + e.features[0].properties.Popultn + '</td></tr>';
	        var description = '<table>' + density + age + income + population + '</table>';

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