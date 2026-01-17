import { Simulation } from "./Simulation.js ";

const map = document.getElementById("map"); //map dans le sens carte et pas structure de données petit malin ;)
const tailleMap = 40;
export const base = { x: Math.round(tailleMap / 2), y: Math.round(tailleMap / 2) }

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
            if (x == base.x && y == base.y) {
                vraie_map[x][y] = "base";
            }
            //il reste que les arbres
            else {
                vraie_map[x][y] = "arbre";
            }
        }
    }

    //création de 10 anomalies pour feu
    for (let i = 0; i < 10; i++) {
        let randomX = Math.floor(Math.random() * tailleMap);
        let randomY = Math.floor(Math.random() * tailleMap);
        while (vraie_map[randomX][randomY] == "feu" //tant que ces randomCoo sont déjà occupé par un feu/base/humain on continue
            || vraie_map[randomX][randomY] == "base"
        ) {
            randomX = Math.floor(Math.random() * tailleMap);
            randomY = Math.floor(Math.random() * tailleMap);
        }
        console.log(randomX)
        console.log(randomY)
        vraie_map[randomX][randomY] = "feu";
        cases_en_feu.set(`${randomX}:${randomY}`, { x: randomX, y: randomY })

    }

    for (let i = 0; i < 10; i++){
        let randomX = Math.floor(Math.random()*tailleMap);
        let randomY = Math.floor(Math.random() * tailleMap);
        while (vraie_map[randomX][randomY] == "feu" //tant que ces randomCoo sont déjà occupé par un feu/base/humain on continue
            || vraie_map[randomX][randomY] == "base"
            ||  vraie_map[randomX][randomY] == "humain"
        ){ 
            randomX = Math.floor(Math.random() * tailleMap);
            randomY = Math.floor(Math.random() * tailleMap);
        }
        console.log(randomX)
        console.log(randomY)
        vraie_map[randomX][randomY] = "humain";
    }

}


function create_base_map() {
    base_map = new Array(tailleMap);
    for (let i = 0; i < tailleMap; i += 1) {
        base_map[i] = new Array(tailleMap);
    }
    base_map[base.x][base.y] = "base";
}

function setMap() {
    let totalLength = Math.min(window.innerWidth, window.innerHeight) * 0.7; // pas agréable si ça touche les bords d'où le 0,7
    let oneTileLength = totalLength / tailleMap;
    map.innerHTML = "";
    map.setAttribute("width", totalLength);
    map.setAttribute("height", totalLength);
    for (let x = 0; x < tailleMap; x++) {
        for (let y = 0; y < tailleMap; y++) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("width", oneTileLength);
            rect.setAttribute("height", oneTileLength);
            rect.setAttribute("x", y * oneTileLength);
            rect.setAttribute("y", x * oneTileLength);
            //La base n'est pas inconnue
            if (x == base.x && y == base.y) {
                rect.setAttribute("class", vraie_map[x][y]);
            } else {
                rect.setAttribute("class", "inconnu " + vraie_map[x][y]);
            }
            //on set les id de chaque case sur ce canvas "x:y" pour gérér les changements de classe via l'id de la case après.
            rect.setAttribute("id", `${x}:${y}`)
            map.appendChild(rect);
        }
    }
    const case_base = document.getElementById(`${base.x}:${base.y}`);
    case_base.classList.add("base");
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
const humainsSauves = document.getElementById("humainsSauves") ;
const humainsBrules = document.getElementById("humainsBrules");


lancerSimulation.addEventListener("click", () => {
    if (isRunning) { //si la simulation était en cours
        lancerSimulation.innerText = "Relancer la simulation";
        clearInterval(interval);
        isRunning = false;
        stepByStep.style.display = "block";
    }
    else { //On lance ( ou relance ) la simulation 
        stepByStep.style.display = "none";
        console.log(vraie_map[base.x][base.y])
        if (!simulation) {
            // si simulation est undefined c'est que c'est le début sinon c'est qu'on avait mis sur pause;
            simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
            properties.style.display = "none";
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
}
function stopSimulation() {
    clearInterval(interval);
    alert("La simulation s'est terminée");
    cases_en_feu = new Map();
    fill_vraie_map();
    setMap();
    create_base_map();
    simulation = null;
    isRunning = false;
    lancerSimulation.innerText = "Lancer simulation";
    stepByStep.style.display = "block";
    properties.style.display = "block";
    humainsSauves.innerText = "";
    humainsBrules.innerText = "";
}
const reinit = document.getElementById("reinit");

reinit.addEventListener('click', () => {
    if (simulation)
        stopSimulation();
})