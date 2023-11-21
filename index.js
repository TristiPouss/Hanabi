// Chargement des modules
const express = require('express');
const app = express();
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
const { Server } = require("socket.io");
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/hanabi.html');
});

/*** Gestion des lobbys ***/

/**
 * Classe Lobby
 */
class Lobby {
    static id = 0; 
    static listLobby = [];
    constructor(name, idCreator) {
        Lobby.id++;
        Lobby.listLobby.push(this);

        this.name = name;
        this.creator = idCreator;
        this.littlePlayers = [idCreator];
    }

    addPlayer(id){
        this.littlePlayers.push(id);
    }
    removePlayer(id){
        delete this.littlePlayers[id];
    }
    changeName(name){
        this.name = name;
    }
    launchGame(){
        (this.littlePlayers.length < 2) ? socket.emit("notEnoughPlayers") : socket.emit("launchGame");
    }
};

/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {

    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        while (clients[id]) {
            id = id + "(1)";
        }
        currentID = id;
        clients[currentID] = socket;
        console.log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", id);
        // envoi de la nouvelle liste à tous les clients connectés
        io.sockets.emit("listClient", Object.keys(clients));
    });

    /**
     * Creation de lobby
     */
    socket.on("createLobby", function(name){
        let l = new Lobby(name, currentID);
        // envoi de la nouvelle liste de lobby à tous les clients connectés
        io.socket.emit("listLobby", listLobby);
    });

    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    });

    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });

});