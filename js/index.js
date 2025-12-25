import { Drone } from "./drone.js";
import { Simulation } from "./Simulation.js ";

const map = document.getElementById("map"); //map dans le sens carte et pas structure de données petit malin ;)
const tailleMap = 40;

export var vraie_map;
export var base_map;
export var cases_en_feu = new Map();

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
                cases_en_feu.set(`${x}:${y}`, { x: x, y: y })
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
const nb_drones = document.getElementById('nbdrones');
const vitesse = document.getElementById("vitesse");
const vision = document.getElementById("visionDrones");
const detection = document.getElementById("detectionDrones");
const carburant = document.getElementById("carburant");
const propagation = document.getElementById("propagation");


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
            simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
            console.log(propagation.value)
            properties.style.display = "none";
            lancerDroneSeul.style.display = "none";
        }
        interval = setInterval(play, vitesse.value, simulation);
        lancerSimulation.innerText = "mettre sur pause";
        isRunning = true;
    }
})


stepByStep.addEventListener('click', () => {
    if (!simulation) {
        simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
    }
    simulation.update();
})

function play(simulation) {
    simulation.update(); //fonction de l'interval
    if (simulation.casesConnues == vraie_map.length * vraie_map.length
    ) {
        stopSimulation();
    }
}
function stopSimulation() {
    clearInterval(interval);
    alert("La simulation s'est terminée");
    fill_vraie_map();
    setMap();
    simulation = null;
    isRunning = false;
    lancerSimulation.innerText = "Lancer simulation";
    lancerDroneSeul.style.display = "block";
    stepByStep.style.display = "block";
    properties.style.display = "block";
}




//pour lancer drone seul à enlever quand on aura finit -------------------------------
const lancerDroneSeul = document.getElementById("lancerDroneSeul");
var drone;
lancerDroneSeul.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(interval);
        lancerDroneSeul.innerText = "Relancer drone seul";
        isRunning = false;
    }
    else {
        if (!drone) {
            drone = new Drone(1, 30, 39, 39, vraie_map.length);
            properties.style.display = "none";
            stepByStep.style.display = "none";
            lancerSimulation.style.display = "none";

        }
        lancerDroneSeul.innerText = "Mettre sur pause";
        interval = setInterval(playDrone, vitesse.value, drone);
        isRunning = true;
    }


});

function playDrone(drone) {
    drone.play_a_turn();
    if (drone.casesConnues == vraie_map.length * vraie_map.length
    ) {
        stopDroneSeul();
    }
}

function stopDroneSeul() {
    clearInterval(interval);
    alert("Le drone seul a terminé");
    fill_vraie_map();
    setMap();
    stepByStep.style.display = "block";
    lancerSimulation.style.display = "block";
    lancerDroneSeul.innerText = "Lancer drone seul";
    properties.style.display = "block";
    drone = null;
    isRunning = false;
}


const reinit = document.getElementById("reinit");

reinit.addEventListener('click', () => {
    if (simulation)
        stopSimulation();
    if (drone)
        stopDroneSeul();
})