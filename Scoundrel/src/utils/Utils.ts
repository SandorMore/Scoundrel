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