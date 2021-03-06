//========================================================================
// SciKit-SurgeryFRED game logic
//========================================================================

var dial = null; 
const scores = [];
const totalrepeats = 10; 
var total_score = 0;
const state_strings = ["Actual TRE", "FLE and no fids", "Expected FRE", "Expected TRE", "Actual FRE"]
var state_string_vector = [];
var stat_state = "None";
var high_scores = [];
var ranking;
var lowest_ref;
const numberOfHighScores = 12;

function shuffleArray(array) {
	//this is an ES6 implementation of a Durstenfeld shuffle, from 
	//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	//it would be nice to test it 
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function create_state_vector(state_strings, totalrepeats){
	//check that total repeats is a product of the length of the state vector
	state_string_vector.length = 0;
	if ( totalrepeats % state_strings.length > 0 ){
		console.log('Total repeats should be a product of the length of the state vector')
		return []
	};

	let random_states = []
	let start_states = []
	let blocks = totalrepeats / state_strings.length
	for (i = 0 ; i < blocks ; i++)
	{
		start_states.push(state_strings[0]);
		random_states.push(...state_strings.slice(1,state_strings.length));
	}
	shuffleArray(random_states);
	state_string_vector.push(...random_states);
	state_string_vector.push(...start_states);

	return state_string_vector;
};


function set_statistic_visibilities(stat_state) {
	document.querySelectorAll('.resultbox').forEach(function(el) {
		hide(el);
	});
	if ( stat_state == "Actual TRE" ){
		show(document.getElementById("no-fidsdiv"));
		show(document.getElementById("actualtrediv"));
	}
	if ( stat_state == "FLE and no fids" ){
		show(document.getElementById("no-fidsdiv"));
		show(document.getElementById("expectedflediv"));
	}
	if ( stat_state == "Expected TRE" ){
		show(document.getElementById("expectedtrediv"));
	}
	if ( stat_state == "Expected FRE" ){
		show(document.getElementById("expectedfrediv"));
	}
	if ( stat_state == "Actual FRE" ){
		show(document.getElementById("actualfrediv"));
	}



};


function enable_ablation() {
	document.getElementById("ablation_button").disabled = false;
	document.getElementById("ablation_button").style.backgroundColor = "#de1712";
};

function disable_ablation() {
	document.getElementById("ablation_button").disabled = true;
	document.getElementById("ablation_button").style.backgroundColor = "#f0f0f0";
};

function ablate() {
	var margin = dial.get('value');
	calculatescore(margin);
};

function calculatescore(margin) {
	fetch("/calculatescore", {
		method: "POST",
		headers: {
        	    "Content-Type": "application/json"
      		},
		body: JSON.stringify({
			"target": target,
			"est_target": transformed_target,
			"target_radius": target_radius,
			"margin": margin
		})
	})
	.then(resp => {
		resp.json().then(data => {
			scores.push(data.score);
			total_score = total_score + data.score;
			updateGameStats();
			writegameresults(stat_state, data.score, margin, dbreference, reg_dbreference);
			if ( state_string_vector.length <= 0 )
				endgame();
			else
			  {
				reset();
				stat_state = state_string_vector.pop();
				set_statistic_visibilities(stat_state);
			  }

		});
	})
	.catch(err => {
            console.log("An error occured calculating the score.", err.message);
      });
};

function writegameresults(state, score, margin, databasereference, reg_dbreference)
{
      fetch("/writegameresults", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
              "reference" : databasereference,
              "state" : state,
              "score" : score,
	      "margin" : margin,
	      "reg_reference" : reg_dbreference
      })

    })
    .catch(err => {
      console.log("An error occured writing game results to database", err.message);
    });
}


function gameMode() {
        console.log("pressed game button", state, state_string_vector.length)
	if ( state == "game" ) //are already in game mode ?
	{
		if (  state_string_vector.length == 0 ) //we can go back to FRED
		{
			hideGameElements();
			hide(document.getElementById('submitScoreForm'));
			hide(document.getElementById('highScoreTable'));
			switchToFred();
			button = document.getElementById('game_button');
    			button.value="Play Game"
			show(document.getElementById('plot_button'));
			show(document.getElementById('newtargetbutton'));
			show(document.getElementById('downloadbutton'));
		}
	}
	else
	{
		if ( state == "plot" ) {
			switchToFred();
		}

		console.log("Entering Game Mode");
		scores.length = 0;
		total_score = 0;
		showGameElements();
		updateGameStats();
	        button = document.getElementById('game_button');
    		button.value="Back to Fred";
		hide(button);
		hide(document.getElementById('plot_button'));
		hide(document.getElementById('newtargetbutton'));
		hide(document.getElementById('downloadbutton'));
		reset();
		state = "game";

		state_string_vector = create_state_vector(state_strings, totalrepeats);
		console.log(state_string_vector);
		stat_state = state_string_vector.pop();
		set_statistic_visibilities(stat_state);
	}

};

function endgame() {
	show(document.getElementById('game_button'));
 	fetch("/gethighscores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                        "score": total_score,
                })
        })
        .then(resp => {
                resp.json().then(data => {
			high_scores = data.scores;
			ranking = data.ranking;
			lowest_ref = data.lowest_ref;
			
			hideCanvases();
			if ( ranking < numberOfHighScores ) {
				show(document.getElementById('submitScoreForm'));
				document.getElementById('submitScoreForm').addEventListener("keypress", function (e) {
					if (e.key === 'Enter')
						submitHighScore();
				});
			}
			else 
			    showHighScores();

                });
        })
        .catch(err => {
            console.log("An error occured getting high scores.", err.message);
	});
};

function showHighScores() {
	//puts high scores into table
	show(document.getElementById('highScoreTable'));
	let scores=""
	let names=""
	let ranks=""
    	for (let i = 0; i < high_scores.length; i++) {
		if ( high_scores.length > i ){
			names = names + high_scores[i].name + "<br>";
			scores = scores + high_scores[i].score + "<br>";
			ranks = ranks + i + "<br>";
		}
	}

	document.getElementById('names').innerHTML = names;
	document.getElementById('scores').innerHTML = scores;
	document.getElementById('ranks').innerHTML = ranks;
	
};

function submitHighScore() {
	//puts new name into high_scores at appropriate place, and 
	//submits name to database
	document.getElementById('submitScoreForm').removeEventListener("keypress", function (e){});
	if (high_scores.length < numberOfHighScores){
	    lowest_ref = "new score";
	    high_scores.push(high_scores[high_scores.length - 1])
	}
    	for (let i = high_scores.length - 1; i > ranking; i--) {
		high_scores[i] = high_scores[i-1];
	}
	let name = document.getElementById('nameid').value;
	let score_dict = {
			"score": total_score,
                        "name" : name,
                        "docref" : lowest_ref 
	}
	high_scores[ranking] = score_dict;

	hide(document.getElementById('submitScoreForm'));
	showHighScores();

	fetch("/addhighscore", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(score_dict)
        })
        .catch(err => {
            console.log("An error occured submiting high score.", err.message);
        });

}

function closeSubmitScoreForm() {
	hide(document.getElementById('submitScoreForm'));
	showHighScores();

}
function updateGameStats() {
	document.getElementById('repeats').innerHTML = state_string_vector.length;
	document.getElementById('totalscore').innerHTML = total_score;
	if (scores.length > 0) 
		document.getElementById('lastscore').innerHTML = scores[scores.length - 1];
	else
		document.getElementById('lastscore').innerHTML = 0;
};


function showGameElements(){
        document.querySelectorAll('.scorebox').forEach(function(el) {
        show(el);
        });
        document.querySelectorAll('.gameelement').forEach(function(el) {
        show(el);
        });

	if (dial == null){
	     YUI().use('dial', function(Y) {

             dial = new Y.Dial({
             min:0,
             max:20,
	     decimalPlaces:1,
             stepsPerRevolution:2,
             value: 1,
	     strings : {
		label: 'Margin',
		resetStr:'Reset',
		tooltipHandle:'Drag to ablation margin'
	    }
            });
            dial.render('#ablation_dial');

            });
	}


};
