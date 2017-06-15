var london = {

  // configuration

  origin      : 'Abbey Road',
  rawdata     : '',
  stations    : {},
  stops       : 0,
  tube        : function (){

    const {origin, stations, stops} = london; // default origin, tree, initialize the stops

    let {rawdata}   = london, // rawdata from csvToObject
    routes          = [],     // store stations inbound and outbound
    scheck          = [],     // store unique stations to compare to
    orderedStations = {}      // sorted stations for select options
    ;

    if(Object.keys(stations).length === 0){

      // need to change keys to remove spaces in the Station From and Station To

      let newkeys = JSON.stringify(rawdata);              // simple way to do this
      newkeys = newkeys.replace(/Tube Line/g,    'line'); // cleaner to access
      newkeys = newkeys.replace(/From Station/g, 'from'); // cleaner to access
      newkeys = newkeys.replace(/To Station/g,   'to');   // cleaner to access

      // re-instantiate the array

      rawdata = JSON.parse(newkeys);

      // loop through the array to create an object tree with array nodes, this makes accessing easier;

      rawdata.forEach((station) => {

        // start with the outbound stations

        if(station.to != origin){ // kick out the origin to keep it clean

          if(stations[station.from] && stations[station.from].indexOf(station.to) === -1){ // exists and no dupes

            stations[station.from].push(station.to);

          } else {

            stations[station.from]=[station.to];

          }

        }

        // merge the inbound stations

        if(station.from != origin){

          if(stations[station.to] && stations[station.to].indexOf(station.from) === -1){

            stations[station.to].push(station.from);

          } else {

            stations[station.to]=[station.from];

          }

        }

      });

      // set property for later access
      london.stations = stations;

      Object.keys(stations).sort().forEach((key) => {
        orderedStations[key] = stations[key];
      });

      for(var key in orderedStations){
        $('#select_origin').append(`<option>${key}</option>`);
      }

    }

    // initiate the routes

    this.getRoutes = () => {

      // reset arrays when we invoke this function

      routes = [];
      scheck = [];

      // input should not surpass the amount of stations

      if(stops > Object.keys(stations).length){
        return;
      }

      // set inital route base off the origin

      routes = stations[origin]; // be sure to reduce user input by 1 since this is the first route

      // start over

      this.getStations(0,[]);

      // sort the route in alphabetical order

      routes.sort();

      // set the stations, UI tasks

      this.setStations();

    };

    // use a diff function to create a unique array

    this.diff = (a1, a2) => {

      return a1.concat(a2).filter(function(val, index, arr){ // merge and filter the arrays

        return arr.indexOf(val) === arr.lastIndexOf(val); // comapre and return

      });

    };

    // recursively iterate over tree to build array of stations

    this.getStations = (n, route) => {

      if(n < stops - 1){ // -1 to account for first route already set

        routes.forEach((station) => {

          route.push(stations[station]);
          scheck.push(station);

        });

        // flatten the array, diff the routes and create new unique array

        routes = this.diff([].concat.apply([], route), scheck);

        // increment

        n = n + 1;

        // recurse

        this.getStations(n,[]);

      }

    };

    // update the UI

    this.setStations = () => {

      $("#all_stops, #stops_info").empty();

      if(stops > 0){

        $("#stops_info").text(`Found ${routes.length} stops. Happy tubing!`);

        routes.forEach((station) => {

          $("#all_stops")
          .append(
            `<a
            href="https://www.doogal.co.uk/StationMap.php?station=${station}"
            class="list-group-item" target="_blank"
            data-toggle="tooltip"
            data-placement="top"
            data-delay="300"
            title="Open Map"
            >
            ${station}
            <span class="pull-right glyphicon glyphicon-chevron-right"></span>
            </a>`
          );

        });

      }

      // set up the tooltips

      $('[data-toggle="tooltip"]').tooltip();

    };

  }

}

// use jQuery to pull the data directly from the .csv file

$(document).ready(function() {

  // load the data file

  $.ajax({

    type: "GET",

    url: "data/London tube lines.csv", // csv file

    dataType: "text",

    success: function(data){

      london.rawdata = $.csv.toObjects(data);    // jquery.csv.min.js

      // set london tube

      new london.tube();

    }

  });

});

// process the user input, this will fire on keyup, set onkeyup in the html file for cleanliness

function processInput(event){

  london.stops = event.target.value;

  const tube = new london.tube();

  // gives user time to enter larger integers before firing

  setTimeout(function(){

    event.target.select();

    tube.getRoutes();

  },500);

};

function updateOrigin(event){

  const origin = event.target.value;

  london.origin = origin;

  new london.tube().getRoutes();

  // update UI

  $(".origin").text(origin);

  $("#input_stops").select();

}
