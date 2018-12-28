var config = { 
	// configurations for map initial load
	'mapTitle': 'Montreal Census 2016 Choropleth', // title of web page (seen in browser tab)
	'mapDescription': 'This map shows some demographic variables in Montreal from the 2016 Census',
	'mapInfo': 'Select the variable to see on the map and feel free to select the classification method and the number of classes. For more information on data classifications for choropleth maps, check out <a target="_blank" href="https://www.axismaps.com/guide/data/data-classification/">The Basics of Data Classification</a>.',
	'mapInitialVar': ['Popultn','Population'], // initial variable to be visualized as a choropleth on window load, provide the variable name and the actual name
	'mapBoundsSW': [-74.4900,45.0100], // set map south-west bounds
	'mapBoundsNE': [-72.7756584,46.0500], // set map north-east bounds
	'mapInitialCenter': [-73.6354441,45.5466301], // set center of map on window load
	'mapInitialZoom': 8, // set zoom level on window load MAX is 24 (AKA very zoomed in), MIN is 0 (AKA very zoomed out, international level)
		
	// configurations for map data
	'mapClassMethod': 'jenks', // select classification method either: eqInterval, stdDeviation, arithmeticProgression, geometricProgression, quantile, jenks
    /*eqInterval: Perform an equal interval classification and return bounds into an array
    stdDeviation: Perform a standard deviation classification and return bounds into an array
    arithmeticProgression: Perform an arithmetic progression classification and return bounds into an array
    geometricProgression: Perform a geometric progression classification and return bounds into an array
    quantile: Perform a quantile classification and return bounds into an array
    jenks: Perform a Jenks classification and return bounds into an array
	To learn about the methods check out the source code: https://github.com/simogeo/geostats*/
	'mapBins': 8, // select the number of bins the data should be classified into, MIN is 2 and MAX is 11
	'mapColors': ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b', '#390037', '#2a0029', '#1c001c'], // colors for the choropleth map
	'mapVariables': ['Popultn', 'MedinAg', 'LIM_AT', 'PpltnDn'], // what the data variables names are
	'mapVariablesNames': ['Population','Median Age', 'Prevalence of Low Income based on the Low-Income Measure, After Tax (LIM-AT) (%)', 'Population Density (km&#178)'] // what the variables' names should be on the map
}