import React from "react";

export enum Suite {
    Hearts = 1,
    Spades,
    Clubs,
    Diamonds
}

export enum CardType {
    monster = 1,
    potion,
    weapon

}

export type Card = {
    cardType : CardType,
    cardNumber : number,
}

export type ApiCard = {
    code: string;
    image: string;
    value: string;
    suit: string;
};