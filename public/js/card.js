
"use strict";


class Card {
    #value;
    #color;
    constructor(value, color) {
        this.#value = value;
        this.#color = color;
    }

    get_value() {
        return this.#value;
    }

    get_color() {
        return this.#color;
    }

    set_value(value) {
        this.#value = value;
    }

    set_color(color) {
        this.#color = color;
    }
}

class Deck {
    static colors = ["red", "blue", "green", "yellow", "white"];
    static values = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5];
    constructor() {
        this.reset();
        this.shuffle();
    }

    reset(){
        this.cards = new Array();
        Deck.colors.forEach(color => {
            Deck.values.forEach(value => {
                this.cards.push(new Card(value, color));
            });
        });
    }


    //Implementation of the Fisher-Yates Shuffle - https://bost.ocks.org/mike/shuffle/
    shuffle() {
        let curr = this.cards.length;
        let rand;
        // While there remain elements to shuffle.
        while (curr > 0) {
          // Pick a remaining element.
          rand = Math.floor(Math.random() * curr);
          curr--;
          // And swap it with the current element.
          [this.cards[curr], this.cards[rand]] = [
            this.cards[rand], this.cards[curr]];
        }
    }
}
class Game{
    constructor(players_list){
        this.deck = new Deck();
        this.masters_players = players_list;
        this.hands = {};
        this.stacks = [new Array(5), new Array(5), new Array(5), new Array(5), new Array(5)];
        this.discard = new Array();
        this.hints = 8;
        this.fails= 0;
        this.deal();
    }

    deal(){
       this.masters_players.forEach(player => {
            this.hands[player] = new Array();
            for(let i = 0; i < 5; ++i){
                this.hands[player].push(this.deck.cards.pop());
            }
        });
    }

    give_information(){
        if(this.hints > 0){
            this.hints--;
            return true;
        }
        return false;
    }

    discard_card(player, card){
        this.discard.push(card);
        this.hands[player].splice(this.hands[player].indexOf(card), 1);
        this.hands[player].push(this.deck.cards.pop());
        if (this.hints < 8){
            this.hints++;
        }
    }
}
module.exports = {Card, Deck, Game};
