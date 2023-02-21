import { Vex, Accidental, StaveNote, Formatter } from "./node_modules/vexflow/build/esm/entry/vexflow.js";

var key = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p',';',':','[',']'];
var note=["C/4","Db/4","D/4","Eb/4","E/4","F/4","Gb/4","G/4","Ab/4","A/4","Bb/4","B/4",
          "C/5","Db/5","D/5","Eb/5","E/5","F/5","Gb/5","G/5"];
var doremi = ["C", "D", "E", "F", "G", "A", "B"];
var is_pressed = {};
var key2note = {};
var note2num={};
var num2note={};
for(let i=0; i<key.length; i++){
    is_pressed[key[i]] = [0,0];//押されているか、処理したか
    key2note[key[i]] = note[i];
    note2num[note[i]] = 60+i;
    num2note[60+i] = note[i];
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
const scoreh = document.getElementById('score').clientHeight;
const stave = new Stave(WIDTH*0.1/3, (scoreh/2-66)/3-44, WIDTH*0.3/3);

// Add a clef and time signature.
stave.addClef('treble');

context.scale(3,3);
let on_notes = [];
let show_notes = [];

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
        new Vex.Flow.StaveNote({clef: "treble", keys: show_notes, duration: "w" }),
    ];
    
    for(let i=0; i<show_notes.length; i++){
        if(show_notes[i].includes("#")){
            notes[0].addModifier(new Accidental("#"), i);
        }
        else if(show_notes[i].includes("b")){
            notes[0].addModifier(new Accidental("b"), i);
        }
    }
    let voice = new Vex.Flow.Voice({num_beats: 4,  beat_value: 4});
    voice.addTickables(notes);
    const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 0);
    voice.draw(context, stave);
}

function onNotesToNum(){
    let num=[]
    for(let i of on_notes){
        num.push(note2num[i]);
    }
    on_notes.sort(function(a,b){
        return note2num[a] - note2num[b];
    })
    num.sort(function (a, b) {
        return a - b;
    })
    return num;
}

function allIncludes(temp, notes){
    return temp.every(value => notes.includes(value));
}

function oneIncludes(temp, notes){
    return temp.some(value => notes.includes(value));
}

function modify(orig, target){
    let sharp = note2num[orig]%12 - note2num[target+"/4"]%12;
    var newNote = orig;
    if(sharp==1){
        newNote = target+"#"+orig.slice(-2);
    }else if(sharp==-11){
        newNote = target+"#/"+String(Number(orig.slice(-1))-1);
    }else if(sharp==-1){
        newNote = target+"b"+orig.slice(-2);
    }else if(sharp==11){
        newNote = target+"b/"+String(Number(orig.slice(-1))+1);
    } 
    console.log(newNote);
    show_notes[on_notes.indexOf(orig)] = newNote;
}

function calc_args(abs, drm, note_num, root){
    return [on_notes[note_num.indexOf(abs)], doremi[(doremi.indexOf(root[0])+drm)%7]]
}

function numToChord(note_num){
    if(note_num.length!=0){
        let root_num = note_num[0]
        let root = note[root_num%12].slice(0,-2);
        for(let i in note_num){
            note_num[i] -= root_num;
            note_num[i] %= 12;
        }
        
        //3について
        if(note_num.includes(3) && !note_num.includes(4)){
            root += "m";
            modify(...calc_args(3,2, note_num,root));
        }else if(note_num.includes(4)){
            modify(...calc_args(4,2, note_num,root))
        }
        //7について
        if(note_num.includes(11)){
            root += "M7";
            modify(...calc_args(11,6, note_num,root))
        }else if(note_num.includes(10)){
            root += "7";
            modify(...calc_args(10,6, note_num,root))
        }else if(note_num.includes(9)){
            root += "6";
            modify(...calc_args(9,5, note_num,root))
        }

        //3追加
        if(!note_num.includes(3) && !note_num.includes(4)){
            if(note_num.includes(5)){
                root += "sus4";
                modify(...calc_args(5,3, note_num,root))
            }else if(note_num.includes(2)){
                root += "sus2";
                modify(...calc_args(2,1, note_num,root))
            }
        }

        //5について
        if(!note_num.includes(7)){
            if(note_num.includes(6)){
                root += "-5";
                modify(...calc_args(6,4, note_num,root))
            }else if(note_num.includes(8)){
                root += "+5";
                modify(...calc_args(8,4, note_num,root))
            }
        }else{
            modify(...calc_args(7,4, note_num,root))
        }

        //テンションについて
        var tension = [];
        if(note_num.includes(1)){
            tension.push("b9");
            modify(...calc_args(1,1, note_num,root))
        }
        if(oneIncludes([3,4], note_num)){
            if(note_num.includes(2)){
                tension.push("9");
                modify(...calc_args(2,1, note_num,root))
            }
            if(allIncludes([3,4], note_num)){
                tension.push("#9");
                modify(...calc_args(3,1, note_num,root))
            }
            if(note_num.includes(5)){
                tension.push("11");
                modify(...calc_args(5,3, note_num,root))
            }
        }else{
            if(allIncludes([2,5],note_num)){
                tension.push("9");
                modify(...calc_args(2,1, note_num,root))
            }
        }

        if(note_num.includes(7)){
            if(note_num.includes(6)){
                tension.push("#11");
                modify(...calc_args(6,3, note_num,root))
            }
            if(note_num.includes(8)){
                tension.push("b13")
                modify(...calc_args(8,5, note_num,root))
            }
        }else{
            if(allIncludes([6,8],note_num)){
                tension.push("b13");
                modify(...calc_args(8,5, note_num,root))
            }
        }

        if(oneIncludes([10,11], note_num)){
            if(note_num.includes(9)){
                tension.push("13");
                modify(...calc_args(9,5, note_num,root))
            }
            if(allIncludes([10,11], note_num)){
                tension.push("#13");
                modify(...calc_args(10,5, note_num,root))
            }
        }

        
        if(tension.length>0){
            root += "(" + tension.join() + ")";
        }

        //omitについて
        if(!oneIncludes([2,3,4,5],note_num)){
            root += "(omit3)";
        }
        if(!oneIncludes([6,7,8],note_num)){
            root += "(omit5)";
        }
        

        
        return root;
    }else{
        return "";
    }
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
    //console.log(on_notes);
    
    var note_num = onNotesToNum();
    show_notes = on_notes.slice(0,on_notes.length);
    var chord = numToChord(note_num);
    console.log(on_notes);
    console.log(show_notes);
    console.log(note_num);

    //console.log(chord);
    document.getElementById("symbol").innerHTML=chord;
    clearStave();
    reloadStave();
    
}


function on_press(event){
    let pressed = event.key;
    //console.log(pressed);
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

// function clearSvg(){
//     var elements = document.getElementsByTagName("svg");
//     while(elements[0]){
//         elements[0].parentNode.removeChild(elements[0]);
//     }
// }

// function reloadSvg(){
//     const scoreh = document.getElementById('score').clientHeight;
//     const stave = new Stave(window.innerWidth*0.1/3, (scoreh/2-66)/3-44, window.innerWidth*0.3/3);
//     // Add a clef and time signature.
//     stave.addClef('treble');
//     context.scale(3,3);
//     stave.setContext(context).draw();
//     reloadStave();
// }
// function on_resize(){
//     clearSvg().then(reloadSvg);
// }

window.addEventListener('DOMContentLoaded', function(){  
    window.addEventListener("keydown", on_press);
    window.addEventListener("keyup", on_release);
    //window.addEventListener('resize', on_resize);
});