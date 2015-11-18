/*
 * Ref: http://jsfiddle.net/jonataswalker/jbks778d/
 * Ref: http://gis.stackexchange.com/questions/5821/calculating-lat-lng-x-miles-from-point
 */

var gis = {
		
  getBBOX: function(lon,lat, boxsize){	// e.g., create box of 12x12km, distance = 12000 meter
	  var
	  bearing_topright = 45,
	  bearing_bottomright = 135,
	  bearing_bottomleft = 225,
	  bearing_toplef = 315,
	  bearing = [45, 135, 225, 315],	// [topright, bottomright, bottomeleft, topleft]
	  distance = Math.sqrt(Math.pow(boxsize, 2) + Math.pow(boxsize, 2))/2;	//distance from the point to each coner
	  
	  var 
      radius = 6371e3, // meters
      delta = Number(distance) / radius, // angular distance in radians
      lat1 = gis.toRad(lat),
      lng1 = gis.toRad(lon);
	  
	  var bbox_coord = [];
	  for(var i = 0; i < bearing.length; i++){
		  theta = gis.toRad(Number(bearing[i]));
		  var lat2 = Math.asin(Math.sin(lat1)*Math.cos(delta) + 
			      Math.cos(lat1)*Math.sin(delta)*Math.cos(theta));
			    
		  var lng2 = lng1 + Math.atan2(Math.sin(theta) * Math.sin(delta)*Math.cos(lat1),
		      Math.cos(delta)-Math.sin(lat1)*Math.sin(lat2));
		  // normalise to -180..+180°
		  lng2 = (lng2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; 
		  bbox_coord[i] = [gis.toDeg(lng2), gis.toDeg(lat2)];
	  }
	  
    return bbox_coord;
		  
  },
  
  /**
  * All coordinates expected EPSG:4326
  * @param {Array} start Expected [lon, lat]
  * @param {Array} end Expected [lon, lat]
  * @return {number} Distance - meter.
  */
  calculateDistance: function(start, end) {
    var lat1 = parseFloat(start[1]),
        lon1 = parseFloat(start[0]),
        lat2 = parseFloat(end[1]),
        lon2 = parseFloat(end[0]);

    return gis.sphericalCosinus(lat1, lon1, lat2, lon2);
  },

  /**
  * All coordinates expected EPSG:4326
  * @param {number} lat1 Start Latitude
  * @param {number} lon1 Start Longitude
  * @param {number} lat2 End Latitude
  * @param {number} lon2 End Longitude
  * @return {number} Distance - meters.
  */
  sphericalCosinus: function(lat1, lon1, lat2, lon2) {
    var radius = 6371e3; // meters
    var dLon = gis.toRad(lon2 - lon1),
        lat1 = gis.toRad(lat1),
        lat2 = gis.toRad(lat2),
        distance = Math.acos(Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)) * radius;
    
    return distance;
  },

  /**
  * @param {Array} coord Expected [lon, lat] EPSG:4326
  * @param {number} bearing Bearing in degrees
  * @param {number} distance Distance in meters
  * @return {Array} Lon-lat coordinate.
  */
  createCoord: function(coord, bearing, distance) {
    /** http://www.movable-type.co.uk/scripts/latlong.html
    * lat is latitude, lng is longitude, 
    * theta is the bearing (clockwise from north), 
    * delta is the angular distance d/R; 
    * d being the distance travelled, R the earth’s radius*
    **/
    var 
      radius = 6371e3, // meters
      delta = Number(distance) / radius, // angular distance in radians
      theta = gis.toRad(Number(bearing));
      lat1 = gis.toRad(coord[1]),
      lng1 = gis.toRad(coord[0]);
    
    var lat2 = Math.asin(Math.sin(lat1)*Math.cos(delta) + 
      Math.cos(lat1)*Math.sin(delta)*Math.cos(theta));
    
    var lng2 = lng1 + Math.atan2(Math.sin(theta) * Math.sin(delta)*Math.cos(lat1),
      Math.cos(delta)-Math.sin(lat1)*Math.sin(lat2));
    // normalise to -180..+180°
    lng2 = (lng2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; 
    
    return [gis.toDeg(lng2), gis.toDeg(lat2)];
  },
  /**
   * All coordinates expected EPSG:4326
   * @param {Array} start Expected [lon, lat]
   * @param {Array} end Expected [lon, lat]
   * @return {number} Bearing in degrees.
   */
  getBearing: function(start, end){
    var
      startLat = gis.toRad(start[1]),
      startLong = gis.toRad(start[0]),
      endLat = gis.toRad(end[1]),
      endLong = gis.toRad(end[0]),
      dLong = endLong - startLong;
    
    var dPhi = Math.log(Math.tan(endLat/2.0 + Math.PI/4.0) / 
      Math.tan(startLat/2.0 + Math.PI/4.0));
    
    if (Math.abs(dLong) > Math.PI) {
      dLong = (dLong > 0.0) ? -(2.0 * Math.PI - dLong) : (2.0 * Math.PI + dLong);
    }
    
    return (gis.toDeg(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  },
  toDeg: function(n) { return n * 180 / Math.PI; },
  toRad: function(n) { return n * Math.PI / 180; }
};

var start = [15, 38.70250];
var end = [21.54967, 38.70250];
var total_distance = gis.calculateDistance(start, end); // meters
var percent = 10;
var distance = (percent / 100) * total_distance;

function move(){
    var icon_coord = ol.proj.transform(
        featureIcon.getGeometry().getCoordinates(),
        'EPSG:3857', 'EPSG:4326'
    );
    
    var bearing = gis.getBearing(start, end);
	var coord = gis.createCoord(icon_coord, bearing, distance);
    console.info(coord);
    
    featureIcon.getGeometry().setCoordinates(
    	ol.proj.fromLonLat(coord)
    );
}

/*
var style_marker = new ol.style.Style({
  image: new ol.style.Circle({
    stroke: new ol.style.Stroke({ color: 'white', width: 2 }),
    fill: new ol.style.Fill({ color: 'black' }),
    radius: 7
  })
});
var style_marker_icon = new ol.style.Style({
  image: new ol.style.Icon({
    scale: .7, opacity: 1,
    rotateWithView: false, anchor: [0.5, 1],
    anchorXUnits: 'fraction', anchorYUnits: 'fraction',
    src: '//cdn.rawgit.com/jonataswalker/map-utils/' +                       'master/images/marker.png'
  })
});
var style_line = new ol.style.Style({
  stroke: new ol.style.Stroke({
    width: 6, color: '#eee',
    lineDash: [4, 10]
  })
});

var featureA = new ol.Feature(
  new ol.geom.Point(ol.proj.fromLonLat(start))
);
featureA.setStyle(style_marker);

var featureB = new ol.Feature(
  new ol.geom.Point(ol.proj.fromLonLat(end))
);
featureB.setStyle(style_marker);

var line = new ol.Feature(
  new ol.geom.LineString([
  	ol.proj.fromLonLat(start), ol.proj.fromLonLat(end)
  ])
);
line.setStyle(style_line);

var featureIcon = new ol.Feature(
  new ol.geom.Point(ol.proj.fromLonLat(start))
);
featureIcon.setStyle(style_marker_icon);

var vectorSource = new ol.source.Vector({
	features: [featureA, featureB, line, featureIcon]
});
var vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.MapQuest({layer: 'sat'})
        }),
        vectorLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([21.54967, 38.70250]),
        zoom: 4
    })
});
*/