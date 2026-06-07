import { CardType } from "../types/types";
import type { Card } from "../types/types";

export function draw_cards(cards: Card[]) {
    const remainingDeck = [...cards];
    const hand: Card[] = [];

    for (let i = 0; i < 4 && remainingDeck.length > 0; i++) {
        const idx = Math.floor(Math.random() * remainingDeck.length);

        const [card] = remainingDeck.splice(idx, 1);
        hand.push(card);
    }

    return {
        hand,
        remainingDeck
    };
}

export function draw_monster(cards: Card[]) {
    const remainingDeck = [...cards];
    const monsterIndex = remainingDeck.findIndex(card => card.cardType === CardType.monster);

    if (monsterIndex === -1) {
        return {
            monster: null,
            remainingDeck
        };
    }

    const [monster] = remainingDeck.splice(monsterIndex, 1);

    return {
        monster,
        remainingDeck
    };
}