import { Simulation } from "./Simulation.js ";

const map = document.getElementById("map"); //Carte de la simulation
const tailleMap = 40;
export const base = { x: Math.round(tailleMap / 2), y: Math.round(tailleMap / 2) } //Placement de la base

export var vraie_map;
export var base_map;
export var cases_en_feu = new Map();

function fill_vraie_map() {
    //Création de la matrice qui représente la carte et remplissage avec la base et les arbres
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

    //création de 10 anomalies pour feu à des cases aléatoires
    for (let i = 0; i < 10; i++) {
        let randomX = Math.floor(Math.random() * tailleMap);
        let randomY = Math.floor(Math.random() * tailleMap);
        while (vraie_map[randomX][randomY] == "feu" //tant que ces randomCoo sont déjà occupé par un feu/base/humain on continue
            || vraie_map[randomX][randomY] == "base"
        ) {
            randomX = Math.floor(Math.random() * tailleMap);
            randomY = Math.floor(Math.random() * tailleMap);
        }
        //pouet(randomX)
        //pouet(randomY)
        vraie_map[randomX][randomY] = "feu";
        cases_en_feu.set(`${randomX}:${randomY}`, { x: randomX, y: randomY })

    }
    //Création de 10 cases "humains"
    for (let i = 0; i < 10; i++) {
        let randomX = Math.floor(Math.random() * tailleMap);
        let randomY = Math.floor(Math.random() * tailleMap);
        while (vraie_map[randomX][randomY] == "feu" //tant que ces randomCoo sont déjà occupé par un feu/base/humain on continue
            || vraie_map[randomX][randomY] == "base"
            || vraie_map[randomX][randomY] == "humain"
        ) {
            randomX = Math.floor(Math.random() * tailleMap);
            randomY = Math.floor(Math.random() * tailleMap);
        }
        //pouet(randomX)
        //pouet(randomY)
        vraie_map[randomX][randomY] = "humain";
    }

}


function create_base_map() {
    //Crée la carte vue par la base
    base_map = new Array(tailleMap);
    for (let i = 0; i < tailleMap; i += 1) {
        base_map[i] = new Array(tailleMap);
    }
    base_map[base.x][base.y] = "base";
}

function setMap() {
    //affichage de la base.
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
            rect.setAttribute("x", y * oneTileLength); //inversion x et y pour que le svg corresponde aux matrices
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



//----INITIALISATION----//

fill_vraie_map();
create_base_map();
//setMap();
var interval;
var isRunning = false;
var simulation;
// Récupération des inputs
const lancerSimulation = document.getElementById("lancerSimulation"); // <-- le boutton
const stepByStep = document.getElementById("stepByStep"); // <-- boutton pour avancer étape par étape le jeu doit être en pause
const properties = document.getElementById("properties");
const nb_drones = document.getElementById('nbdrones');
const vitesse = document.getElementById("vitesse");
const vision = document.getElementById("visionDrones");
const detection = document.getElementById("detectionDrones");
const carburant = document.getElementById("carburant");
const propagation = document.getElementById("propagation");
const statistiques = document.getElementById("statistiques");


const testbutton = document.getElementById("tests");

testbutton.addEventListener('click', () => {
    console.log("coucous")
    let hb = [];
    let ab = [];
    let nb_iter = 1000
    for (let i = 0; i < nb_iter; i += 1) {
        if (i % 10 == 0) {
            console.log(`simulation #${i}`)
        }
        simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
        simulation.update();

        for (let j = 0; j < 2000; j += 1) {
            simulation.update();
        }
        hb.push(simulation.humainsBrules);
        ab.push(simulation.arbresBrules);
        stopSimulation();
    }
    statistiques.style.display = "flex";

    let hb_total = 0;
    let ab_total = 0;
    for (let i = 0; i < nb_iter; i += 1) {
        hb_total += hb[i];
        ab_total += ab[i];
    }
    let ab_moyen = ab_total / nb_iter;
    let hb_moyen = hb_total / nb_iter;
    const humainsBrules = document.getElementById("humainsBrules");
    humainsBrules.innerText = `Humains brûlés : ${hb_moyen}`;

    const arbresBrules = document.getElementById("arbresBrules");
    arbresBrules.innerText = `Arbres brûlés : ${ab_moyen}`;
    console.log(`Total d'arbres brules : ${ab_total / nb_iter}`);
    //propa 3
    //1309 avec dectect 0
    //1000 avec 10

    //propa 2
    //816 avec 0
    //712 avec 10

    //propa 4
    //1530 avec 0
    //1321 avec 10

    console.log(`Total d'humains brules : ${hb_total / nb_iter}`)

})

lancerSimulation.addEventListener("click", () => {
    //lancement de la simuation en mode continue (pas step by step)
    if (isRunning) { //si la simulation était en cours
        lancerSimulation.innerText = "Relancer la simulation";
        clearInterval(interval);
        isRunning = false;
        stepByStep.style.display = "block";
    }
    else { //On lance ( ou relance ) la simulation 
        stepByStep.style.display = "none";
        //pouet(vraie_map[base.x][base.y])
        if (!simulation) {
            // si simulation est undefined c'est que c'est le début sinon c'est qu'on avait mis sur pause;
            simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
            properties.style.display = "none";
            statistiques.style.display = "flex";
        }
        interval = setInterval(play, vitesse.value, simulation);
        lancerSimulation.innerText = "mettre sur pause";
        isRunning = true;
    }
})


stepByStep.addEventListener('click', () => {
    //gestion du step by step
    if (!simulation) {
        simulation = new Simulation(Number(propagation.value), Number(nb_drones.value), Number(vision.value), Number(detection.value), Number(carburant.value));
    }
    simulation.update();
})

function play(simulation) {
    simulation.update(); //fonction de l'interval
}
function stopSimulation() {
    //arrêt de la simulation
    clearInterval(interval);
    //alert("La simulation s'est terminée");
    cases_en_feu = new Map();
    fill_vraie_map();
    //setMap();
    create_base_map();
    simulation = null;
    isRunning = false;
    lancerSimulation.innerText = "Lancer simulation";
    stepByStep.style.display = "block";
    properties.style.display = "block";
    statistiques.style.display = "none";

}
const reinit = document.getElementById("reinit");

reinit.addEventListener('click', () => {
    if (simulation)
        stopSimulation();
})