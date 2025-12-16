import { Simulation } from "./Simulation.js ";

const map = document.getElementById("map"); //map dans le sens carte et pas structure de données petit malin ;)
const tailleMap = 40;

//Charge le svg de base
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
            rect.setAttribute("fill", "black");
            //on set les id de chaque case sur ce canvas "x:y" pour gérér les changements de classe via l'id de la case après.
            rect.setAttribute("id", `${x}:${y}`)
            map.appendChild(rect);
        }
    } // Le cases sont toutes à fill black de base et au fur et à mesure de leur découverte il faudra les passer à vert en leur passant la classe arbre
    const base = document.getElementById("0:0") //on met la base à 0, 0;
    base.classList.add("base");
} 

setMap();


// Lancer la simulation en récupérant les inputs
const lancerSimulation = document.getElementById("lancerSimulation"); // <-- le boutton
const vitesseInput = document.getElementById("vitesse");
const propagationInput = document.getElementById("propagation");

lancerSimulation.addEventListener("click", () => {
    console.log(vitesseInput.value); // à normaliser du coup et determinera la vitesse de l'interval
    console.log(propagationInput.checked); // true si coché

    //a voir si besoin de plus d'input, nombre d'anomalies ? 

    // on passe les values des inputs à un constructeur de "Simulation", on passe le boutton lancerSimulation à displayNone
    let simulation = new Simulation(propagationInput.checked); // par exemple

})