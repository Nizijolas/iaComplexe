import { Drone } from "./drone.js";
import { vraie_map } from "./index.js";


export class Simulation {

    #drones = []; // tableau de drones



    constructor() {
        for (let i = 0; i < 7; i++) { //création des 7 drônes
            var drone = new Drone(1, 30, 39, 39, vraie_map.length)
            this.#drones.push(drone);
        }
    }

    update(){
        this.#drones.forEach( d => d.play_a_turn());
    }

}