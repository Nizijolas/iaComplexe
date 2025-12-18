export function empty_map(tailleMap) {
    //On crée une map vide avec juste la base définie
    var map = new Array(tailleMap);
    for (let i = 0; i < tailleMap; i += 1) {
        map[i] = new Array(tailleMap);
    }
    map[0][0] = "base";
    return empty_map();
}