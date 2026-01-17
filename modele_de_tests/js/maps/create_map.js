export function empty_map(tailleMap) {
    //Retourne une map vide
    var map = new Array(tailleMap);
    for (let i = 0; i < tailleMap; i += 1) {
        map[i] = new Array(tailleMap);
    }

    return empty_map();
}