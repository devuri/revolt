var icons = {
	Militia: "images/militia.png",
	Maroons: "images/maroons.png",
	Navy: "images/navy.png",
	Army: "images/regulars.png",
	Rebels: "images/rebels.png",
}

var colors = {
	Militia: "#2e4d0a",
	Maroons: "#5b2a5c",
	Navy: "#2c2e5d",
	Army: "#735619",
	Rebels: "#7d312c",
}

$(document).ready( initialize );

var jsonUrl = "data/json/revolt.json";

var map,
	mapLayers,
	markers;
	
var mapData,
	dateRange = [Infinity,-Infinity],
	currentDay,
	currentStep,
	playTimer;
	
var playing = false;

function initialize() {
	setupMap
	loadMapData();
	setupUIEvents();
	resize();	
}

function setupMap(){
	map = L.map('map').setView([18.188, -77.363], 10);
	L.tileLayer('data/tiles/placenames/{z}/{x}/{y}.png', {maxZoom: 12, minZoom: 7} ).addTo(map);
	mapLayers = L.layerGroup().addTo(map);
}

function resize() {
	$( "#map" ).height( $(window).height() - $( "#bottom" ).height() );
	$( "#text" ).height( $(window).height() - $( "#controls" ).height() - $( "#date" ).height() );
}

function setupUIEvents(){
	$( "#play" ).click( function(){ 
		playing = true;
		if ( !currentDay) gotoDay( $(".timeline-event").eq(0).attr("id").substr(1) );
		else nextStep();
	});
	
	$( "#stop" ).click( function(){ 
		playing = false;
		clearTimeout( playTimer );
	});
	
	$( "#next" ).click( function(){ 
		clearTimeout( playTimer );
		if ( !currentDay) gotoDay( $(".timeline-event").eq(0).attr("id").substr(1) );
		else if ( !currentDay.STEPS) nextDay();
		else nextStep();
	});
}

function loadMapData() {
	$.getJSON( jsonUrl, function(data){
		mapData = data;
		for ( var i in mapData ){
			if ( Date.parse( i ) < dateRange[0] ) dateRange[0] = Date.parse( i );
			if ( Date.parse( i ) > dateRange[1] ) dateRange[1] = Date.parse( i );
		}
		buildTimeline();
	});
}

function buildTimeline(){
	var timeline = $( "<div id='timeline'></div>" ).width( 10 + 9*(dateRange[1] - dateRange[0])/86400000 );
	for ( var i = dateRange[0]; i <= dateRange[1]; i += 86400000 ){
		var date = new Date(i),
			dateString = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
		var dayElement = $( "<div/>" )
						.addClass( "timeline-day" )
						.attr( "id" , "t" + i );
		if ( mapData[ dateString ] ){
			mapData[ dateString ].ms = i;
			dayElement
				.addClass( "timeline-event" )
				.click( function(){ 
					gotoDay( $(this).attr("id").substr(1) );
				});
		}
		timeline.append( dayElement );
	}
	$( "#bottom" ).append( timeline );
}

function gotoDay( date ){
	$( ".timeline-event.selected" ).removeClass( "selected" );
	$( "#t" + date ).addClass( "selected" )
	var d = new Date(parseInt(date)),
		dateString = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear();
	console.log("Date",dateString);
	currentDay = mapData[ dateString ];
	currentStep = -1;
	markers = {};
		
	mapLayers.clearLayers();
	
	$( "#text" ).html( currentDay.TEXT );
	var b = getDayBounds( currentDay );
	if ( b && auto_pan( b ) ) {
		playTimer = setTimeout( nextStep, 2500 );
	} else {
		nextStep();
	}
}

function nextDay(){
	var index = $( "#t" + currentDay.ms ).index( ".timeline-event" ),
		next = $( ".timeline-event" ).eq( index + 1 );
	if ( next ) next.trigger("click");
}

function nextStep(){
	currentStep++;
	console.log( "Step", currentStep );
	
	if ( !currentDay.STEPS ){
		if ( playing ) playTimer = setTimeout( nextDay, 3000 );
		return;
	} else if ( !currentDay.STEPS[ currentStep ] ) {
		nextDay();
		return;
	}
	
	var step = currentDay.STEPS[ currentStep ],
		marker;
		
	if ( step.LOC.length > 1 ){
		console.log("animated");

		marker = L.animatedMarker( [ L.latLng( step.LOC[0].LAT, step.LOC[0].LON ), L.latLng( step.LOC[1].LAT, step.LOC[1].LON ) ], {
			icon: L.icon( { iconUrl: icons[ step.TYPE ] || icons.Rebels, iconSize: [16,16] } ),
			onEnd: function(){
				marker.bindPopup( getPopupContent(step) );
				if ( step.VALUE ){
					marker.openPopup();
				}
				if ( playing ) playTimer = setTimeout( nextStep, 3000 );
			},
			interval: 10
		} );
		
		if ( markers[ step.ID ] && map.hasLayer( markers[ step.ID ] ) )
			mapLayers.removeLayer( markers[ step.ID ] );
			
		markers[ step.ID ] = marker;
		mapLayers.addLayer(marker);
	
		var poly = L.animatedLine( [ L.latLng( step.LOC[0].LAT, step.LOC[0].LON ), L.latLng( step.LOC[1].LAT, step.LOC[1].LON ) ], {
			color: colors[ step.TYPE ] || colors.Rebels,
			weight: 15
		} )
		mapLayers.addLayer(poly);
	} else {
		console.log("static");
		
		marker = L.marker( L.latLng( step.LOC[0].LAT, step.LOC[0].LON ), {
			icon: L.icon( { iconUrl: icons[ step.TYPE ] || icons.Rebels, iconSize: [16,16] } )
		} );
		
		if ( markers[ step.ID ] && map.hasLayer( markers[ step.ID ] ) )
			mapLayers.removeLayer( markers[ step.ID ] );
			
		mapLayers.addLayer( marker );
		marker.bindPopup( getPopupContent(step) );
		if ( step.VALUE ){
			marker.openPopup();
		}
		if ( playing ) playTimer = setTimeout( nextStep, 3000 );
	}
}

function getPopupContent( step ){
	var div = $( "<div class='popup-name'>" );
	div.append( "<p>" + step.NAME + "</p>" );
	if ( step.VALUE ){
		var val = Math.max( 1, Math.round(step.VALUE / 100) ),
			dudes = $( "<div class='dudes'/>" );
		for ( var i = 0; i < val; i ++ ){
			dudes.append( "<div class='dude'/>" );
		}
		div.append( dudes );
	}
	return div[0].outerHTML;
}

function getDayBounds( day ){
	var steps = day.STEPS;
	if ( !steps ) return null;
	var latlngs = [];
	for ( var i = 0; i < steps.length; i++ ){
		for ( var n = 0; n < steps[i].LOC.length; n++ ){
			latlngs.push( L.latLng(steps[i].LOC[n].LAT,steps[i].LOC[n].LON) );
		}
	}
	return L.latLngBounds( latlngs );
}

function auto_pan( bounds ){
	if( !map.getBounds().intersects( bounds ) && map.getZoom() > 10 ){
		map.fitBounds( L.latLngBounds( L.latLng(17.644, -78.409), L.latLng(18.589, -76.190) ) );
		window.setTimeout( function(){ map.fitBounds( bounds ) }, 1500 );
		return true;
	} else {
		map.fitBounds( bounds );
	}
}