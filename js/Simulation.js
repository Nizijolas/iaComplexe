import { Drone } from "./drone.js";
import { base, cases_en_feu, vraie_map } from "./index.js";

//pas dans une instance pour pouvoir l'appeller depuis drône qui ne connait pas l'instance de la Simulation hôte (ou alors faudrait lui passer dans le constructeur)
export let casesConnus = 1; //1 la base
export let anomaliesTraitees = 0;

var drone;
export class Simulation {

    #drones = []; // tableau de drones
    #carteCentreControle;
    #casesConnues;
    #propagation;
    #iterations = 0;
    #cases_a_ajouter_au_feu = [];

    constructor(propagation, nb_drones, taille_vision, taille_detection, carburant) {

        for (let i = 0; i < nb_drones; i++) { //création des drônes
            let random_coord = Math.floor(Math.random() * vraie_map.length);
            console.log(base);
            switch (i%4) {
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
        console.log(this.#drones)
        this.#casesConnues = 1; //la base est connue
        this.#carteCentreControle = this.create_map(vraie_map.length);
        this.#propagation = propagation
    }

    create_map(taille_map) {
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        map[base.x][base.y] = "base"
        return map;
    }

    update() {
        this.#iterations += 1;
        if (this.#propagation != 0 && this.#iterations % ((10 - this.#propagation + 1) * 3) == 0) {
            console.log("BUUUURRNNNN !!!!")
            this.apply_propagation();
        }
        this.#drones.forEach(d => d.play_a_turn());
    }

    set casesConnues(x) {
        this.#casesConnues = x;
    }

    get casesConnuesConnues() {
        return this.#casesConnues;
    }

    get mapCentreControle() {
        return this.#carteCentreControle;
    }

    set mapCentreControle(x) {
        this.#carteCentreControle = x;
    }

    apply_propagation() {
        this.#cases_a_ajouter_au_feu = [];
        cases_en_feu.forEach(case_en_feu => {
            this.brule_les_arbres_autour(case_en_feu.x, case_en_feu.y);
        });
        this.#cases_a_ajouter_au_feu.forEach(case_a_ajouter => {
            cases_en_feu.set(`${case_a_ajouter.x}:${case_a_ajouter.y}`, case_a_ajouter)
        })
    }

    brule_les_arbres_autour(x, y) {
        for (let i = x - 1; i <= x + 1; i += 1) {
            for (let j = y - 1; j <= y + 1; j += 1) {
                if (i < vraie_map.length && i >= 0 &&
                    j < vraie_map.length && j >= 0 &&
                    vraie_map[i][j] == "arbre" &&
                    Math.floor(Math.random() * 3) % 3 == 0) {
                    vraie_map[i][j] = "feu";
                    this.#cases_a_ajouter_au_feu.push({ x: i, y: j });
                    let elem = document.getElementById(`${i}:${j}`);
                    elem.classList.replace("arbre", "feu");
                }
            }
        }
    }





}