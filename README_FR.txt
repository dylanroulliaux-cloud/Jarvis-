J.A.R.V.I.S. – PROTOTYPE iPHONE v0.1
====================================

CE QUE FAIT CETTE VERSION
- Interface mobile plein écran bleu électrique / argent.
- Conversation de démonstration avec quelques réponses locales.
- Lecture vocale des réponses avec la synthèse vocale du navigateur.
- Sélecteur de mode (automatique, rapide, avancé, local) visuel.
- Mise en cache de l'interface pour la réouvrir hors connexion après un premier chargement.

CE QUI N'EST PAS ENCORE CONNECTÉ
- Mammouth AI : pas encore de connexion API.
- La sélection des modèles n'est pas encore réelle.
- Pas de mémoire persistante avancée.
- Pas d'écoute permanente « Hey JARVIS ».
- La dictée utilise le microphone du clavier iOS (icône micro du clavier).
Cette version est volontairement sans clé API : ne jamais placer une clé secrète dans le JavaScript d'une application web publique.

INSTALLATION SUR IPHONE
Une PWA doit être publiée sur une adresse HTTPS pour être ajoutée à l'écran d'accueil.
Méthode simple avec GitHub Pages :
1. Sur iPhone ou ordinateur, connectez-vous à https://github.com/
2. Créez un nouveau dépôt public nommé jarvis-iphone.
3. Téléversez TOUS les fichiers et le dossier icons de cette archive à la racine du dépôt.
4. Dans le dépôt, ouvrez Settings > Pages.
5. Dans « Build and deployment », choisissez « Deploy from a branch ».
6. Sélectionnez la branche main et le dossier /(root), puis Save.
7. Attendez la publication. GitHub affichera une adresse du type :
   https://VOTRE-PSEUDO.github.io/jarvis-iphone/
8. Sur l'iPhone, ouvrez cette adresse dans Safari.
9. Touchez Partager > Sur l'écran d'accueil > Ajouter.
10. Lancez l'icône JARVIS depuis l'écran d'accueil.

TEST RAPIDE
- Envoyez « Bonjour ».
- Essayez « Qui es-tu ? », « Quelle est la date ? » ou « Aide ».
- Touchez « ÉCOUTER JARVIS » pour entendre la dernière réponse.
- Utilisez le micro du clavier iPhone pour dicter.

ÉTAPE SUIVANTE
Ajouter un petit serveur sécurisé (par exemple FastAPI) qui conserve la clé API Mammouth côté serveur.
L'application iPhone appellera ce serveur HTTPS ; la clé API ne sera jamais intégrée à l'application.
Le serveur pourra ensuite être déplacé sur le Mac mini.
