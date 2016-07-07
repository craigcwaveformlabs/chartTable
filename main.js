
//==  API Call Module
//#   A JS module for connecting to a RESTful API
//
//

var apiCall = (function($) {

  var moduleName = 'apiCall';
  var tableData;
  var sBalance = 2000;

  //== Logging System
  function log(msg) {
    console.log(moduleName + ': ' + msg);
  }
  function warn(msg) {
    console.warn(moduleName + ': ' + msg);
  }
  function error(msg) {
    console.error(moduleName + ': ' + msg);
  }
  //--end logging


  //== API Functions
  //#  These functions are returned at the bottom of the module and are accessible from the outside the module.

  function begin() {
    log('begin module!');

    loadData(function(data){
      tableData = data;
      createChart();
      updateTable();

      // setupRefresh();
    });
  }


  //--end api functions


  //== Internal Functions
  //#  The modules internal functions, none of these are visible to the outside world.
  //
  //

  // =====
  // Helper Functions - things to help me along the way
  // =====

  var escape = function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  };

  var parsedate = function(s) {
      return new Date(s).getTime();
  };

  var bydate = function(property, i, j) {
      return new Date(i[property]).getTime() - new Date(j[property]).getTime();
  };

  var filter = function(data, regex) {
      return _.filter(data, function (doc) {
          return _.some(_.values(doc, regex), function (value) {
              return regex.test(value);
          });
      });
  };

  var randomIntFromInterval = function (min,max) {
      return Math.floor(Math.random()*(max-min+1)+min);
  };

  var randomDate = function (start, end) {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };

  // Extend the array prototype
  // SumArray - Calculate the sum of two arrays
  Array.prototype.SumArray = function(arr) {
      var sum = [];
      if (arr !== null && this.length == arr.length) {
        for (var i = 0; i < arr.length; i++) {
        sum.push(this[i] + arr[i]);
      }
    }
    return sum;
  };
  // RollingBalance - Calculate the rolling sum of two arrays
  // against a baseline starting balance value
  Array.prototype.RollingBalance = function(arr, balance) {
      var sum = [];
      if (arr !== null && this.length == arr.length) {
        for (var i = 0; i < arr.length; i++) {
        var new_balance = balance + (this[i] - arr[i]);
        sum.push(new_balance);
        balance = new_balance;
      }
    }
    return sum;
  };

  // =====
  // Bigger Things - chunckier blocks of doing.
  // =====

  // load data from ... somewhere
  function loadData (callback) {
    $.getJSON("/freeagent.json", callback);
  }

  // ===
  // testing - example of auto checking the source data
  // to see if there have been any updates.
  function setupRefresh(){
    setInterval(function(){
      loadData(function(data){
        if (JSON.stringify(data) !== JSON.stringify(tableData) ){
          tableData = data;
          console.log("The file has changed");
          updateChart();
        } else {
          console.log("The file has not changed");
        }
      });
    }, 2000);
  }

  // ===
  // create highcharts chart chart.
  function createChart() {

    var byStartDT = _.partial(bydate, "DateExpected"),
        data      = tableData.sort(byStartDT),
        dates     = _.map(_.pluck(data, "DateExpected"), parsedate),
        revenue   = _.pluck(data, "ValueRevenue"),
        cost      = _.pluck(data, "ValueCost"),
        balance   = revenue.RollingBalance(cost, sBalance),
        chart     = new Highcharts.Chart({ chart:   { renderTo: "chart", zoomType: 'xy'},
                                           credits: { enabled: false },
                                           title:   { text: "Cashflow Management" },
                                           xAxis:   { type: "datetime" },
                                           yAxis:   [
                                             { //Primary Axis
                                               min: 0,
                                               title: { text: "Amount" }
                                             },
                                             { //Secondary Axis
                                               min: 0,
                                               title: { text: "Balance" },
                                               opposite: true
                                             }

                                           ],
                                           series: [{
                                               type: "column",
                                               name: "Revenue",
                                               color: "#A1CB68",
                                               pointWidth: 10,
                                               data: _.zip(dates, revenue)
                                           }, {
                                               type: "column",
                                               name: "Cost",
                                               color: "#D34C4A",
                                               pointWidth: 10,
                                               data: _.zip(dates, cost)
                                           }, {
                                               type: "areaspline",
                                               name: "Balance",
                                               color: "#0077C4",
                                               fillOpacity: 0.2,
                                               dashStyle: 'shortdot',
                                               yAxis: 1,
                                               data: _.zip(dates, balance)
                                           }],
                                       }); // End of CHART variables
  }


  // ===
  // Add new object to data array
  $('#addJSON').on('click', function() {
    // insert a new object into the data
    //
    var amount = randomIntFromInterval(2000,10000);
    var randDate = randomDate(new Date(2016, 10, 31), new Date());
    var todayDate = new Date();

    randDate = randDate.toDateString();
    todayDate = todayDate.toDateString();

    // Randomly create a revenue or a cost
    if (randomIntFromInterval(0,1) === 1) {
      // Revenue
      tableData.push(
        {
          "Reference": "Invoice xxx",
          "DateSent":todayDate,
          "Contact": "System",
          "Project": "Automation",
          "DateDue": randDate,
          "DateExpected": randDate,
          "Status": "Due",
          "Type": "Revenue",
          "ValueRevenue": amount,
          "ValueCost": 0,
          "ValueTotal": amount
        }
      );
    }
    else {
      // Cost
      tableData.push(
        {
          "Reference": "Invoice xxx",
          "DateSent":todayDate,
          "Contact": "System",
          "Project": "Automation",
          "DateDue": randDate,
          "DateExpected": randDate,
          "Status": "Due",
          "Type": "Cost",
          "ValueRevenue": 0,
          "ValueCost": amount,
          "ValueTotal": amount
        }
      );
    }

    // update table and chart with new data
    updateTable();
    updateChart();
  });


  // ===
  // Delete object from data array
  $('#deleteJSON').on('click', function() {
    // remove the final object in the data
    var index = data.length;
    data.splice(index-1, 1);
    // update table and chart with new data
    updateTable();
    updateChart();
  });


  // ===
  // Click on row in table
  $('#table tbody').on( 'click', 'tr', function () {
      var table = $('#table').DataTable();
      if ( $(this).hasClass('selected') ) {
          $(this).removeClass('selected');
      }
      else {
          table.$('tr.selected').removeClass('selected');
          $(this).addClass('selected');
      }
      var rowSelectedIndex = table.row(this).index();
      console.log(rowSelectedIndex);
  } );

  // ===
  // Delete Selected Row
  $('#deleteRow').on('click', function() {
    // remove the final object in the data
    console.log("deleting" + rowSelectedIndex);
    // data.splice(rowSelectedIndex, 1);
    // // update table and chart with new data
    // updateTable();
    // updateChart();
  });

  // ===
  // Filter on Word Search
  $("#filter").on("keyup", function() {
      var table    = $("#table").DataTable(),
          regex    = new RegExp(escape(this.value), "i"),
          filtered = filter(tableData, regex),
          frevenue = _.pluck(filtered, "ValueRevenue"),
          fcost    = _.pluck(filtered, "ValueCost"),
          fdates   = _.map(_.pluck(filtered, "DateExpected"), parsedate);

      chart.series[0].setData(_.zip(fdates, frevenue));
      chart.series[1].setData(_.zip(fdates, fcost));
      // chart.series[2].hide();
      table.search(this.value).draw();
  });


  // --------
  // UPDATE FUNCTIONS
  // --------

  function updateTable() {
    $("#table").DataTable({
        "data": tableData,
        // fix the height of the table. display scrollbar when required.
        "scrollY": 360,
        "columns": [
            { "title": "Reference",
              "data": "Reference",
              "render": function(ref) {
                return '<a href=' + ref + '>' + ref +'</a>';
              }
            },
            { "title": "Data Sent", "data": "DateSent" },
            { "title": "Contact",
              "data": "Contact",
              "render": function(contact) {
                return '<a href=' + contact + '>' + contact +'</a>';
              }
            },
            { "title": "Project",
              "data": "Project",
              "render": function(project) {
                return '<a href=' + project + '>' + project +'</a>';
              }
            },
            { "title": "Date Due", "data": "DateDue" },
            { "title": "Expected", "data": "DateExpected" },
            { "title": "Value", "data": "ValueTotal" },
            { "title": "Type", "data": "Type" },
            { "title": "Status", "data": "Status" }
        ],
        "bDestroy" : true,
        "iDisplayLength": 25,
        "language": {
            "decimal": ",",
            "thousands": "."
        }

    });
    // Add the default display class to the table.
    var element = document.getElementById("table");
    element.classList.add("display");
  }


  function updateChart() {
    // Get the table reference and extract the data.
    // Sort and pluck based on plotting options.

    // var table     = $("#table").DataTable(),
    //     data      = table
    //                .rows()
    //                .data(),
    var byStartDT = _.partial(bydate, "DateExpected"),
        data      = tableData.sort(byStartDT),
        dates     = _.map(_.pluck(data, "DateExpected"), parsedate),
        revenue   = _.pluck(data, "ValueRevenue"),
        cost      = _.pluck(data, "ValueCost"),
        balance   = revenue.RollingBalance(cost, sBalance);

    // Set the data of the existing chart
    chart.series[0].setData(_.zip(dates, revenue));
    chart.series[1].setData(_.zip(dates, cost));
    chart.series[2].setData(_.zip(dates, balance));

    // Find and Set Min Axis if negative values
    var ex = chart.yAxis[1].getExtremes();
    // Sets the min value for the chart
    var minVal = 0;
    if (ex.dataMin < 0) {
      minVal = ex.dataMin;
      chart.series[2].options.color = ('#D34C4A');
      chart.series[2].update(chart.series[2].options);
      //set the min and return the values
    }
    else {
      chart.series[2].options.color = ('#0077C4');
      chart.series[2].update(chart.series[2].options);
    }
    chart.yAxis[1].setExtremes(minVal, null, true, false);
    chart.yAxis[0].setExtremes(minVal, null, true, false);

  }


  //--end internal


  //== API
  //#  Our accessible functions, call these from other files to interact with the module.
  return {
    begin: begin
  };

})(jQuery);




//==  UpdateTable Module
//#   Apply updates to the table.

var updateTable = (function($) {

  var moduleName = 'updateTable';

  //== API Functions
  //#  These functions are returned at the bottom of the module and are accessible from the outside the module.


  //--end api functions

  //== Internal Functions
  //#  The modules internal functions, none of these are visible to the outside world.
  //
  //

  //--end internal


  //== API
  //#  Our accessible functions, call these from other files to interact with the module.
  return {

  };

})(jQuery);


//==  updateChart Module
//#   Apply updates to the chart.

var updateChart = (function($) {

  var moduleName = 'updateChart';

  //== API Functions
  //#  These functions are returned at the bottom of the module and are accessible from the outside the module.


  //--end api functions

  //== Internal Functions
  //#  The modules internal functions, none of these are visible to the outside world.
  //
  //

  //--end internal


  //== API
  //#  Our accessible functions, call these from other files to interact with the module.
  return {

  };

})(jQuery);







//================================================================================================================


//== Document Ready
//#  Our jumping off point for our modules
$(document).ready(function() {

  //== API Call JS Module
  apiCall.begin();

});
