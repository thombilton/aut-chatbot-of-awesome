'use strict';
var mongoose = require('mongoose');
// var paperInfo = mongoose.model('paperInfo');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://ping:ping@ds117070.mlab.com:17070/chatbot"

module.exports.processRequest = function (req, res) {
    if (req.body.queryResult.action == "getPaper") {
        getPaper(req, res);
    }
    else if (req.body.queryResult.action == "getMajorPaper") {
        getMajorPaper(req, res)
    } else if (req.body.queryResult.action == "preReq") {
        preReq(req, res);
    } else if (req.body.queryResult.action == "coReq") {
        coReq(req, res);
      } else if (req.body.queryResult.action == "semester") {
        semester(req,res);
      }
}


exports.helloWorld = function () {
    return "hello world";
}

function preReq(req, res) {
    let paperToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.allPapers ? req.body.queryResult.parameters.allPapers : 'Unknown';

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("chatbot");
        dbo.collection("papers").find({ _id: paperToSearch }).toArray(function (err, result) {
            if (err) throw err;
            // console.log(result);

            if (result.length != 0) {

                if (result[0]._id == paperToSearch) {

                    var name = result[0]._id + ", " + result[0].paperName;

                    // If there prerequisite value is NOT empty
                    if (result[0].preReq) {
                        var output = "The pre-requisite(s) for " + name + " are " + result[0].preReq + ".";

                        return res.json({
                            'fulfillmentText': output,
                        });
                    } else {
                        var output = name + " does not have any pre-requisites.";
                        return res.json({
                            'fulfillmentText': output,
                        });
                    }

                }
            }
            else {
                return res.json({
                    'fulfillmentText': "That is not a paper that we offer.",
                });
            }

            db.close();
        });
    });

}

function getMajorPaper(req, res) {
    let majorToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.allMajors ? req.body.queryResult.parameters.allMajors : "Unknown";

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("chatbot");
        dbo.collection("papers").find({ major: majorToSearch }).toArray(function (err, result) {
            if (err) throw err;
            console.log(result);
            // needs to loop through all results and list all paper names
            if (result.length != 0) {
                var count = 0;
                var num = 0;
                var final = "";
                while (count < result.length) {
                    if (result[count].major == majorToSearch) {
                        num++;
                        if (num == 1) {
                            final = "The papers required for that major are: " + result[count]._id;
                        } else {
                            final = final + ", " + result[count]._id;
                        }
                    }
                    count++;
                }
                return res.json({
                    'fulfillmentText': final + "."
                });
            }
            else {
                if (majorToSearch == "Unknown") {
                    return res.json({
                        'fulfillmentText': "Unfortunately, that major does not exist.",
                    });
                } else {
                    return res.json({

                        'fulfillmentText': "Currently, " + majorToSearch + " does not have papers listed.",
                    });
                }

            }

            db.close();
        });
    });
}

function semester(req,res){
  let paperToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.allPapers ? req.body.queryResult.parameters.allPapers : 'Unknown';

  MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("chatbot");
      dbo.collection("papers").find({ _id: paperToSearch }).toArray(function (err, result) {
          if (err) throw err;
          // console.log(result);

          if (result.length != 0) {

              if (result[0]._id == paperToSearch) {

                  var name = result[0]._id + ", " + result[0].paperName;

                  var s1c = result[0].semesters.s1c;
                  console.log(s1c);//these are returning undefined
                  var s1s = result[0].semesters.s1s;
                  console.log(s1s);
                  var s2c = result[0].semesters.s2c;
                  var s2s = result[0].semesters.s2s;

                  //variables for if papers are offered at all in these semesters (regardless of location)
                  var s1 = s1c || s1s;
                  console.log(s1);
                  var s2 = s2c || s2s;

                  //variables for if the papers are offered at both campuses IF they are offered at either
                  //note: if the paper isn't offered at either, true will be returned so only use these
                  //values in the situation that a paper is verified offered during that semester
                  var s1b = s1c && s1s;
                  var s2b = s2c && s2s;

                  if (s1 && s2) {
                    var output = "";
                    if(s1b && s2b){
                      output = name + " is offered at City and South campuses during both semesters."
                    }else if(s1b){
                      var resu = "";
                      if(s2c){
                        resu = "City";
                      }else{
                        resu = "South";
                      }
                      output = name + " is offered at City and South campuses during Semester 1, but only "+resu+" campus during Semester 2.";
                    }else if(s2b){
                      var resu = "";
                      if(s1c){
                        resu = "City";
                      }else{
                        resu = "South";
                      }
                      output = name + " is offered at City and South campuses during Semester 2, but only "+resu+" campus during Semester 1.";
                    }else if(s1c){
                      if(s2c){
                        output = name + " is offered at the City campus during both semesters.";
                      }else{
                        output = name + " is offered at the City campus in Semester 1 and South campus in Semester 2";
                      }
                    }else if(s1s){
                      if(s2s){
                        output = name + " is offered at the South campus during both semesters.";
                      }else{
                        output = name + " is offered at the South campus in Semester 1 and City campus in Semester 2";

                      }
                    }else{
                      output = "error, pls fix me - calli";
                    }
                    console.log("output:"+output);
                    return res.json({
                        'fulfillmentText': output,
                    });
                  } else if (s1){
                    var output = "";
                      if(s1b){
                        output = name + " is offered during Semester 1 at both campuses";
                      }else if(s1c){
                        output = name + " is offered during Semester 1 at the City campus.";
                      }else{
                        output = name + " is offered during Semester 1 at the South campus.";
                      }
                      return res.json({
                          'fulfillmentText': output,
                      });
                  }else if(s2){
                    var output = "";
                    if(s2b){
                      output = name + " is offered during Semester 2 at both campuses";
                    }else if(s2c){
                      output = name + " is offered during Semester 2 at the City campus.";
                    }else{
                      output = name + " is offered during Semester 2 at the South campus.";
                    }
                    return res.json({
                        'fulfillmentText': output,
                    });
                  }else{
                    var output = name + " is not offered at all, unfortunately.";
                    return res.json({
                        'fulfillmentText': output,
                    });
                  }

              }
          }
          else {
              return res.json({
                  'fulfillmentText': "That is not a paper that we offer.",
              });
          }

          db.close();
      });
  });
}

function coReq(req, res) {
    let paperToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.allPapers ? req.body.queryResult.parameters.allPapers : 'Unknown';

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("chatbot");
        dbo.collection("papers").find({ _id: paperToSearch }).toArray(function (err, result) {
            if (err) throw err;
            // console.log(result);

            if (result.length != 0) {

                if (result[0]._id == paperToSearch) {

                    var name = result[0]._id + ", " + result[0].paperName;

                    // If there prerequisite value is NOT empty
                    if (result[0].coReq) {
                        var output = "The co-requisite(s) for " + name + " are " + result[0].coReq + ".";

                        return res.json({
                            'fulfillmentText': output,
                        });
                    } else {
                        var output = name + " does not have any co-requisites.";
                        return res.json({
                            'fulfillmentText': output,
                        });
                    }

                }
            }
            else {
                return res.json({
                    'fulfillmentText': "That is not a paper that we offer.",
                });
            }

            db.close();
        });
    });

}

function getPaper(req, res) {
    let paperToSearch = req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.allPapers ? req.body.queryResult.parameters.allPapers : 'Unknown';
    // console.log(paperToSearch);
    var output = "";
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("chatbot");

        dbo.collection("papers").find({ _id: paperToSearch }).toArray(function (err, result) {
            if (err) throw err;
            // console.log(result);

            var returnString = "";

            if (result.length != 0) {

                if (result[0]._id == paperToSearch) {


                    if (result[0].major == "core") {
                        returnString = "It is a core paper."
                    }
                    else if (result[0].major == "Software Development") {
                        returnString = "It is in the Software Developemnt major.";
                    }
                    else {
                        returnString = "";
                    }
                    // var result = "Yes, " + paperToSearch + " is an paper that the university offers. \n" + returnString;
                    // output = "{\"fulfillmentText\": \"" + result + "\"}";
                    // res.type('json');
                    // res.send(front);
                    return res.json({
                        'fulfillmentText': "Yes, " + paperToSearch + " is a paper that the university offers. \n" + returnString
                    });
                }
            }
            else {
                res.json({
                    'fulfillmentText': "No, " + paperToSearch + " is not a paper that the university offers."
                });
            }

            db.close();
        });
    });
    // return output;
}
