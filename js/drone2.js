//ici faire la logique pour un drone
import { base, cases_en_feu, vraie_map } from "./index.js";
export class Drone {

    //Position x & y d'un drône
    #x;
    #y;
    #map;
    #carburant;
    #taille_vision;
    #basic_goal;
    #simulation;
    #drone_detection;
    #close_drones = [];
    #feux;



    constructor(taille_vision, taille_detection, carburant, goalx, goaly, taille_map, x = base.x, y = base.y, simulation) {
        this.#x = x;
        this.#y = y;
        this.#map = this.create_map(taille_map);
        this.#map[base.y][base.x] = 'base';
        this.#taille_vision = taille_vision;
        this.#simulation = simulation; // le drône doit avoir un pointeur de la simulation dans laquelle il est
        this.#drone_detection = taille_detection;
        this.#carburant = carburant + Math.floor(Math.random() * (carburant / 10));
        this.#basic_goal = { x: goalx, y: goaly };
        this.#feux = new Map();
        this.update_vision(taille_vision);

    }

    get x() {
        return this.#x
    }

    get y() {
        return this.#y
    }

    set x(x) {
        this.#x = x;
    }

    set y(y) {
        this.#y = y;
    }

    set close_drones(close_drones) {
        this.#close_drones = close_drones
    }

    play_a_turn() {

        //première chose à faire update la vision, on en profite pour noter les feux à proximité
        let close_fire = this.update_vision();

        //Gérer la fin du carburant
        if (this.#carburant == 0) {
            this.plus_de_carburant();
            return;
        }

        //Mise à jour des drones proches
        this.#close_drones = this.get_close_drones();


        //Cas prioritaire : le drone est au dessus d'un feu : il l'éteint pendant le tour
        if (vraie_map[this.#y][this.#x] == "feu") {
            this.eteindre_feu();
            return;
        }

        //Sinon, on trouve un bon objectif
        let new_goal = this.find_new_goal(close_fire);
        //On va vers le nouveau but
        this.goto_goal(new_goal);
        carburant -= 1;

    }


    plus_de_carburant() {
        if (this.#x != base.x || this.#y != base.y) {
            this.update_position_with_coord(base.x, base.y)
        }
        else { //on refill le carburant + on gère l'histoire des maps;
            this.#carburant = 40;
            this.copierInfosManquantesDansCarte();
            this.#map = JSON.parse(JSON.stringify(this.#simulation.mapCentreControle));//clone du tableau ( le clonage classique fonctionne pas pour les tableaux imbriqués..)
        }
    }

    eteindre_feu() {
        vraie_map[this.#y][this.#x] = "cendres";
        this.#map[this.#y][this.#x] = "cendres";
        let elem = document.getElementById(`${this.#x}:${this.#y}`);
        elem.classList.replace("feu", "cendres");
        cases_en_feu.delete(`${this.#x}:${this.#y}`);
        this.#carburant += -1;
    }


    find_new_goal(close_fire) {
        //1 - on regarde dans close_fire
        if (close_fire.length != 0) {
            //on choisir le premier, peut importe on pourrait randomiser si on voulait
            return close_fire[0];
        }
        //2 - on regarde si ya des feux sur la map à plus d'une case
        if (this.#feux.size > 0) {
            return this.feu_le_plus_proche();
        }
        //3 - on regarde si on peut explorer
        let cases_inconnues = this.get_unknwown_tiles();
        if (cases_inconnues.length > 0) {
            //si il y en a plusieurs, on choisi la plus éloignée d'un autre drone
            let meilleure_case_iconnue = this.get_meilleure_case_inconnue(cases_inconnues);
            return (meilleure_case_iconnue)
        }
        //4 - on regarde si on a une "grande direction" (goal de base), si non, on en demande une
        if (this.#basic_goal == null) {
            this.get_random_goal();
        }
        return this.#basic_goal;
    }


    feu_le_plus_proche() {
        let distance_min = vraie_map.length * vraie_map.length;
        let feu_le_plus_proche;
        this.#feux.forEach((value, coord) => {
            let distance = this.get_distance_entre({ x: this.#x, y: this.#y }, coord);
            if (distance < distance_min) {
                feu_le_plus_proche = coord;
            }
        });

        return feu_le_plus_proche;
    }

    get_unknwown_tiles() {
        //On regarde les cases non explorées autour de soi
        let unknwown_tiles = [];

        //parcours de bourrin, mais ça simplifie si on veut changer taille_vision
        for (let i = this.#y - this.#taille_vision - 1; i <= this.#y + this.#taille_vision + 1; i += 1) {
            for (let j = this.#x - this.#taille_vision - 1; j <= this.#x + this.#taille_vision + 1; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length &&
                    this.#map[i][j] == undefined &&
                    !this.#simulation.drone_at({})) {
                    //La case n'est pas explorée, et pas occupé par un drone, on l'ajoute
                    unknwown_tiles.push({ x: j, y: i });
                }
            }
        }
        return unknwown_tiles;
    }

    get_meilleure_case_inconnue(cases_inconnues) {
        let distance_max = 0;
        let meilleure_case = cases_inconnues[0];
        for (let i = 0; i < cases_inconnues.length; i += 1) {
            this.#close_drones.forEach(drone => {
                let distance = this.get_distance_entre(cases_inconnues[i], drone);
                if (distance > distance_max) {
                    distance_max = distance;
                    meilleure_case = cases_inconnues[i];
                }
            });
        }
        return meilleure_case;
    }




    update_vision() {
        //met à jour la vision du drone en fonction de taille_vision
        let close_fire = []
        for (let i = this.#y - this.#taille_vision; i <= this.#y + this.#taille_vision; i += 1) {
            for (let j = this.#x - this.#taille_vision; j <= this.#x + this.#taille_vision; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length) {

                    //On met tout à jour, pour pouvoir faire des feux qui grandissent
                    this.#map[i][j] = vraie_map[i][j];
                    //changement de css pour vraie_map
                    let elem = document.getElementById(`${j}:${i}`);
                    elem.classList.remove('inconnu');

                    if (this.#map[i][j] == "feu") {
                        // On l'ajoute si besoin dans les feux que voit ce drone
                        if (!this.#feux.get({})) {
                            this.#feux.set({}, true);
                        }
                        //Si il n'y a pas d'autre drone dessus, on le met dans les feux proches
                        if (!this.#simulation.drone_at({})) {
                            close_fire.push({});
                        }
                    }
                    if (this.#map[i][j] == "cendres" && this.#feux.get({})) {
                        //Un feu est devenu cendres, on le retire de la liste des feux
                        this.#feux.delete({});
                    }
                }
            }
        }
        return close_fire;
    }


    get_close_drones() {
        //Crée un tableau avec la position des drones aux alentours
        let close_drones = [];
        for (let i = this.#x - this.#drone_detection; i <= this.#x + this.#drone_detection; i += 1) {
            for (let j = this.#y - this.#drone_detection; j <= this.#y + this.#drone_detection; j += 1) {
                if (i >= 0 && i < vraie_map.length &&
                    j >= 0 && j < vraie_map.length) {
                    if (this.#simulation.drone_at(this.#x, this.#y)) {
                        close_drones.push({ x: i, y: j })
                    }
                }
            }
        }
        return close_drones;
    }



    get_random_goal() {
        //on regarde sur la map si il reste des cases inexplorées
        let random_sens = Math.round(Math.random() * 10) % 4; //pour voir dans quel sens on va aller
        console.log(`random sens = ${random_sens}`)

        for (let i = 0; i < this.#map.length && this.#basic_goal != null; i += 1) {
            for (let j = 0; j < this.#map.length && this.#basic_goal != null; j += 1) {
                switch (random_sens) {
                    case 0:
                        if (this.#map[i][j] == undefined) {
                            this.#basic_goal = { x: j, y: i };
                        }
                        break;
                    case 1:
                        if (this.#map[i][this.#map.length - j - 1] == undefined) {
                            this.#basic_goal = { x: j, y: i };
                        }
                        break;
                    case 2:
                        if (this.#map[this.#map.length - i - 1][j] == undefined) {
                            this.#basic_goal = { x: j, y: i };
                        }
                        break;
                    case 3:
                        if (this.#map[this.#map.length - i - 1][this.#map.length - j - 1] == undefined) {
                            this.#basic_goal = { x: j, y: i }
                        }
                        break;
                }
            }
        }
        if (this.#basic_goal == null) {
            let goal_x = Math.floor(Math.random() * this.#map.length);
            let goal_y = Math.floor(Math.random() * this.#map.length);
            this.#basic_goal = { x: goal_x, y: goal_y };
        }
    }


    goto_goal() {
        let meilleurGoal = this.getMeilleurGoal();
        if (!meilleurGoal) {
            return
        }

        if (meilleurGoal.y == this.#y) { //même ligne
            if (meilleurGoal.x < this.#x) {
                this.update_position_with_direction("GAUCHE");
                return;
            } else {
                this.update_position_with_direction("DROITE");
                return;
            }
        }
        if (meilleurGoal.x == this.#x) {//même colonne
            if (meilleurGoal.y < this.#y) {
                this.update_position_with_direction("HAUT");
                return;
            } else {
                this.update_position_with_direction("BAS");
                return;
            }
        }
        //Et là les cas relous en diagonale
        if (this.#y > meilleurGoal.y && this.#x > meilleurGoal.x) {
            this.update_position_with_direction("HAUT-GAUCHE");
            return;
        }
        if (this.#y > meilleurGoal.y && this.#x < meilleurGoal.x) {
            this.update_position_with_direction("HAUT-DROITE");
            return;
        }
        if (this.#y < meilleurGoal.y && this.#x > meilleurGoal.x) {
            this.update_position_with_direction("BAS-GAUCHE");
            return;
        }
        if (this.#y < meilleurGoal.y && this.#x < meilleurGoal.x) {
            this.update_position_with_direction("BAS-DROITE");
            return;
        }
    }

    update_position_with_direction(direction) {
        let new_x = this.#x;
        let new_y = this.#y
        if (direction.includes("HAUT")) {
            new_y += -1;
        }
        if (direction.includes("BAS")) {
            new_y += 1;
        }
        if (direction.includes("GAUCHE")) {
            new_x += -1;
        }
        if (direction.includes("DROITE")) {
            new_x += 1;
        }
        let element_remove = document.getElementById(`${this.#x}:${this.#y}`)
        element_remove.classList.remove("drone");
        this.#x = new_x; this.#y = new_y;
        let element_add = document.getElementById(`${this.#x}:${this.#y}`)
        element_add.classList.add("drone");
    }



    update_position_with_coord(x, y) {

        let element_remove = document.getElementById(`${this.#x}:${this.#y}`)
        element_remove.classList.remove("drone");
        this.#x = x; this.#y = y;
        let element_add = document.getElementById(`${this.#x}:${this.#y}`)
        element_add.classList.add("drone");

    }

    create_map(taille_map) {
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        return map;
    }



    copierInfosManquantesDansCarte() {
        //reset de la map des feux
        this.#feux = new Map();
        for (let i = 0; i < vraie_map.length; i++) {
            for (let j = 0; j < vraie_map.length; j++) {
                if (this.#map[i][j]) { //infos nouvelles dans la map du drone
                    if (this.#simulation.mapCentreControle[i][j] == undefined) { //La case n'avais pas encore été découverte
                        this.#simulation.casesConnues += 1;
                    }
                    //dans tous les cas on met à jour
                    this.#simulation.mapCentreControle[i][j] = this.#map[i][j];

                    //Mise à jour de la map des feux
                    if (this.#simulation.mapCentreControle[i][j] == "feu") {
                        this.#feux.set({}, true);
                    }
                }
            }
        }
    }

    get_distance_entre(obj1, obj2) {
        //retourne la distance entre deux objets
        let distance_x = Math.abs(obj1.x - obj2);
        let distance_y = Math.abs(obj1.y - obj2.y);
        return (Math.max(distance_x, distance_y));
    }
}