import { Vex, Accidental, StaveNote, Formatter } from "./node_modules/vexflow/build/esm/entry/vexflow.js";

var key = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p',';',':','[',']']
var note=["C/4","C#/4","D/4","D#/4","E/4","F/4","F#/4","G/4","G#/4","A/4","A#/4","B/4",
          "C/5","C#/5","D/5","D#/5","E/5","F/5","F#/5","G/5"]

var is_pressed = {};
var key2note = {};
var note2num={};
for(let i=0; i<key.length; i++){
    is_pressed[key[i]] = [0,0];//押されているか、処理したか
    key2note[key[i]] = note[i];
    note2num[note[i]] = 60+i;
}

const HEIGHT = window.innerHeight;
const WIDTH = window.innerWidth; 


const { Renderer, Stave } = Vex.Flow;

// Create an SVG renderer and attach it to the DIV element with id="output".
const div = document.getElementById('score');
const renderer = new Renderer(div, Renderer.Backends.SVG);

// Configure the rendering context.
renderer.resize(WIDTH*0.5, HEIGHT*0.5);
const context = renderer.getContext();
context.setFont('Arial', 10);

// Create a stave of width 400 at position 10, 40.
const stave = new Stave(WIDTH*0.05, HEIGHT*0.1, WIDTH*0.4);

// Add a clef and time signature.
stave.addClef('treble').addTimeSignature('4/4');

let on_notes = []

// Connect it to the rendering context and draw!
stave.setContext(context).draw();


function clearStave(){
    var elements = document.getElementsByClassName("vf-stavenote");
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        if (e) {
            e.parentNode.removeChild(e);
        }
    }
}

function reloadStave(){
    let notes = [
        new Vex.Flow.StaveNote({clef: "treble", keys: on_notes, duration: "w" }),
    ];
    for(let i in on_notes){
        if(on_notes[i].includes("#")){
            notes[0].addModifier(new Accidental("#"), i);
        }
        else if(on_notes[i].includes("b")){
            notes[0].addModifier(new Accidental("b"), i);
        }
    }
    let voice = new Vex.Flow.Voice({num_beats: 4,  beat_value: 4});
    voice.addTickables(notes);
    const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 400);
    voice.draw(context, stave);
}

function onNotesToNum(){
    let num=[]
    for(let i of on_notes){
        num.push(note2num[i]);
    }
    num.sort(function (a, b) {
        return a - b;
    })
    return num
}



function check(){
    for(let i of Object.keys(is_pressed)){
        if((is_pressed[i][0] == 1) && (is_pressed[i][1] == 0)){
            document.getElementById(key2note[i]).style.backgroundColor="red";
        }
        else if (is_pressed[i][0] == 0){
            document.getElementById(key2note[i]).style.backgroundColor = document.getElementById(key2note[i]).className;
        }
    }
    console.log(on_notes);
    var note_num = onNotesToNum();
    console.log(note_num);
    clearStave();
    reloadStave();
    
}


function on_press(event){
    let pressed = event.key;
    if((Object.keys(is_pressed).includes(pressed)) && (is_pressed[pressed][0] == 0)){
        is_pressed[pressed][0] = 1;
        on_notes.push(key2note[pressed]);
        check();
        is_pressed[pressed][1] = 1;
    }
}
        
function on_release(event){
    let released = event.key;
    if(Object.keys(is_pressed).includes(released)){
        is_pressed[released][0] = 0;
        is_pressed[released][1] = 0;
        on_notes.splice(on_notes.indexOf(key2note[released]), 1);
        check();
    }
}

window.addEventListener('DOMContentLoaded', function(){  
    window.addEventListener("keydown", on_press);
    window.addEventListener("keyup", on_release);
});