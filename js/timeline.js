var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var scrollInterval;
function buildTimeline(){
	var pointerCoarse = window.matchMedia("(pointer: coarse)");
	var dayWidth = pointerCoarse.matches ? 20 : 9;

	var timeline = $( "<div id='timeline'></div>" ).width( 20 + dayWidth*(dateRange[1] - dateRange[0])/86400000 ),
		track = $( "<div id='track'></div>" ).css( "width", "100%" ),
		month;
	$( "#bottom" ).append( $( "<div id='timeline-container'>" ).append( timeline.append(track) ) );
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
				.append( "<div>" )
				.click( function(){ 
					gotoDay( $(this).attr("id").substr(1) );
				})
				.mouseover( showTimelineProbe )
				.mouseout( hideTimelineProbe );
		}
		track.append( dayElement );
		if ( date.getMonth() != month ){
			var m = date.getMonth();
			var str = months[m].toUpperCase();
			if ( !month || !m ) str += " " + date.getFullYear();
			month = m;
			var divider = $("<div class='timeline-divider'></div>")
				.css("left",dayElement.position().left);
			timeline.append( divider );
			var label = $( "<p class='month-label'>" + str + "</p>" )
				.css("left",dayElement.position().left)
				.css("top",25);
			timeline.append(label);
		}
	}
}

function showTimelineProbe(e){
	var date = $(this).attr("id").substr(1),
		d = new Date(parseInt(date)),
		dateString = ( d.getMonth() + 1 ) + "/" + d.getDate() + "/" + d.getFullYear(),
		day = mapData[ dateString ];
	$( "#timeline-probe" ).html( day.DATE )
		.show()
		.css( "left", Math.min( e.pageX - $( "#timeline-probe" ).width() / 2, $(window).width() - $( "#timeline-probe" ).width() - 5 ) + "px" );
}

function hideTimelineProbe(){
	$( "#timeline-probe" ).hide();
}