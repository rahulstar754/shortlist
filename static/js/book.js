// console.log(window.location.pathname);
var modalArtistID;

var SITE_URL = "http://127.0.0.1:8081";

$.ajax({
  url: SITE_URL+'/api' + window.location.pathname,
  success: function(data) {
      console.log(data);
      $('#portfolio').show();
      $('#hero').show();
      $('#footer').show();
      $('#love').show();
      $('#loading').hide();
      $('#button-shortlist').addClass('disabled');
      $('#button-shortlist').removeClass('btn-success').addClass('btn-light');

      $('#clientName').text('Hola, ' + data.clientName);
      $('#clientBudget').text(data.clientBudget);
      $('#clientVenue').text(data.clientVenue);
      $('#clientEvent').text(data.clientEvent);
      $('#clientCategory').text(data.clientCategory);
      $('#clientOwner').text(data.clientOwner);
      $('#clientDate').text(data.clientDate);

      var artists = data.artists;
      // console.log(artists.length);
      var html = "";
      for(var i = 0; i < artists.length; i++) {
        // console.log(artists[i].url);
        
         var fixture = $([     
          '<div class="col-sm-6 col-lg-4 col-md-6 col-xs-12">',
            '<div class="card border-muted mb-5" id="' + artists[i].artistrecordid + '" style="max-width: 18rem; margin:0 auto;">',
              '<img data-toggle="modal" data-target="#artist-modal" data-artist="' + artists[i].artistrecordid + '" class="card-img-top bg-light" src="' + artists[i].profilewp + '" alt="' + artists[i].professionalname  + '" onclick="ga(\'send\', \'event\', \'card\', \'view-image\', \'' + artists[i].id + '\');">',
              '<div data-toggle="modal" data-target="#artist-modal" data-artist="' + artists[i].artistrecordid + '" class="card-body text-secondary"  onclick="ga(\'send\', \'event\', \'card\', \'view-body\', \'' + artists[i].id + '\');">',
                '<h5 class="card-title">' + artists[i].professionalname  + '</h5>',
                '<p class="card-text">' + artists[i].city + '<span class="card-rating"><i class="fa fa-star"></i> ' + (artists[i].rating).toString().substring(0,3) + '</span></p>',
                '<p class="card-text card-category">' + artists[i].category + '</p>',
              '</div>',
              '<div class="card-footer text-center btn btn-secondary" id="butn' + artists[i].artistrecordid + '" onclick="ga(\'send\', \'event\', \'card\', \'select\',\'' + artists[i].id + '\');">',
                'SELECT',
              '</div>',
            '</div>',
          '</div>'
        ].join("\n"));

        $('#artist-container').append(fixture); 
      }
  },
  error: function (err) {
    console.log(err.statusCode);
    console.log(Object.keys(err));
    if(err.statusCode) {
      window.location.href = SITE_URL+'/404';
    }
  }
});


$('#artist-modal').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget); // Button that triggered the modal
  var artist = button.data('artist'); // Extract info from data-* attributes
  // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
  // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
  
  // console.log(" modal shown " + artist);
  var modal = $(this);
  modal.find('#modal-container').hide();
  modal.find('.modal-button-close').hide();
  modal.find('#modal-loader').show();
  
  modal.find('#modal-container').load(SITE_URL+'/api/artist/' + artist, function( response, status, xhr ) {
  if ( status == "error" ) {
    var msg = "Sorry but there was an error: ";
    
    // $( "#error" ).html( msg + xhr.status + " " + xhr.statusText );
    console.log(" modal load err ");
  }
  else {
      // console.log(" modal load complete ");
      modal.find('#modal-loader').hide();
      modal.find('#modal-container').show();
      modal.find('.modal-button-close').show();
  }
});
  // modal.find('.modal-title').text('New message to ' + artist);
});

$('#artist-modal').on('hidden.bs.modal', function (e) {
    var target = $(e.target);
    target.removeData('bs.modal')
    .find("#modal-container").html('');
});


var numSelected = $('.selected').length;
//console.log(" numSelected " + numSelected);

$( "#button-shortlist" ).click(function() {
  
    // if(numSelected == 0 )
    //   alert( "Please select some artists before shortlisting" );
  
    $('#portfolio').hide();
    $('#hero').hide();
    $('#footer').hide();
    $('#love').hide();
    $('#loading').show();
    
    ga('send', 'event', 'button', 'shortlist', (window.location.pathname).substring(1));
  
    var checkedVals = $('.selected').map(function() {
        return ($(this).attr('id'));
    }).get();
    
    var jsondata = {
      "asrid": (window.location.pathname).substring(1), 
      "artistids": checkedVals.join(",")
    };
      // console.log(jsondata);

    var settings = {
      "url": SITE_URL+"/api/shortlist",
      "method": "POST",
      "headers": {
        "content-type": "application/json",
        "cache-control": "no-cache"
      },
      "data": JSON.stringify(jsondata)
    }

    $.ajax(settings).done(function (response) {
      //console.log("data posted to shortlist api");
      //console.log(response);
      window.location.href = SITE_URL+'/thanks';
    }).fail(function() {
      alert( "There was an error. Please try shortlisting again" );
      $('#portfolio').show();
      $('#hero').show();
      $('#footer').show();
      $('#love').show();
      $('#loading').hide();
    });

});

$('body').on('click', '.card-footer', function(event) {
  //console.log("card selected " + event.target.id);
  var targetId = event.target.id;
  //add getIdb
  var getIdb = targetId.substring(4);
  event.stopPropagation();
 
  $('.card').toggleClass('selected');

    if($('.card').hasClass('selected')) {
      $(this).text('UNSELECT');
	  $('#'+targetId).text('UNSELECT')
      $('#'+targetId).removeClass('btn-secondary').addClass('btn-success');
      $('#'+getIdb).addClass('bg-success');
      $('#'+getIdb).find('.card-body').removeClass('text-secondary').addClass('text-white');

      $('#button-shortlist').removeClass('disabled');
	  
	  
	  //Add code for show message for click shortlist button		
      $("#button-shortlist").notify(		
        "Click This Shortlist Button To Confirm", 		
        { position:"top" }		
      );		

	  
      //$(this).closest('.card').find('.card-img-top').removeClass('bg-light').addClass('bg-success');
    }
    else {
	  $(this).text('SELECT');
      $('#'+targetId).text('SELECT');
      $('#'+targetId).removeClass('btn-success').addClass('btn-secondary');
      $('#'+getIdb).removeClass('bg-success');
      $('#'+getIdb).find('.card-body').removeClass('text-white').addClass('text-secondary');
		
      //$(this).closest('.card').find('.card-img-top').removeClass('bg-success').addClass('bg-light');
    }
  
    var numSelected = $('.selected').length;
    //console.log(" numSelected " + numSelected);

    if(numSelected > 0)
        $('#button-shortlist').removeClass('disabled');
    else {
        $('#button-shortlist').addClass('disabled');  
        $('#button-shortlist').removeClass('btn-success').addClass('btn-light');
    }
});


