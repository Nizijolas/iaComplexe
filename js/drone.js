//ici faire la logique pour un drone
import { base, cases_en_feu, vraie_map } from "./index.js";
export class Drone {

    //Position x & y d'un drône
    #x;
    #y;
    #map;
    #carburant;
    #taille_vision;
    #goal;
    #simulation;
    #drone_detection;
    #close_drones = [];



    constructor(taille_vision, taille_detection, carburant, goalx, goaly, taille_map, x = base.x, y = base.y, simulation) {
        this.#x = x;
        this.#y = y;
        this.#map = this.create_map(taille_map);
        this.#taille_vision = taille_vision;
        this.#simulation = simulation; // le drône doit avoir un pointeur de la simulation dans laquelle il est
        this.update_vision(taille_vision);
        this.#carburant = carburant + Math.floor(Math.random() * (carburant / 10));
        this.#goal = []; // j'ai transformé en tableau
        this.#goal.push({ x: goalx, y: goaly, score: 2 });
        this.#drone_detection = taille_detection;
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
        console.log(`Drone : my coords are : ${this.#x}:${this.#y}`)
        //ya que ça qui sera appelé de l'exérieur, ça fait jouer son tour au drone
        //TODO Cas à la con : plus de carburant à intégrer ----------------------------------------
        if (this.#carburant == 0) {
            if (this.#x != base.x || this.#y != base.y) {
                this.#goal.push({ x: base.x, y: base.y, score: 10 });
                this.update_vision();// -> il faut quand même update la vision en rentrant
                this.goto_goal();
                return;
            }
            else { //on refill le carburant + on gère l'histoire des maps;
                this.#carburant = 40;
                this.retirerCaseDeGoal(base.x, base.y);
                if (this.#simulation) { // si on fait test avec drone seul il n'y a pas d'instance de simulation
                    this.copierInfosManquantesDansCarte();
                    this.#map = JSON.parse(JSON.stringify(this.#simulation.mapCentreControle));//clone du tableau ( le clonage classique fonctionne pas pour les tableaux imbriqués..)
                }
                return;
            }
        }
        //----------------------------------------------------------------------------------------------
        //Mise à jour de sa vision (il n'a pas encore bougé, mais un autre drone a pu éteindre un feu entre temps)
        this.update_vision();
        this.#close_drones = this.get_close_drones();
        //Retirer les feux déjà traiter des goals ( il le sait via sa map pour éviter conflit avec autres drones )
        this.retirerFeuDejaTraiteDeGoal();

        //Cas prioritaire : le drone est au dessus d'un feu : il l'éteint pendant le tour
        if (vraie_map[this.#y][this.#x] == "feu") {
            vraie_map[this.#y][this.#x] = "cendres";
            this.#map[this.#y][this.#x] = "cendres";
            this.retirerCaseDeGoal(this.#x, this.#y);
            let elem = document.getElementById(`${this.#x}:${this.#y}`);
            elem.classList.replace("feu", "cendres");
            cases_en_feu.delete(`${this.#x}:${this.#y}`);
            this.#carburant += -1;
            return;
        }


        //Il y a un feu à côté : il va sur lui
        let fire = this.get_close_fire();
        if (fire) {
            this.update_position_with_coord(fire.x, fire.y);
            this.#carburant += -1;
            return;

        }

        if (this.#goal.filter(g => g.score >= 8).length == 0) {
            //si on a pas déjà d'objectif de niveau feu on regarde sur notre map si on en connait un
            this.ajouterFeuAGoal();
        }

        // On rentre dans le if si on a aucune case à explorer et aucun feu en vue 
        if (this.#goal.filter(g => g.score >= 5).length == 0) {
            //pas d'objectif plus important que l'exploration, il faut donc aller dans une direction à explorer aléatoire
            let unknwown_tiles = this.get_unknwown_tiles();
            //Mise à jour de l'objectif
            if (unknwown_tiles.length != 0) {  //car l'objectif par défaut 39 39 déjà dans tableau goal
                let random_index = Math.floor(Math.random() * unknwown_tiles.length);
                this.#goal.push({ x: unknwown_tiles[random_index].x, y: unknwown_tiles[random_index].y, score: 5 });
            }
            if (this.#goal.length == 0) { //plus d'objectif, mais la map est toujours pas complètement explorée on choisi un objectif un peu au pif
                this.add_random_goal();
            }
        }
        this.goto_goal(); //goto goal => peu être un feu ou de l'exploration
        this.#carburant += -1;
        this.retirerCaseDeGoal(this.#x, this.#y);

    }


    get_unknwown_tiles() {
        //On regarde les cases non explorées autour de soi
        let unknwown_tiles = [];

        //parcours de bourrin, mais ça simplifie si on veut changer taille_vision
        for (let i = this.#y - this.#taille_vision - 1; i <= this.#y + this.#taille_vision + 1; i += 1) {
            for (let j = this.#x - this.#taille_vision - 1; j <= this.#x + this.#taille_vision + 1; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length &&
                    this.#map[i][j] == undefined) {
                    unknwown_tiles.push({ x: j, y: i });
                }
            }
        }
        return unknwown_tiles;
    }

    update_vision() {
        //met à jour la vision du drone en fonction de taille_vision
        for (let i = this.#y - this.#taille_vision; i <= this.#y + this.#taille_vision; i += 1) {
            for (let j = this.#x - this.#taille_vision; j <= this.#x + this.#taille_vision; j += 1) {

                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length) {
                    if (this.#map[i][j] == null) {
                        //On met tout à jour, pour pouvoir faire des feux qui grandissent s on veut plus tard
                        this.#map[i][j] = vraie_map[i][j];
                        //changement de css pour vraie_map
                        let elem = document.getElementById(`${j}:${i}`);
                        elem.classList.remove('inconnu');
                                                            // HALTE LA
                        this.#simulation.casesConnues += 1; //<----Est ce que ça va pas créer des problèmes parce que chaque drône peut découvrir la même case et donc on atteint plus rapidemment que prévu caseConnues ? 
                      
                    }
                    else { // la case est déjà connue on la met à jour si feu devenu cendre ou propagation plus tard
                        this.#map[i][j] = vraie_map[i][j];
                    }

                }
            }
        }
    }

    get_close_drones() {
        //Crée un tableau avec la position des drones aux alentours
        let close_drones = [];
        for (let i = this.#y - this.#drone_detection; i <= this.#y + this.#drone_detection; i += 1) {
            for (let j = this.#x - this.#drone_detection; j <= this.#x + this.#drone_detection; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length &&
                    vraie_map[i][j] == 'drone') {
                    close_drones.push({ x: i, y: j });
                }
            }
        }
        return close_drones;
    }


    get_close_fire() {
        //Est-ce qu'on voit un feu ?
        let fire_tile;
        for (let i = -1; i <= 1; i += 1) {
            for (let j = -1; j <= 1; j += 1) {
                if (this.#y + i >= 0 && this.#y + i < this.#map.length &&
                    this.#x + j >= 0 && this.#x + j < this.#map.length &&
                    this.#map[this.#y + i][this.#x + j] == "feu") {
                    fire_tile = { x: this.#x + j, y: this.#y + i };
                    return fire_tile;
                }
            }
        }
        return false
    }

    add_random_goal() {
        //on regarde sur la map si il reste des cases inexplorées
        let random_sens = Math.round(Math.random()) % 2 == 0 ? true : false; //pour voir si on parcours ligne ou colonnes
        for (let i = this.#map.length - 1; i >= 0 && this.#goal.length == 0; i += -1) {
            for (let j = this.#map.length - 1; j >= 0 && this.#goal.length == 0; j += -1) {
                if (random_sens && this.#map[i][j] == undefined) {
                    this.#goal.push({ x: i, y: j, score: 4 })
                } else if (!random_sens && this.#map[j][i] == undefined) {
                    this.#goal.push({ x: j, y: i, score: 4 })
                }
            }
        }
    }


    goto_goal() {
        let meilleurGoal = this.getMeilleurGoal();
        console.log(meilleurGoal);
        if (!meilleurGoal) {       
            console.log("over");
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
        //Si on est sur l'objectif alors on le reset
        let meilleurGoal = this.getMeilleurGoal();
        if (meilleurGoal && this.#x == meilleurGoal.x && this.#y == meilleurGoal.y) {
            this.retirerCaseDeGoal(meilleurGoal.x, meilleurGoal.y);
        }
    }

    create_map(taille_map) {
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        map[0][0] = "base"
        return map;
    }

    getMeilleurGoal() {
        if (this.#goal.length <= 1) { //un ou  zéro goal on se complique pas la tache
            return this.#goal[0];
        }
        let goalSorted = this.#goal.sort((g1, g2) => g2.score - g1.score);
        let only_bests_goals = goalSorted.filter((g) => g.score == goalSorted[0].score); //array avec juste les meilleurs scores

        if (only_bests_goals / length == 1) { //on seul meilleur score, on return
            return only_bests_goals[0];
        }
        let max_drone_distance = 0;
        let meilleurGoal = only_bests_goals[0];
        //On check tous les goals par rapport aux drones connus, et on choisi celui qui est le plus éloigné d'un drone.
        only_bests_goals.forEach(goal => {
            this.#close_drones.forEach(drone => {
                let distance = this.get_distance_entre(goal, drone)
                if (max_drone_distance < distance ||
                    (max_drone_distance == distance && Math.round(Math.random()) % 2 == 1)) {   //On rajoute un poil d'aléa en cas d'égalité pour éviter des effets de bord surtout au début
                    max_drone_distance = distance;
                    meilleurGoal = goal;
                }
            });
        });
        return meilleurGoal;
    }

    ajouterFeuAGoal() { //on ajoute des feux (pas forcément proche) connu à goal 
        for (let i = 0; i < vraie_map.length; i++) {
            for (let j = 0; j < vraie_map.length; j++) {
                if (this.#map[i][j] == "feu") {
                    console.log("Ben y'a un feu");
                    this.#goal.push({ x: j, y: i, score: 8 });
                    return;
                }
            }
        }
    }

    retirerCaseDeGoal(x, y) {

        this.#goal = this.#goal.filter(g => {
            return g.x != x || g.y != y;
        }); //on garde que les g dont g.x ou g.y est différent du x, y passé en paramètre

    }

    retirerFeuDejaTraiteDeGoal() { //on retire les goals dont la case correspondante est à cendre
        this.#goal = this.#goal.filter(g => {
            return this.#map[g.y][g.x] != "cendres";
        });

    }

    copierInfosManquantesDansCarte() {
        for (let i = 0; i < vraie_map.length; i++) {
            for (let j = 0; j < vraie_map.length; j++) {
                if (!this.#simulation.mapCentreControle[i][j] && this.#map[i][j]) // si cette case est undefined dans centreControle, mais defined dans drone
                    this.#simulation.mapCentreControle[i][j] = this.#map[i][j];
                if (this.#simulation.mapCentreControle[i][j] == "feu" && this.#map[i][j] == "cendres")//le feu a été traité
                    this.#simulation.mapCentreControle[i][j] = "cendres";
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