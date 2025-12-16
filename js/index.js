const map = document.getElementById("map"); //map dans le sens carte et pas structure de données petit malin ;)
const tailleMap = 50;

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
            rect.setAttribute("id", `${x}:${y}`);
            map.appendChild(rect);
        }
    }
}

setMap();