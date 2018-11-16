// server.js
var express = require('express');
const axios = require('axios');
var Airtable = require('airtable');
var bodyParser = require('body-parser');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://book.starclinch.com");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.static('static'))

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

var server = app.listen(process.env.PORT, function(){
  console.log('Listening on port ' + server.address().port);
});
module.exports = app;

var dealID = "";
var deal = "";
let artistIDS = [];
let artists = [];

let fields = ["artistrecordid", "id", "professionalname", "city", "category", "subcategory", "gender", 
              "url", "thumbnail", "updated", "subscription", "tagline", "social", "about",
             "images", "videos", "audios", "coverimage", "performingmembers", "offstageteammembers",
             "travel", "performanceduration", "rating"];
let options = {
						view: "TestView",
		    			fields,
		    		}
let conditions = [];
let filterByFormula = "";

const categories = {1:"Anchor/Emcee",
                    2:"Celebrity",
                    3: "Comedian", 
                    4:"Dancer/Troupe",
                    5:"DJ",
                    6:"Instrumentalist",
                    7:"Live Band",
                    8:"Magician",
                    9:"Make-up Artist",
                    10:"Model",
                    11:"Photo/Videographer",
                    12:"Singer",
                    13:"Speaker",
                    14:"Variety Artist"
                   };

const events = {15:"Campus",
               16:"Charity",
               18:"Corporate",
               19:"Exhibition",
               20:"Fashion Show",
               21:"Inauguration",
               22:"Kids Party",
               23:"Photo/Video Shoot",
               24:"Private Party",
               25:"Professional Hiring",
               26:"Religious",
               27:"Restaurant",
               28:"Wedding",
               17:"Concert/Festival"};


app.get("/", nocache, function (request, response, next) {
  response.sendFile(__dirname + '/views/test.html');
});

app.get("/book", nocache, function (request, response, next) {
  response.sendFile(__dirname + '/views/booking.html');
});

app.get("/thanks", nocache, function (request, response, next) {
  response.sendFile(__dirname + '/views/thanks.html');
});

app.get("/404", nocache, function (request, response, next) {
  response.sendFile(__dirname + '/views/404.html');
});

app.get("/:pitch", nocache, function (request, response, next) {
  response.sendFile(__dirname + '/views/index.html');
});

var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_APP_ID );

app.get('/api/:pitch', nocache, function(req, res, next) {
  // https://fantasy-nerve.glitch.me/api/receIPryqRkaxHFcY 
  //https://fantasy-nerve.glitch.me/recNMT0pUHma8jkne
  
  artists = [];
  artistIDS = [];
  conditions = [];

  base('ArtistSuggest').find(req.params.pitch, function(err, record) {
      if (err) { 
        console.error(err); 
        res.sendStatus(404);
        return; 
      }
      // console.log(record.fields.dealid);
      // console.log(record.fields.artists);
      dealID = record.fields.dealid;
      artistIDS = record.fields.artists;
      
      axios.get('https://api.pipedrive.com/v1/deals/' + dealID + '?api_token=' + process.env.PIPEDRIVE_API_KEY)
      .then(response => {
        // console.log("Resp Pipedrive");
        // console.log(response.data);
        
        deal = response.data.data;  
        
        for(let i = 0; i< artistIDS.length; i++) {
          conditions.push(`RECORD_ID()="${artistIDS[i]}"`)
        }

        if(conditions.length){
          if(conditions.length === 1){
            filterByFormula = conditions[0];
          }else{
            filterByFormula = `OR(${conditions.join()})`;
          }
        }
        // console.log(filterByFormula);
        options.filterByFormula = filterByFormula;

        base('Artists').select(options).eachPage(function page(records, fetchNextPage) {
              records.forEach(function(record) {
                  // console.log(record.get('professionalname'));
                  artists.push(record['fields']);
              });
              fetchNextPage();

          }, function done(err) {
              if (err) { 
                console.error(err); 
                // res.sendStatus(404);
                res.redirect(404, '/404');
                return; 
              }
          
              let cats = deal['61a501536a4065f5a970be5c6de536cf7ad14078'].split(',');
              var catsStr = "";

              for(var i = 0; i < cats.length; i++) {
                if(cats.length == 1 || i == (cats.length-1)) {
                    catsStr += categories[cats[i]] + 's';  
                }
                else {
                    catsStr += categories[cats[i]] + 's, ';
                }
              }
              // console.log(cats);
              // console.log(catsStr);
          
              let finalResponse = {
                clientName:  deal.person_id.name,
                clientEmail: deal.person_id.email.value,
                clientPhone: deal.person_id.phone.value,
                clientBudget: deal.formatted_value,
                clientVenue: deal['361085abd375a7eb3964f068295f12fe17d9f280_formatted_address'],
                clientOwner: deal.owner_name,
                clientDate: deal['19c2c12d8fea52c4709cd4ce256b7852bc2b0259'],
                // clientCategory: categories[deal['61a501536a4065f5a970be5c6de536cf7ad14078']],
                clientCategory: catsStr,
                clientEvent: events[deal['755ded0be98b3ee5157cf117566f0443bd93cc63']],
                
                artists: artists
              };
              res.send(finalResponse);

          });
        })
        .catch(error => {
          console.log(error);
          res.sendStatus(404);
        });
  });
});

app.post("/api/shortlist", function (request, response, next) {
  // console.log("shortlist");

  // console.log(request.body.artistids);
  // console.log(request.body.asrid);
  var artistids = (request.body.artistids).split(',');
  var artistsuggestrecid = request.body.asrid;
  // console.log(artistids);

  let axiosConfig = {
      headers: {
          'cache-control': 'no-cache',
           'x-apikey': process.env.RESTDB_API_KEY,
           'content-type': 'application/json'
      }
    };
  
  var jsondata = {
      "dealid": dealID, 
      "artistsuggestrecid": artistsuggestrecid,
      // "artistids": JSON.stringify(artistids)
      "artistids": JSON.stringify(artistids)
    };
  // console.log(jsondata);

  axios.post(process.env.RESTDB_API_URL, 
             jsondata,
             axiosConfig
            )
  .then(function(responseDB){
    // console.log('restdb post saved successfully')
    
    response.redirect(200, '/thanks');

  }).catch(error=>{
    console.log(error)
    response.sendStatus(404);
  }); 
  
});


function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  
    // var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    // var match = url.match(regExp);
    // if (match && match[2].length == 11) {
    //   return match[2];
    // } else {
    //   return;
    // }
}


app.get("/api/artist/:artistrecordid", function (request, response, next) {

  base('Artists').find(request.params.artistrecordid, function(err, record) {
      if (err) { 
        console.error(err); 
        response.sendStatus(404);
        return; 
      }
      // console.log(record.fields.dealid);
  
      var fixtureModalHeader = [
        '<div class="row">',
          '<div class="col-lg-12 mx-auto">',
            '<img class="d-block w-100 mb-5" src="' + record.fields.coverimage + '">',
            '<h2 id="artistName" class="text-secondary text-uppercase mb-0">' + record.fields.professionalname + '</h2>',
            '<hr class="star-dark mb-5">',
            '<img id="artistImage" class="img-fluid mb-3" src="https://fly.starcdn.net' + record.fields.thumbnail + '" alt="">',
            '<p class="text-aqua text-large mb-2"><i class="fa fa-star"></i> ' + record.fields.rating + '</p>',
            '<p class="mb-2 text-aqua">' + record.fields.city + ' | Does shows ' + record.fields.travel + '</p>',
            '<p id="artist-subcategory" class="mb-5">Does ' + record.fields.subcategory + ' types of shows</p>',
            '<p id="artist-tagline" class="mb-5 text-large">' + record.fields.tagline + '</p>'
      ];
      
    
      //
      //
      // Add Videos
      //
      //
      if(record.fields.videos) {
        // console.log(record.fields.videos);
        var artistVideosArrray = (record.fields.videos).split(',');
        for(var p=0; p< artistVideosArrray.length; p++){
           // console.log(artistVideosArrray[p]);
            var fixtureModalYoutubeVideo; 

            if(artistVideosArrray[p].includes('youtu')) {

              fixtureModalYoutubeVideo = [
                '<iframe class="youtube" height="315" src="https://www.youtube.com/embed/' + youtube_parser((artistVideosArrray[p]).trim())  + '">',
                '</iframe><br/><br/>'
              ];

              // console.log(youtube_parser((artistVideosArrray[p]).trim()) );

              fixtureModalHeader = fixtureModalHeader.concat(fixtureModalYoutubeVideo);
            }
            else if(artistVideosArrray[p].includes('facebook')) {
                
                fixtureModalYoutubeVideo = [
                  '<iframe class="facebook-responsive" height="315"',
                    'src="https://www.facebook.com/plugins/video.php?href=' + (artistVideosArrray[p]).trim() + '"',
                    'style="border:none;overflow:hidden" ',
                    'scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="false">',
                  '</iframe><br/><br/>'
                ];
                // console.log((artistVideosArrray[p]).trim());
                fixtureModalHeader = fixtureModalHeader.concat(fixtureModalYoutubeVideo);
            }                      
          }
      }
    
      //
      //
      // Add Audios
      //
      //
    
      if(record.fields.audios) {
        var artistAudioArrray = (record.fields.audios).split(',');      

        for(var p=0; p< artistAudioArrray.length; p++){
            console.log(artistAudioArrray[p]);
          var fixtureModalAudio;
            // if(artistAudioArrray[p].includes('soundcloud')) {
              fixtureModalAudio = [
                '<iframe class="artist-audio" width="100%"',
                'src="' + (artistAudioArrray[p]).trim() + '">',
                '</iframe><br/><br/>'
              ];
              fixtureModalHeader = fixtureModalHeader.concat(fixtureModalAudio);
            // }
        }

      }
    
    
      
      //
      //
      // Add Pics
      //
      //
      if(record.fields.images) {
        var fixtureModalCarouselHeader = [
          '<div class="carousel slide mb-5" data-ride="carousel" id="images' + record.fields.artistrecordid + '">',
                '<div class="carousel-inner">'
        ];

        fixtureModalHeader = fixtureModalHeader.concat(fixtureModalCarouselHeader);

        var artistImgsArrray = (record.fields.images).split(',');
        artistImgsArrray.shift();

        for(var p=0; p< artistImgsArrray.length; p++){
         // console.log(artistImgsArrray[p]);
          var fixtureModalCarouselImages;
          if(p == 0) {
               fixtureModalCarouselImages = [
              '<div class="carousel-item active artistCarouselImg">',
                    '<img class="d-block w-100" src="' + (artistImgsArrray[p]).trim() + '">',
                  '</div>'
            ];
          }
          else {
             fixtureModalCarouselImages = [
              '    <div class="carousel-item artistCarouselImg">',
              '      <img class="d-block w-100" src="' + (artistImgsArrray[p]).trim() + '">',
              '    </div>'
            ];
          }
          fixtureModalHeader = fixtureModalHeader.concat(fixtureModalCarouselImages);

        }

        //
        //
        // Add Footer
        //
        //
        
        var fixtureModalCarouselControls = [
                '<a class="carousel-control-prev" href="#images' + record.fields.artistrecordid + '" role="button" data-slide="prev">',
                  '<span class="carousel-control-prev-icon" aria-hidden="true"></span>',
                  '<span class="sr-only">Previous</span>',
                '</a>',
                '<a class="carousel-control-next" href="#images' + record.fields.artistrecordid + '" role="button" data-slide="next">',
                  '<span class="carousel-control-next-icon" aria-hidden="true"></span>',
                  '<span class="sr-only">Next</span>',
                '</a>',
              '</div></div>'
        ];

        fixtureModalHeader = fixtureModalHeader.concat(fixtureModalCarouselControls);
      }
    
      
      var fixtureModalFooter = [
            '<h5 class="text-secondary text-uppercase mb-4">Performing Members: <span class="text-aqua">' + (record.fields.performingmembers >= 0 ? 1 : record.fields.performingmembers) + '</span></h5>',
            '<h5 class="text-secondary text-uppercase mb-4">Offstage Members: <span class="text-aqua">' + record.fields.offstageteammembers + '</span></h5>',
            '<h5 class="text-secondary text-uppercase mb-5"> </h5>',
            '<h4 class="text-secondary text-uppercase mb-3">About ' + record.fields.professionalname + '</h4>',
            '<div id="summary" class="mb-5">',
              '<p class="collapse text-justify" id="collapseSummary">',
                '' + record.fields.about + '',
              '</p>',
              '<a class="collapsed" data-toggle="collapse" href="#collapseSummary" aria-expanded="false" aria-controls="collapseSummary"></a>',
            '</div>',
          '</div>',
        '</div>'
      ];

      fixtureModalHeader = fixtureModalHeader.concat(fixtureModalFooter);

      response.send(fixtureModalHeader.join("\n"));    
  });
  
});


// TODO: PUT to Pipedrive
// app.get("/api/track", function (request, response, next) {
//   console.log("email opened");
//   console.log(request.params);
//   response.sendStatus(200);
// });
