import { Drone } from "./drone.js";
import { vraie_map} from "./index.js";

//pas dans une instance pour pouvoir l'appeller depuis drône qui ne connait pas l'instance de la Simulation hôte (ou alors faudrait lui passer dans le constructeur)
export let casesConnus = 1; //1 la base
export let anomaliesTraitees = 0;


export class Simulation {

    #drones = []; // tableau de drones
    #carteCentreControle;
    #casesConnues;

    constructor() {
        for (let i = 0; i < 7; i++) { //création des 7 drônes
            var drone = new Drone(1, 40, 39, 39, vraie_map.length, 0, 0, this)
            this.#drones.push(drone);
        }
        this.#casesConnues = 1; //la base est connue
        this.#carteCentreControle =  this.create_map(vraie_map.length);
    }

    create_map(taille_map) {
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        map[0][0] = "base"
        return map;
    }

    update(){
        this.#drones.forEach( d => d.play_a_turn());
    }

    set casesConnues(x){
        this.#casesConnues = x;
    }

    get casesConnuesConnues(){
        return this.#casesConnues;
    }

    get mapCentreControle(){
        return this.#carteCentreControle;
    }
    
    set mapCentreControle(x){
        this.#carteCentreControle =  x;
    }

  
    

}