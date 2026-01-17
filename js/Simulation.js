import { Drone } from "./drone.js";
import { base, cases_en_feu, evitement, vraie_map } from "./index.js";


export class Simulation {

    #drones = []; // tableau de drones
    #carteCentreControle;
    #casesConnues;
    #propagation;
    #iterations = 0;
    #cases_a_ajouter_au_feu = [];
    #humainsSauves = 0;
    #humainsBrules = 0;
    #arbresBrules = 10;

    constructor(propagation, nb_drones, taille_vision, taille_detection, carburant) {
        console.log(`Création d'une simulation avec ${nb_drones} drones, propagation de ${propagation}, distance de vision : ${taille_vision}, distance de détection de ${taille_detection} et carburant de ${carburant}. Evitement = ${evitement}`)
        this.#casesConnues = 1; //la base est connue
        this.#carteCentreControle = this.create_map(vraie_map.length); //Création carte de la base
        this.#propagation = propagation;

        let drone;
        for (let i = 0; i < nb_drones; i++) {
            //création des drônes
            let random_coord = Math.floor(Math.random() * vraie_map.length); //permet de leur donnée une première direction différente
            switch (i % 4) {
                case 0:
                    drone = new Drone(taille_vision, taille_detection, carburant, 0, random_coord, vraie_map.length, base.x, base.y, this);
                    this.#drones.push(drone);
                    break;
                case 1:
                    drone = new Drone(taille_vision, taille_detection, carburant, vraie_map.length - 1, random_coord, vraie_map.length, base.x, base.y, this);
                    this.#drones.push(drone);
                    break;
                case 2:
                    drone = new Drone(taille_vision, taille_detection, carburant, random_coord, 0, vraie_map.length, base.x, base.y, this);
                    this.#drones.push(drone);
                    break;
                case 3:
                    drone = new Drone(taille_vision, taille_detection, carburant, random_coord, vraie_map.length - 1, vraie_map.length, base.x, base.y, this);
                    this.#drones.push(drone);
                    break;
            }
        }

        //On initie les statistiques
        const humainsSauves = document.getElementById("humainsSauves");
        humainsSauves.innerText = `Humains sauvés : ${this.#humainsSauves}`;
        const humainsBrules = document.getElementById("humainsBrules");
        humainsBrules.innerText = `Humains brûlés : ${this.#humainsBrules}`;
        const arbresBrules = document.getElementById("arbresBrules");
        arbresBrules.innerText = `Arbres brûlés : ${this.#arbresBrules}`;
    }

    create_map(taille_map) {
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        map[base.x][base.y] = "base";
        return map;
    }

    update() {
        this.#iterations += 1;
        if (this.#propagation != 0 && this.#iterations % ((10 - this.#propagation + 1) * 3) == 0) {
            //propgation à ce tour
            this.apply_propagation();
        }
        let i = 1;
        this.#drones.forEach(d => {
            //chaque drone jour son tour
            d.play_a_turn();
            i += 1
        });
    }

    set casesConnues(x) {
        this.#casesConnues = x;
    }

    get casesConnues() {
        return this.#casesConnues;
    }

    get mapCentreControle() {
        return this.#carteCentreControle;
    }

    set mapCentreControle(x) {
        this.#carteCentreControle = x;
    }

    apply_propagation() {
        //On applique la progation à chaque case feu
        this.#cases_a_ajouter_au_feu = [];
        cases_en_feu.forEach(case_en_feu => {
            this.brule_les_arbres_autour(case_en_feu.x, case_en_feu.y);
        });
        this.#cases_a_ajouter_au_feu.forEach(case_a_ajouter => {
            cases_en_feu.set(`${case_a_ajouter.x}:${case_a_ajouter.y}`, case_a_ajouter)
        })
    }

    brule_les_arbres_autour(x, y) {
        //Bruler les arbres autour d'un feu
        for (let i = x - 1; i <= x + 1; i += 1) {
            for (let j = y - 1; j <= y + 1; j += 1) {
                if (i < vraie_map.length && i >= 0 &&
                    j < vraie_map.length && j >= 0 &&
                    (vraie_map[i][j] == "arbre" || vraie_map[i][j] == "humain") &&
                    Math.floor(Math.random() * 3) % 3 == 0) { //une chance sur 3 de mettre le feu
                    this.#cases_a_ajouter_au_feu.push({ x: i, y: j });
                    let elem = document.getElementById(`${i}:${j}`);
                    if (vraie_map[i][j] == "arbre") { // <--------------------- ici pour les arbres brûlés
                        elem.classList.replace("arbre", "feu");
                        this.ajouterArbreBrule();
                    }
                    if (vraie_map[i][j] == "humain") {  // <------------------- ici pour les humains brûlés
                        elem.classList.replace("humain", "feu");
                        this.ajouterHumainBrule();
                    }
                    vraie_map[i][j] = "feu";

                }
            }
        }
    }

    drone_at(x, y) {
        //renvoie true si un drone est à la position x:y
        let result = false;
        this.#drones.forEach(drone => {
            if (drone.x == x && drone.y == y) {
                result = true;
            }
        });
        return result;
    }

    drone_closed_to(x, y, distance) {
        //renvoie true si un drone se trouve à distance {distane} de x:y:
        let result = false
        this.#drones.forEach(drone => {
            if (x + distance <= drone.x &&
                x - distance >= drone.x &&
                y + distance <= drone.y &&
                y - distance >= drone.y)
                result = true;
        })
        return result
    }

    //appellé depuis la classe Drone quand il trouve un humain
    ajouterHumainSauve() {
        this.#humainsSauves += 1;
        const humainsSauves = document.getElementById("humainsSauves");
        humainsSauves.innerText = `Humains sauvés : ${this.#humainsSauves}`;
    }
    ajouterHumainBrule() {
        this.#humainsBrules += 1;
        const humainsBrules = document.getElementById("humainsBrules");
        humainsBrules.innerText = `Humains brûlés : ${this.#humainsBrules}`;
    }

    ajouterArbreBrule() {
        this.#arbresBrules += 1;
        const arbresBrules = document.getElementById("arbresBrules");
        arbresBrules.innerText = `Arbres brûlés : ${this.#arbresBrules}`;
    }


} 