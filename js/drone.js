
//ici faire la logique pour un drone
export class Drone{
    
    
    //Position x & y d'un drône
    #x;
    #y;

    //J'imagine qu'il aura sa propre carte comme attribut.
    
    constructor(x, y){
        this.#x = x;
        this.#y = y;
    }

    get x(){
        return this.#x
    }

    get y() {
        return this.#y
    }

    set x(x){
        this.#x = x;
    }

    set y(y){
        this.#y = y;
    }
}