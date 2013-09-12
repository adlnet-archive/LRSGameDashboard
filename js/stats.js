//Used when sorting list of scores
function compare(x,y)
{
    if(x.correct - x.incorrect < y.correct - y.incorrect )
    return 1;
    else
    return -1;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//NH - added for graph data
var totalSolveAttempts = 0;
var totalSolved = 0;

//NH - added to change polling time
var pollingTimeoutInSeconds = 10;

//NH - stats
var totalPlayers = 0;
var totalCorrectAnswers = 0;
var totalAnswers = 0;

//Received new events for the live stream of LRS events
function PollForEventsCallback(res)
{
    if(!res)
    {
        return;
    }

    //NH - clear current stats
    $('#EventList').html("");
    $('#PlayerList').html("");
    $('#CorrectAnswerList').html("");
    $('#PuzzleSolversList').html("");
    totalPlayers = 0;
    totalQuestionsInBarGraph = 0;
    totalSolveAttempts = 0;
    totalSolved = 0;
    totalCorrectAnswers = 0;
    totalAnswers = 0;
    d1 = [];
    d2 = [];
    QuestionIDHash = {}; 
    CorrectAnswerHash = {};
    IncorrectAnswerHash = {};
    function callback(e){
        var result = JSON.parse(e.responseText);
        var statements = result.statements;
        //Add each event to the list view
        //NH - reversed order of statements to show most recent activies at top of lists
        //for(var i =0; i<statements.length; i++)
        var i = statements.length;
        while(i--)
        {
            //show raw stream
            var listcode = $('#EventList').html();
            var actname = statements[i].actor.name || "anonymous" + i;
            var verbname = statements[i].verb.display['en-US'] || statements[i].verb.id;
            if (statements[i].object.definition)
                var actname = statements[i].object.definition.name['en-US'] || statements[i].object.id;
            else
                var actname = statements[i].object.id;
            var newline = "<li>"+ actname + " " + verbname + " " + actname +"</li>";
            $('#EventList').html(newline + listcode);
            
            //determine total players - TotalPlayers
            if(statements[i].verb.id == ADL.verbs.registered.id)
            {
                totalPlayers++;
                var playerlistcode = $('#PlayerList').html();
                var newplayerline = "<li>"+ Truncate(statements[i].actor.name, 11) + " is now playing!</li>";
                $('#PlayerList').html(newplayerline + playerlistcode);
            }
            
            //correct answers - CorrectAnswerList
            if(statements[i].verb.id == ADL.verbs.answered.id)
            {
                //Build graph data
                BuildBarGraphData(statements[i]);
                totalAnswers++;
                
                //show stream
                if(statements[i].result && statements[i].result.success)
                {
                    totalCorrectAnswers++;
                    var correctanswerlistcode = $('#CorrectAnswerList').html();
                    var newcorrectanswerline = "<li>"+ Truncate(statements[i].actor.name, 15) + " got a letter!</li>";
                    $('#CorrectAnswerList').html(newcorrectanswerline + correctanswerlistcode);
                }
            }
            
            //solved - PuzzleSolversList
            if(statements[i].verb.id == ADL.verbs.completed.id)
            {
                totalSolveAttempts++;
                if(statements[i].result.success == true)
                {
                    totalSolved++;
                    var PuzzleSolversListcode = $('#PuzzleSolversList').html();
                    var newPuzzleSolversListline = "<li>"+ Truncate(statements[i].actor.name, 15) + " solved the puzzle!</li>";
                    $('#PuzzleSolversList').html(newPuzzleSolversListline + PuzzleSolversListcode);
                }
            }
            
            //leaderboard
            PopulateLeaderBoardLarge();
        }
        
        //show results
        $('#EventList').listview('refresh');
        $('#PlayerList').listview('refresh');
        $('#CorrectAnswerList').listview('refresh');
        $('#PuzzleSolversList').listview('refresh');
        $('#TotalPlayers').html(totalPlayers);
        $('#TotalCorrectAnswers').html(totalCorrectAnswers);
        $('#TotalAnswers').html(totalAnswers);

        if(totalSolveAttempts == 1)
        { $('#TotalSolveAttempts').html(totalSolveAttempts + " Solve Attempt"); }
        else { $('#TotalSolveAttempts').html(totalSolveAttempts + " Solve Attempts"); } 
        
        if(totalSolved == 1)
        { $('#TotalSolved').html(totalSolved + " Puzzle Solver"); }
        else
        { $('#TotalSolved').html(totalSolved + " Puzzle Solvers"); }
        //show charts
        ShowPieChart();
        ShowBarGraph();
        //reset to poll
        if(result.more){
            ADL.XAPIWrapper.getStatements(null, result.more, callback);
        }else{
            window.setTimeout(PollForEvents,pollingTimeoutInSeconds * 1000);
        }
    }
    callback(res);
}

// NH - bar graph series    
var d1 = [];
var d2 = [];
var QuestionIDHash = {}; 
var CorrectAnswerHash = {};
var IncorrectAnswerHash = {};

var totalQuestionsInBarGraph = 0;

function BuildBarGraphData(stmt)
{
    //determine if ID already exists - assign an integer 'questionNumber'
    if(QuestionIDHash[stmt.object.id] == null)
    {
        //increment total ? count
        totalQuestionsInBarGraph +=1;
        //assign numeric value to ID to use in graph series
        QuestionIDHash[stmt.object.id] = totalQuestionsInBarGraph;
    }

    //init to 0 correct answers if a new ID is found
    if(CorrectAnswerHash[QuestionIDHash[stmt.object.id]] == null)
    {
        CorrectAnswerHash[QuestionIDHash[stmt.object.id]] = 0;
    }

    //init to 0 incorrect answers if a new ID is found
    if(IncorrectAnswerHash[QuestionIDHash[stmt.object.id]] == null)
    {
        IncorrectAnswerHash[QuestionIDHash[stmt.object.id]] = 0;
    }

    //increment counts for each question
    if(stmt.result && stmt.result.success)
    {
        CorrectAnswerHash[QuestionIDHash[stmt.object.id]] += 1;
    }
    else 
    {
        IncorrectAnswerHash[QuestionIDHash[stmt.object.id]] += 1; 
    }
}

//NH - added 
function ShowBarGraph()
{
    //build graph data structure
    jQuery.each(CorrectAnswerHash, function (name, value) {
        d1.push([name.toString(), parseInt(value)]);
    });
    jQuery.each(IncorrectAnswerHash, function (name, value) {
        d2.push([name.toString(), parseInt(value)]);
    });
    
    var stack = 0, bars = true, lines = false, steps = false;

     $.plot($("#Bargraph"), [ d1, d2 ], {
            series: {
                stack: stack,
                lines: { show: lines, fill: true, steps: steps },
                bars: { show: bars, barWidth: 0.5 }
            }
        });
}

//NH - added
function ShowPieChart()
{
    var data = [
        { label: "Correct",  data: totalSolved},
        { label: "Incorrect",  data: totalSolveAttempts - totalSolved}
    ];

    // PIE GRAPH
    $.plot($("#piegraph"), data, 
    {
        series: {
            pie: { 
                show: true,
                radius: 1,
                label: {
                    show: true,
                    radius: 3/4,
                    formatter: function(label, series){
                        return '<div style="font-size:.8em;text-align:center;padding:2px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
                    },
                    background: { 
                        opacity: 0.5,
                        color: '#000'
                    }
                }
            }
        },
        legend: {
            show: false
        }
    });
}

//ADDED NH: Callback from AJAX after getting all the events from the LRS
LeaderboardLargePopulated = false;
function PopulateLeaderBoardLargeCallback(r)
{
    if(!r)
    { return;
    }
    // jQuery needs to refresh the styles on the control
    $('#LeaderList').listview('refresh');
    var counts = [];
    //NH-changed var name
    LeaderboardLargePopulated = true;
    function callback(e){
        var result = JSON.parse(e.responseText);    
        var statements = result.statements;
            for(var i in statements)
            {
        //Group the statements buy the name of the actor
        var found = false;
        var actorname = statements[i].actor.name;
        var actoremail = statements[i].actor.mbox;
        for(var j in counts)
        {
            if(counts[j].name && counts[j].name == actorname)
            {
            counts[j].count += 1;
            found = true;
            }
        }
        if(!found)
        {
          counts.push({name:actorname,count:1,email:actoremail});
        }
        }
    if (!result.more){       
    //Counts now contains a list of pairs of names and scores;
    //Sort the highest score to the top
    counts.sort(compare);
    document.getElementById('LeaderList').innerHTML = "";
    
    //For the top 20 names, print them into the leaderboard div
    for(var j =0; j < Math.min(20,counts.length);j++)
    {
    //NH - reformatted li test
    var li = "<li>"+counts[j].name+"<span class='ui-li-count' style='font-size: large;'>"+counts[j].count+"</span></li>"
    document.getElementById('LeaderList').innerHTML += li;
    }
    $('#LeaderList').listview('refresh');
//    jqmDialogClose();
    }else{
        ADL.XAPIWrapper.getStatements(null, result.more, callback);
    }
    }//callback e
 callback(r);
}

//ADDED NH: Populate the leader board with the score data
function PopulateLeaderBoardLarge()
{
    try{
        var args = ADL.XAPIWrapper.searchParams();
        args["verb"] = ADL.verbs.answered.id;
        ADL.XAPIWrapper.getStatements(args, null, PopulateLeaderBoardLargeCallback);
    }catch(e)
    {
        // alert(JSON.stringify(e));
    }
}

//NH - added to truncate names
function Truncate(stringToTruncate, maxLength)
{
    var rv = stringToTruncate;
    if(stringToTruncate.length > maxLength)
    {
        rv = stringToTruncate.substring(stringToTruncate, maxLength) + "... ";
    }
    return rv;
}

//NH - TODO: Get all the events in the last 5 seconds
function PollForEvents()
{
    try{
    
    ADL.XAPIWrapper.getStatements(null,null,PollForEventsCallback);

    } catch(e){}
}

function parseQueryString() {
    var loc, qs, pairs, pair, ii, parsed = {};
    
    loc = window.location.href.split('?');
    if (loc.length === 2) {
        qs = loc[1];
        pairs = qs.split('&');
        for ( ii = 0; ii < pairs.length; ii++) {
            pair = pairs[ii].split('=');
            if (pair.length === 2 && pair[0]) {
                parsed[pair[0]] = decodeURIComponent(pair[1]);
            }
        }
    }
    
    return parsed;
}

//Some initial config
$(document).ready(function(){

    jQuery.fx.interval = 100;

    ADL.XAPIWrapper.changeConfig(props);

    var QueryString = parseQueryString();
    gCurrentAction = QueryString["action"];
    gCurrentId = QueryString["id"];

    if(window.location.hash.indexOf('&') > -1)
    window.location.hash = window.location.hash.substr(0,window.location.hash.indexOf('&'));
 //    if(localStorage['UserName'] == null || localStorage['UserName'] == "" && $.mobile.path.parseUrl(window.location).hash != '#login' )
 //    {
    // jqmDialogOpen('New User Login');
    // window.setTimeout(function(){$.mobile.changePage($('#login'));},500);

    // return;
 //    }

});

// //Open a popup dialog
// function jqmDialogOpen(message) {
//     $('#popup').stop();
//     $('#popup').remove();
//     $("<div id='popup' style = 'border-width:2px; border-color:black; border-style:solid;height:70%;top:15%;width:80%;left:10%;text-align:center;vertical-align:center;position:fixed' class='ui-loader ui-overlay-shadow ui-body-c ui-corner-all'><h1 style='top:50%;left:0%;height:10em;margin-top:-5em;width:100%;position:absolute;margin-top:auto;margin-bottom:auto;line-height:100%'>" + message + "</br><img src='ajax-loader.gif'></h1></img></div>")
//     .css({
//  display: "block",
//  opacity: 0.96
//     })
//     .appendTo("body");
// }                    

$('#LiveStream').live('pageinit', function (event) {PollForEvents();});