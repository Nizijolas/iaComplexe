import { Drone } from "./drone.js";
import { Simulation } from "./Simulation.js ";

const map = document.getElementById("map"); //map dans le sens carte et pas structure de données petit malin ;)
const tailleMap = 40;

export var vraie_map;
export var base_map;

function fill_vraie_map() {

    vraie_map = new Array(tailleMap);

    for (let i = 0; i < tailleMap; i += 1) {
        vraie_map[i] = new Array(tailleMap);
    }

    for (let x = 0; x < tailleMap; x += 1) {
        for (let y = 0; y < tailleMap; y += 1) {
            //Création de la base
            if (x == 0 && y == 0) {
                vraie_map[0][0] = "base";
            }
            //Création des feux, carré de 9 sur 9 en bas à droite
            else if (x > 30 && y > 30) {
                vraie_map[x][y] = "feu";
            }
            //il reste que les arbres
            else {
                vraie_map[x][y] = "arbre";
            }
        }
    }
}

function create_base_map() {
    base_map = new Array(tailleMap);
    for (let i = 0; i < tailleMap; i += 1) {
        base_map[i] = new Array(tailleMap);
    }
    base_map[0][0] = "base";
}

function setMap() {
    let totalLength = Math.min(window.innerWidth, window.innerHeight) * 0.7; // pas agréable si ça touche les bords d'où le 0,7
    let oneTileLength = totalLength / tailleMap;
    map.innerHTML = "";
    map.setAttribute("width", totalLength);
    map.setAttribute("height", totalLength);
    for (let y = 0; y < tailleMap; y++) {
        for (let x = 0; x < tailleMap; x++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("width", oneTileLength);
            rect.setAttribute("height", oneTileLength);
            rect.setAttribute("x", x * oneTileLength);
            rect.setAttribute("y", y * oneTileLength);
            if (x == 0 && y == 0) {
                rect.setAttribute("class", vraie_map[x][y]);
            } else {
                rect.setAttribute("class", "inconnu " + vraie_map[x][y]);
            }
            //on set les id de chaque case sur ce canvas "x:y" pour gérér les changements de classe via l'id de la case après.
            rect.setAttribute("id", `${x}:${y}`)
            map.appendChild(rect);
        }
    } // Le cases sont toutes à fill black de base et au fur et à mesure de leur découverte il faudra les passer à vert en leur passant la classe arbre
    const base = document.getElementById("0:0") //on met la base à 0, 0;
    base.classList.add("base");
}


fill_vraie_map();
create_base_map();
setMap();
var interval;
var isRunning = false;
var simulation;
// Lancer la simulation en récupérant les inputs
const lancerSimulation = document.getElementById("lancerSimulation"); // <-- le boutton
const stepByStep = document.getElementById("stepByStep"); // <-- boutton pour avancer étape par étape le jeu doit être en pause
const properties = document.getElementById("properties");
var vitesse;
lancerSimulation.addEventListener("click", () => {
    if (isRunning) { //si la simulation était en cours
        lancerSimulation.innerText = "Relancer la simulation";
        clearInterval(interval);
        isRunning = false;
        stepByStep.style.display = "block";
    }
    else { //On lance ( ou relance ) la simulation 
        stepByStep.style.display = "none";
        console.log(vraie_map[0][0])
        if (!simulation) {
            // si simulation est undefined c'est que c'est le début sinon c'est qu'on avait mis sur pause;
            // si première fois qu'on lance on doit créer la simulation et passer les properties à display none;
            simulation = new Simulation();
        } 
        interval = setInterval(play, 150, simulation);
        lancerSimulation.innerText = "mettre sur pause";
        isRunning = true;
    }
})


stepByStep.addEventListener('click',()=>{
    if ( !simulation ){
        simulation = new Simulation();
    }
    simulation.update();
})

function play(simulation) {
    simulation.update(); //fonction de l'interval
}

//il faut exporter une fonction endOfSimulation qu'on appellera depuis la simulation