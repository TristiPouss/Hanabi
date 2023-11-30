// Chargement des modules
const express = require('express');
const game = require('./public/js/card.js');
const app = express();
const port = 8080;
const server = app.listen(port, function() {
    console.log("C'est parti ! En attente de connexion sur le port "+port+"...");
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

let lobbyArray = [];

class Lobby {
    name;
    creator;
    littlePlayers;
    currGame;
    constructor(n, id){
        this.name = n;
        this.creator = id;
        this.littlePlayers = [id];
        lobbyArray.push(this);
    }

    addPlayer(n){
        return this.littlePlayers.push(n);
    }

    launchGame(){
        this.currGame = new game.Game(this.littlePlayers);
    }

    getClients(){
        let res = [];
        this.littlePlayers.forEach(player => {
            Object.keys(clients).forEach(client => {
                if(player == client){
                    res.push(client);
                }
            })
        });
        return res;
    }

    rmPlayer(n){
        if(n == this.creator){
            this.getClients().forEach(client => {
                clients[client].emit("closingLobby");
                clients[client].emit("resetHTMLL");
            });
        }
        const index = this.littlePlayers.indexOf(n);
            if (index > -1) { // only splice array when item is found
                this.littlePlayers.splice(index, 1); // 2nd parameter means remove one item only
                return true;
            }
        return false;
    }
}


class GameData {
    constructor(Lobby,Player){
        this.playersCards = {};
        this.nb_card = Lobby.currGame.hands[Player].length;
        this.nb_hints = Lobby.currGame.hints;
        this.nb_fails = Lobby.currGame.fails
        Object.keys(Lobby.currGame.hands).forEach(clientName => {
            if (clientName != Player){
                this.playersCards[clientName] = Lobby.currGame.hands[clientName];
            }
        });
    }
}
/*** Misc ***/

function seekLobby(name){
    let res = null;
    lobbyArray.forEach(lobby => {
        if(lobby.name == name){
            res = lobby;
        }
    });
    return res;
}

function checkLobby(){
    lobbyArray.forEach(l => {
        if(l.littlePlayers.length == 0){
            const index = lobbyArray.indexOf(l);
            if (index > -1) { // only splice array when item is found
                lobbyArray.splice(index, 1); // 2nd parameter means remove one item only
            }
            console.log("Suppresion du lobby :" + l.name);
        }
    });
}

/*** Log msg ***/

class Log{
    isLobby;
    text;
    date;
    constructor(isLobby, text, date){
        this.isLobby = isLobby;
        this.text = text;
        this.date = date;
    }
}

/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    socket.emit("reset");

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
        // envoi de la nouvelle liste à tous les clients connectés
        io.sockets.emit("listClient", Object.keys(clients));
        // envoi de la liste de lobby à ce client
        socket.emit("listLobby", JSON.stringify(lobbyArray));
    });

    /**
     * Creation de lobby
     */
    socket.on("createLobby", function(name){
        while(seekLobby(name) != null){
            name = name + "(1)";
        }
        let l = new Lobby(name, currentID);
        console.log("Nouveau lobby : " + name);
        sendLogToLobby(seekLobby(name), true, "Le lobby a bien été créé.");
        // envoi de la nouvelle liste de lobby à tous les clients connectés
        io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
    });

    socket.on("connectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            lobby.addPlayer(currentID);
            sendLogToLobby(lobby, true, currentID + " a rejoint le lobby.");
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("Erreur dans la recherche du lobby.");}
    });

    /**
     *  Gestion des déconnexions
     */

    // Déconnexion du lobby
    socket.on("disconnectLobby", function(name){
        let lobby = seekLobby(name);
        if(lobby != null){
            if(lobby.creator == currentID){ // Si l'utilisateur était l'hôte, on ferme le lobby
                lobby.getClients().forEach(client => {
                    if (client != currentID){
                        clients[client].emit("closingLobby");
                        clients[client].emit("resetHTMLL");
                        sendLogToLobby(lobby, true, client + " a quitté le lobby.");
                    }
                });
            }
            //
            disconnectFromAllLobby(currentID);
            checkLobby(); // supprime le lobby si il est vide
            // envoi de la nouvelle liste de lobby à tous les clients connectés
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
        }else{console.log("Erreur dans la recherche du lobby.");}
    });

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // déconnexion du lobby
            disconnectFromAllLobby(currentID);
            checkLobby();
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
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
            // déconnexion du lobby
            disconnectFromAllLobby(currentID);
            checkLobby();
            io.sockets.emit("listLobby", JSON.stringify(lobbyArray));
            // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        console.log("Client déconnecté");
    });

    /*** Misc ***/

    function sendLogToLobby(lobby, isLobby, txt){
        lobby.getClients().forEach(client => {
            if(client != currentID){
                clients[client].emit("log", JSON.stringify(new Log(isLobby, txt, Date.now())));
                console.log("Envoi d'un message au lobby " + lobby.name);
            }
        });
    }

    function disconnectFromAllLobby(id){
        lobbyArray.forEach(lobby => {
            if(lobby.rmPlayer(id)){
                sendLogToLobby(lobby, true, currentID + " a quitté le lobby.");
            };
        })
    }

    /*
     * Gestion du jeu
     */
    socket.on("launchGame", function(res){
        let lobby = seekLobby(res.lobbyName);
        if(lobby != null && lobby.creator == res.idEmit){ // L'id de l'émetteur est forcément currentID
            lobby.launchGame();
            lobby.getClients().forEach(client => {
                let data = new GameData(lobby,client);
                clients[client].emit("launchGame", JSON.stringify(data));
            });
        }else{console.log("Erreur dans la recherche du lobby.");}
    });

    socket.on("hint", function(res){
        let lobby = seekLobby(res.lobbyName);
        if(lobby != null && lobby.creator == res.idEmit){ // L'id de l'émetteur est forcément currentID
            game.give_information(res.idPlayer, res.value);
        }else{console.log("Erreur dans la recherche du lobby.");}
    });


    socket.on("discard", function(res){
        let lobby = seekLobby(res.lobbyName);
        if(lobby != null && lobby.creator == res.idEmit){ // L'id de l'émetteur est forcément currentID
            game.discard_card(res.idPlayer, res.card);
        }else{console.log("Erreur dans la recherche du lobby.");}
    });


    socket.on("play", function(res){
        let lobby = seekLobby(res.lobbyName);
        if(lobby != null && lobby.creator == res.idEmit){ // L'id de l'émetteur est forcément currentID
            game.play_card(res.idPlayer, res.indexCard, res.indexStack)
        }else{console.log("Erreur dans la recherche du lobby.");}
    });
});