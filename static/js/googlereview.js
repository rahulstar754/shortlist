jQuery(document).ready(function( $ ) {
  $("#google-reviews").googlePlaces({
       placeId: 'ChIJpfVyYwHiDDkRNKGKfN8HVPE' 
     , render: ['reviews']
     , min_rating:4
     , max_rows: 2
     , rotateTime: false
     , shorten_names: false
  });
});