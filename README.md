# Choropleth Map

**This is currently in development, so detailed documentation will come later.**

This code provides a template for generating choropleth maps to visualize GeoJSON Polygon Feature/Features/Feature Collections (easy to add other types though, check the Repurpose section below).

While interacting with the map, you can modify the choropleth by adjusting the number of classes as well as by changing the classification method. The classification methods supported are equal intervals, standard deviation, arithmetic progression, geometric progression, quantile, and jenks (natural breaks). These methods were already coded in javaScript by Simogeo, source can be accessed [here](https://github.com/simogeo/geostats).

![Example of output](choropleth.gif)
**Data from Statistics Canada 2016 Census Profile Table**

## Data Prep

**To be completed**

## General Use

In general, the map has been coded to allow a user to copy a geojson polygon into `javascript/data.js`, update labels and variable names in `javascript/config.js` and then explore how the data can be represented as a choropleth.

That said, the code has been developed to easily be repurposed, read below to learn more.

## Repurpose

**To be completed**