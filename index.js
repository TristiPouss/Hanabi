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
let lobbys = [];

class Lobby {
    constructor(name) {
        lobbys.push(this);
        this.name = name;
        this.players = [];
    }

    getPlayers() {
        return this.players;
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
        // envoi aux autres clients
        socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );
        // envoi de la nouvelle liste à tous les clients connectés
        io.sockets.emit("liste", Object.keys(clients));
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