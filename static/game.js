//========================================================================
// SciKit-SurgeryFRED game logic
//========================================================================

var dial; 
const scores = [];
const totalrepeats = 20; 
var repeats = 0;
var total_score = 0;
const state_strings = ["Actual TRE", "FLE and no fids", "Expected FRE", "Expected TRE", "Actual FRE"]
var state_string_vector = []

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
	state_string_vector.push(...start_states);
	state_string_vector.push(...random_states);

	return state_string_vector;
};


function set_statistic_visibilities(stat_state) {};


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
			console.log(data.score);
			scores.push(data.score);
			total_score = total_score + data.score;
			repeats = repeats - 1;
			updateGameStats();
			if ( repeats == 0 )
				endgame();
			else
				reset();

		});
	})
	.catch(err => {
            console.log("An error occured calculating the score.", err.message);
      });
};

function gameMode() {
        console.log("pressed game button", state, repeats)
	if ( state == "game" ) //are already in game mode ?
	{
		if ( repeats == 0 ) //we can go back to FRED
		{
			hideGameElements();
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
		repeats = totalrepeats;
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
	}

};

function endgame() {
	show(document.getElementById('game_button'));
};


	
function updateGameStats() {
	document.getElementById('repeats').innerHTML = repeats;
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


};
