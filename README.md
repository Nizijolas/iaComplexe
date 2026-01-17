# Projet IA Système complexe 2025/2026 M2 MIASHS

### DIJOUD Nicolas , THEVENON Laurent

## 1 - Lancer le projet

Pour lancer notre projet il faut lancer l'index html via un live server (Go live de VSCODE,  Codium etc).  
Ou alors un lancer un serveur web en local depuis la racine du projet par exemple avec Python :

```python
    python3 -m http.server 8000
```

Puis dans un navigateur aller à l'url `http://127.0.0.1:8000/`

## 2 - Faire des simulations

On se retrouve face à une carte en SVG avec une base au centre, des arbres verts, et des anomalies rouges (feux) ainsi que des anomalies jaunes (humains blessés).  
La carte est assombrie et s'éclaircira au fur et à mesures ques les drones decouvriront des cases.  
Les anomalies sont placées aléatoirement à chaque rechargement de la page.
Les feux sont éteints par les drones lorsqu'ils se positionnent dessus en ayant encore du carburant.
Les humains sont sauvés dès qu'ils se trouvent dans le champ de vision d'un drone. A ce moment, le drone appelle des secours qui viennent les sauvés (non visible dans la simulation)
*Ce que l'on nomme 'base' dans le projet c'est le centre de contrôle.*

### Mesures d'efficacité des drones

Pendant la simulation, 3 compteurs sont affichés qui permettent de mesure l'efficacté de la configuration des drones

- Humains sauvés montre combien de personnes ont pu être détectées à temps par les drones pour envoyer des secours
- Humains brulés montre combien de personnes n'ont pas été reprérées à temps par les drones
- Arbres brûlés montre combien d'arbres on pris feu pendant la simulation.

### Paramètres

Il est possible de changer plusieurs paramètres via des inputs range avant de lancer une simulation :  
**La vitesse de propagation** c'est la vitesse de propagation des anomalies de type feu, par défault elle est 0 ( pas de propagation ).  
**Le nombre de drones** on peut mettre de 1 à 20 drones, idéalement mis à 7 pour respecter la consigne.  
**La distance de vision** il s'agit du périmètre de découverte des drones autour d'eux, idéalement mettre une valeur plutôt faible pour plus de pertinence.  
**La vitesse**   il s'agit du temps absolu en ms pour chaque itération de la simulation, donc contre intuitivement plus on met cet input faible plus la simulation sera rapide.  
**Carburant** il s'agit de l'autonomie qu'a chaque drone avant de revenir à la base idéalement mis à 30 pour respecter la consigne.  
**Distance de détection des autres drones** les drones cherchent à s'éviter entre eux pour optimiser l'exploration, ce paramètre sert à régler la distance de detection entre eux.
  
On imagine par exemple que les drones ont des interactions locales entre eux via des ondes, alors qu'ils doivent découvrir l'environnement via des capteurs visuels, c'est pourquoi que la **distance de détection des autres drones** et la **distance de vision** sont deux choses distinctes.

### Faire fonctionner la simulation

Une fois les paramètres sélectionnés,  
Cliquez sur  `lancer  la simulation` , la simulation tournera alors avec la vitesse sélectionnée.  
Vous pouvez  `mettre sur pause` une fois mis sur pause vous pourrez alors `relancer la simulation` ou alors avancer en tour par tour en cliquant sur `avancer d'une itération`.
  
A tout moment vous pouvez réinitialiser et revenir à l'écran de sélection des paramètres pour faire une nouvelle simulation en cliquant sur `Réinitialiser`.

## 3 Structure du projet  

**Le fichier index.html** c'est le point d'entrée du projet et le javaScript va modifier les éléments du dom.  
**Le fichier styles.css** Comme nous fonctionnons avec du SVG pour visualiser la simulation la partie CSS est importante, car nous modifions les classes du SVG au fil de la simulation.  
**Le fichier index.js** sert à gérer la génération de la carte de base, la génération du SVG de base, la gestion des paramètres et des bouttons de lancement.  
**Le fichier Simulation.js** contient la classe qui encapsule la logique d'une simulation , update à chaque itération , propagation ... Une Simulation contient évidemment un Array de Drone. C'est la classe Simulation qui contient la carte du centre de controle mis à jour par chaque drone à chaque fois qu'il revient à la base.  
**Le fichier Drone.js** Probablement le fichier le plus important du projet car il contient la classe Drone qui encapsule la logique d'un drone, et quel comportement et interaction il aura avec l'environnement, la base, les autres drones...  
**Le fichier create_map.js** Un module utilitaire pour générer des tableaux à deux dimensions vides, qui nous servent dans drone.js, index.js, Simulation.js comme structure de donnée pour représenter la carte de la simulation.
