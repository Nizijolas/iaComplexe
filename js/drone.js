//ici faire la logique pour un drone
import { vraie_map } from "./index";
import { empty_map } from "./maps/create_map";

export class Drone {

    //Position x & y d'un drône
    #x;
    #y;
    #map;
    #carburant;
    #taille_vision;
    #goal;

    //J'imagine qu'il aura sa propre carte comme attribut.

    constructor(taille_vision, carburant, goal, x = 0, y = 0) {
        this.#x = x;
        this.#y = y;
        this.#map = empty_map();
        this.#taille_vision = taille_vision;
        this.update_vision(taille_vision);
        this.#carburant = carburant;
        this.#goal = goal;
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

    play_a_turn() {
        //ya que ça qui sera appelé de l'exérieur, ça fait jouer son tour au drone

        //TODO Cas à la con : plus de carburant à intégrer

        //Cas prioriataire : le drone est au dessus d'un feu : il l'éteind pendant le tour
        if (vraie_map[this.#x][this.#y] == "feu") {
            vraie_map[this.#x][this.#y] == "cendres"
            this.#carburant += -1;
            return;
        }

        //Mise à jour de sa vision (il n'a pas encore bougé, mais un autre drone a pu éteindre un feu entre temps)
        this.update_vision();
        //Il y a un feu à côté : il va sur lui
        let fire = this.get_close_fire();
        if (fire) {
            this.update_position_with_coord(fire.x, fire.y);
            carburant += -1;
            return;

        }
        //Pas de feu en vue. On gère avec les objectifs
        if (this.#goal == null || this.#goal.score < 5) {
            //pas d'objectif plus important que l'exploration, il faut donc aller dans une direction à explorer aléatoire
            let unknwown_tiles = this.get_unknwown_tiles();
            let random_index = Math.floor(Math.random() * unknwown_tiles.length);
            //Mise à jour de l'objectif
            this.#goal = { x: unknwown_tiles[random_index].x, y: unknwown_tiles[random_index].y, score: 5 };
        }
        this.goto_goal();
        this.#carburant += -1

        //TODO : et si jamais ya que des cases déjà vue ?on remet un objectif random ?
    }


    get_unknwown_tiles() {
        //On regarde les cases non explorées
        let unknwown_tiles = [];
        //parcours de bourrin, mais ça simplifie si on veut changer taille_vision
        for (let i = -(this.#taille_vision + 1); i < this.#taille_vision + 1; i += 1) {
            for (let j = -(this.#taille_vision + 1); j < this / this.#taille_vision + 1; j += 1) {
                if (this.#x + i >= 0 && this.#x + i < this.#map.length &&
                    this.#y + i >= 0 && this.#y + i < this.#map.length &&
                    this.#map[this.#x + i][this.#y + j] == null) {
                    unknwown_tiles.push({ x: this.#x + i, y: this.#y + y });
                }
            }
        }
        return unknwown_tiles;
    }

    update_vision() {
        //met à jour la vision du drone en fonction de taille_vision
        for (let i = - this.#taille_vision; i <= this.#taille_vision; i += 1) {
            for (let j = - this.#taille_vision; j <= this.#taille_vision; j += 1) {

                if (this.#x + i >= 0 && this.#x + i < this.#map.length &&
                    y + j >= 0 && y + j < this.#map.length && this.#map[x + i][y + j] == null) {
                    //On met tout à jour, pour pouvoir faire des feux qui grandissent s on veut plus tard
                    this.#map[x + i][y + j] = vraie_map[x + i][y + j];

                }
            }
        }
    }


    get_close_fire() {
        //Est-ce qu'on voit un feu ?
        let fire_tile;
        for (let i = -1; i <= 1; i += 1) {
            for (let y = -1; y <= 1; y += 1) {
                if (x + i >= 0 && x + i < this.#map.length &&
                    y + j >= 0 && y + j < this.#map.length &&
                    this.#map[x + i][y + j] == "feu") {
                    fire_tile = { x: x + i, u: y + j };
                    return fire_tile;
                }
            }
        }
        return false
    }

    goto_goal() {
        // trouve la direction vers l'objectif
        if (this.#goal.x == this.#x) { //même ligne
            if (this.#goal.y < this.#y) {
                this.update_position_with_direction("GAUCHE");
                return;
            } else {
                update_position_with_direction("DROITE");
                return;
            }
        }
        if (this.#goal.y == this.#y) {//même colonne
            if (this.#goal.x < this.#x) {
                this.update_position_with_direction("BAS");
                return;
            } else {
                this.update_position_with_direction("HAUT");
                return;
            }
        }
        //Et là les cas relous en diagonale
        if (this.#x > this.#goal.x && this.#y > this.#goal.y) {
            this.update_position_with_direction("HAUT-GAUCHE");
            return;
        }
        if (this.#x > this.#goal.x && this.#y < this.#goal.y) {
            this.update_position_with_direction("BAS-GAUCHE");
            return;
        }
        if (this.#x < this.#goal.x && this.#y > this.#goal.y) {
            this.update_position_with_direction("BAS-DROITE");
            return;
        }
        if (this.#x < this.#goal.x && this.#y < this.#goal.y) {
            this.update_position_with_direction("HAUT-DROITE");
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
        document.getElementById(`${this.#x}:${this.#y}`).classList.remove("drone");
        this.#x = new_x; this.#y = new_y;
        document.getElementById(`${this.#x}:${this.#y}`).classList.add("drone");
    }



    update_position_with_coord(x, y) {
        document.getElementById(`${this.#x}:${this.#y}`).classList.remove("drone");
        this.#x = x; this.#y = y;
        document.getElementById(`${this.#x}:${this.#y}`).classList.add("drone");
        if (goal && this.#x == this.#goal.x && this.#y == this.#goal.y) {
            this.#goal == null;
        }
    }
}