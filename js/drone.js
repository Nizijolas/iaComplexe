//ici faire la logique pour un drone
import { base, cases_en_feu, evitement, vraie_map } from "./index.js";
export class Drone {

    //Attributs du drone
    #x; //pos x
    #y; //pos y
    #map; //carte individuelle du drone
    #carburant;
    #taille_vision; //distance vision
    #basic_goal; // objectif par défaut
    #simulation; //pour accéder à la positions des rones proches et la carte de la base
    #drone_detection; //distance de détection des drones
    #close_drones = []; //drones proches
    #feux; //feux connus




    constructor(taille_vision, taille_detection, carburant, goalx, goaly, taille_map, x = base.x, y = base.y, simulation) {
        this.#x = x;
        this.#y = y;
        this.#map = this.create_map(taille_map);
        this.#map[base.x][base.y] = 'base';
        this.#taille_vision = taille_vision;
        this.#simulation = simulation; // le drône doit avoir un pointeur de la simulation dans laquelle il est
        this.#drone_detection = taille_detection;
        this.#carburant = carburant + Math.floor(Math.random() * (carburant / 10) - (carburant / 20)); //10% d'aléatoire sur le carburant
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



    play_a_turn() {

        //première chose à faire update la vision, on en profite pour noter les feux à proximité
        let close_fires = this.update_vision();

        //Gérer la fin du carburant
        if (this.#carburant <= 0) {
            this.plus_de_carburant();
            return;
        }

        //Mise à jour des drones proches
        this.#close_drones = this.get_close_drones();


        //Cas prioritaire : le drone est au dessus d'un feu : il l'éteint pendant le tour
        if (vraie_map[this.#x][this.#y] == "feu") {
            this.eteindre_feu();
            return;
        }

        //Sinon, on trouve un bon objectif
        let new_goal = this.find_new_goal(close_fires);
        //On va vers le nouveau but
        this.goto_goal(new_goal);
        this.#carburant -= 1;

    }


    plus_de_carburant() {
        //gestion en cas de de carburant <= 0
        if (this.#y != base.x || this.#x != base.y) {
            //le drone n'est pas à la base, il y va
            this.goto_goal(base);
        }
        else if (this.#carburant <= -10) { //on refill le carburant + on gère l'histoire des maps;
            this.#carburant = 40;
            this.copierInfosManquantesDansCarte();
            this.#map = JSON.parse(JSON.stringify(this.#simulation.mapCentreControle));//clone du tableau ( le clonage classique fonctionne pas pour les tableaux imbriqués..)
        }
        else {
            this.#carburant -= 1; //Il faut pas le faire avant sinon on arrivera à la base on aura déjà -10..
        }
    }

    eteindre_feu() {
        //le drone eteint un feu
        vraie_map[this.#x][this.#y] = "cendres";
        this.#map[this.#x][this.#y] = "cendres";
        let elem = document.getElementById(`${this.#x}:${this.#y}`);
        elem.classList.replace("feu", "cendres");
        cases_en_feu.delete(`${this.#x}:${this.#y}`);
        this.#feux.delete(`${this.#x}:${this.#y}`);
        this.#carburant += -1;
    }


    find_new_goal(close_fires) {
        //1 - on regarde dans close_fires donc les feux à une case de distance
        if (close_fires.length != 0) {
            //on choisir le premier, peu importe on pourrait randomiser si on voulait
            return close_fires[0];
        }
        //2 - on regarde si ya des feux sur la map à plus d'une case
        if (this.#feux.size > 0) {
            return this.feu_le_plus_proche();
        }

        //3 - on regarde si on peut explorer
        let cases_inconnues = this.get_unknwown_tiles(); //cases inconnues proches
        if (cases_inconnues.length > 0) {
            //si il y en a plusieurs, on choisi la plus éloignée d'un autre drone
            let meilleure_case_iconnue = this.get_meilleure_case_inconnue(cases_inconnues);
            return (meilleure_case_iconnue)
        }
        //4 - on regarde si on a une "grande direction" (objectif par défaut), si non, on en demande une
        if (this.#basic_goal == null) {
            this.get_random_goal();
        }
        return this.#basic_goal;
    }


    feu_le_plus_proche() {
        //identifie la position du feu le plus proche du drone
        let distance_min = vraie_map.length * vraie_map.length;
        let feu_le_plus_proche;
        this.#feux.forEach((coord, key) => {
            let distance = this.get_distance_entre({ x: this.#x, y: this.#y }, coord);
            if (distance < distance_min) {
                feu_le_plus_proche = coord;
            }
        });
        return feu_le_plus_proche;
    }

    get_unknwown_tiles() {
        //Trouver les cases non explorées autour de soi, sans drone adjacent
        let unknwown_tiles = [];
        for (let i = this.#x - this.#taille_vision - 1; i <= this.#x + this.#taille_vision + 1; i += 1) {
            for (let j = this.#y - this.#taille_vision - 1; j <= this.#y + this.#taille_vision + 1; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length &&
                    this.#map[i][j] == undefined &&
                    !this.#simulation.drone_closed_to(i, j, this.#taille_vision)) {
                    //La case n'est pas explorée, et pas à côté d'un drone, on l'ajoute
                    unknwown_tiles.push({ x: i, y: j });
                }
            }
        }
        return unknwown_tiles;
    }

    get_meilleure_case_inconnue(cases_inconnues) {
        //renvoie la case inconnue la plus éloignée des autres drones détectés
        let distance_max = 0;
        let meilleures_cases = [cases_inconnues[0]];
        for (let i = 0; i < cases_inconnues.length; i += 1) {
            this.#close_drones.forEach(drone => {
                let distance = this.get_distance_entre(cases_inconnues[i], drone);
                if (distance == distance_max) {
                    meilleures_cases.push(cases_inconnues[i]);
                }
                if (distance > distance_max) {
                    distance_max = distance;
                    meilleures_cases = [cases_inconnues[i]];
                }
            });
        }
        let index = Math.floor(Math.random() * meilleures_cases.length)
        return meilleures_cases[index];
    }




    update_vision() {
        //met à jour la vision du drone en fonction de taille_vision
        let close_fires = []
        for (let i = this.#x - this.#taille_vision; i <= this.#x + this.#taille_vision; i += 1) {
            for (let j = this.#y - this.#taille_vision; j <= this.#y + this.#taille_vision; j += 1) {
                if (i >= 0 && i < this.#map.length &&
                    j >= 0 && j < this.#map.length) {
                    //On met tout à jour, pour pouvoir faire des feux qui grandissent
                    this.#map[i][j] = vraie_map[i][j];
                    //changement de css pour vraie_map
                    let elem = document.getElementById(`${i}:${j}`);
                    elem.classList.remove('inconnu');

                    if (this.#map[i][j] == "feu") {
                        // On l'ajoute si besoin dans les feux que voit ce drone
                        if (!this.#feux.get(`${i}:${j}`)) {
                            this.#feux.set(`${i}:${j}`, { x: i, y: j });
                        }
                        //Si il n'y a pas d'autre drone dessus, on le met dans les feux proches
                        if (evitement == true) {
                            if (!this.#simulation.drone_at(i, j)) {
                                close_fires.push({ x: i, y: j });
                            }
                        }
                    }
                    if (this.#map[i][j] == "cendres" && this.#feux.get(`${i}:${j}`)) {
                        //Un feu est devenu cendres, on le retire de la liste des feux
                        this.#feux.delete(`${i}:${j}`);
                    }
                    if (this.#map[i][j] == "humain") {
                        //On a trouvé un humain avant qu'il soit brûlé alors il est sauvé on transforme la case en arbre
                        this.#map[i][j] = "arbre";
                        vraie_map[i][j] = "arbre"
                        elem.classList.replace("humain", "arbre");
                        this.#simulation.ajouterHumainSauve();
                    }
                }
            }
        }
        return close_fires;
    }


    get_close_drones() {
        //Crée un tableau avec la position des drones aux alentours
        let close_drones = [];
        for (let i = this.#x - this.#drone_detection; i <= this.#x + this.#drone_detection; i += 1) {
            for (let j = this.#y - this.#drone_detection; j <= this.#y + this.#drone_detection; j += 1) {
                if (i >= 0 && i < vraie_map.length &&
                    j >= 0 && j < vraie_map.length) {

                    if (this.#simulation.drone_at(i, j)) {
                        close_drones.push({ x: i, y: j })
                    }
                }
            }
        }
        return close_drones;
    }



    get_random_goal() {
        //on regarde sur la map si il reste des cases inexplorées
        let random_sens = Math.round(Math.random() * 10) % 4; //pour voir dans quel sens on va aller et mettre un peu d'aléatoire

        for (let i = 0; i < this.#map.length && this.#basic_goal == null; i += 1) {
            for (let j = 0; j < this.#map.length && this.#basic_goal == null; j += 1) {
                switch (random_sens) {
                    case 0:
                        if (this.#map[i][j] == undefined) {
                            this.#basic_goal = { x: i, y: j };
                        }
                        break;
                    case 1:
                        if (this.#map[i][this.#map.length - j - 1] == undefined) {
                            this.#basic_goal = { x: i, y: this.#map.length - j - 1 };
                        }
                        break;
                    case 2:
                        if (this.#map[this.#map.length - i - 1][j] == undefined) {
                            this.#basic_goal = { x: this.#map.length - i - 1, y: j };
                        }
                        break;
                    case 3:
                        if (this.#map[this.#map.length - i - 1][this.#map.length - j - 1] == undefined) {
                            this.#basic_goal = { x: this.#map.length - i - 1, y: this.#map.length - j - 1 }
                        }
                        break;
                }
            }
        }
        //si toutes cases ont été explorées, alors on choisi une case au hasard
        if (this.#basic_goal == null) {
            let goal_x = Math.floor(Math.random() * this.#map.length);
            let goal_y = Math.floor(Math.random() * this.#map.length);
            this.#basic_goal = { x: goal_x, y: goal_y };
        }
    }


    goto_goal(meilleurGoal) {
        //Permet de savoir dans quelle direction aller
        if (meilleurGoal.x == this.#x) { //même ligne
            if (meilleurGoal.y < this.#y) {
                this.update_position_with_direction("GAUCHE");
                return;
            } else {
                this.update_position_with_direction("DROITE");
                return;
            }
        }
        if (meilleurGoal.y == this.#y) {//même colonne
            if (meilleurGoal.x < this.#x) {
                this.update_position_with_direction("HAUT");
                return;
            } else {
                this.update_position_with_direction("BAS");
                return;
            }
        }
        //Cas en diagonale
        if (this.#x > meilleurGoal.x && this.#y > meilleurGoal.y) {
            this.update_position_with_direction("HAUT-GAUCHE");
            return;
        }
        if (this.#x > meilleurGoal.x && this.#y < meilleurGoal.y) {
            this.update_position_with_direction("HAUT-DROITE");
            return;
        }
        if (this.#x < meilleurGoal.x && this.#y > meilleurGoal.y) {
            this.update_position_with_direction("BAS-GAUCHE");
            return;
        }
        if (this.#x < meilleurGoal.x && this.#y < meilleurGoal.y) {
            this.update_position_with_direction("BAS-DROITE");
            return;
        }
    }

    update_position_with_direction(direction) {
        //Déplace le drone dans la direction voulue
        let new_x = this.#x;
        let new_y = this.#y
        if (direction.includes("HAUT")) {
            new_x += -1;
        }
        if (direction.includes("BAS")) {
            new_x += 1;
        }
        if (direction.includes("GAUCHE")) {
            new_y += -1;
        }
        if (direction.includes("DROITE")) {
            new_y += 1;
        }

        this.update_position_with_coord(new_x, new_y);
    }



    update_position_with_coord(x, y) {
        //déplace le drone sur les coordonnées (x:y)
        let element_remove = document.getElementById(`${this.#x}:${this.#y}`)
        element_remove.classList.remove("drone");
        this.#x = x; this.#y = y;
        let element_add = document.getElementById(`${this.#x}:${this.#y}`)
        element_add.classList.add("drone");
        if (this.#basic_goal != null && this.#x == this.#basic_goal.x && this.#y == this.#basic_goal.y) {
            this.#basic_goal = null;
        }

    }

    create_map(taille_map) {
        //créée la map individuelle du drone
        let map = new Array(taille_map);
        for (let i = 0; i < taille_map; i += 1) {
            map[i] = new Array(taille_map);
        }
        return map;
    }



    copierInfosManquantesDansCarte() {
        //met à jour la la carte lors du passage à la base
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
                        this.#feux.set(`${i}:${j}`, { x: i, y: j });
                    }
                }
            }
        }
    }

    get_distance_entre(obj1, obj2) {
        //retourne la distance entre deux objets
        let distance_x = Math.abs(obj1.x - obj2.x);
        let distance_y = Math.abs(obj1.y - obj2.y);
        return (Math.max(distance_x, distance_y));
    }
}