export function empty_map(tailleMap) {
    //On crée une map vide avec juste la base définie
    var map = new Array(tailleMap);
    console.log("ici")
    console.log(tailleMap);
    console.log(map)
    for (let i = 0; i < tailleMap; i += 1) {
        map[i] = new Array(tailleMap);
    }
    //console.log(map)
    map[0][0] = "base";
    return empty_map();
}