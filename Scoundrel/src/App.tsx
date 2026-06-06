import { useState, useEffect, useRef } from 'react';
import { CardType } from './types/types';
import './App.css';
import type { Card, ApiCard } from './types/types';
import CardComponent from './components/CardComponent';
import { draw_cards } from './utils/Utils';

function App() {
    const [cards, setCards] = useState<Card[]>([]);
    const [health] = useState(20);
    const [currentHand, setCurrentHand] = useState<Card[]>([]);
    const [drawCount, setDrawCount] = useState(0);
    const [fleed, setFleed] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [flyState, setFlyState] = useState<{ card: Card; from: DOMRect; to: DOMRect; active: boolean } | null>(null);
    const currCardRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        fetch("https://deckofcardsapi.com/api/deck/new/draw/?count=52")
            .then(response => response.json())
            .then(data => {
                const parsedCards = data.cards
                    .map(parse_card)
                    .filter((card: Card | null): card is Card => card !== null);

                setCards(parsedCards);
            })
            .catch(error => console.error(error));
    }, []);

    function drawHand() {
        const { hand, remainingDeck } = draw_cards(cards);

        setCurrentHand(hand);
        setCards(remainingDeck);
        setDrawCount(prev => prev + 1);
    }

    useEffect(() => {
        if (flyState && !flyState.active) {
            const frame = requestAnimationFrame(() => {
                setFlyState(prev => prev ? { ...prev, active: true } : prev);
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [flyState]);

    const handleSelect = (card: Card, index: number) => {
        const key = `${drawCount}-${index}`;
        const source = cardRefs.current[key];
        const destination = currCardRef.current;
        if (!source || !destination) return;

        const from = source.getBoundingClientRect();
        const to = destination.getBoundingClientRect();

        setFlyState({ card, from, to, active: false });
        setCurrentHand(prev => prev.filter((_, i) => i !== index));

        window.setTimeout(() => {
            setSelectedCard(card);
            setFlyState(null);
        }, 420);
    }    

    const flyingCardStyle = flyState ? {
        position: 'fixed' as const,
        width: '226px',
        height: '314px',
        left: flyState.from.left,
        top: flyState.from.top,
        backgroundImage: `url(${flyState.card.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transform: flyState.active
            ? `translate(${flyState.to.left - flyState.from.left}px, ${flyState.to.top - flyState.from.top}px)`
            : 'translate(0, 0)',
        transition: 'transform 0.38s ease, opacity 0.38s ease',
        zIndex: 999,
        pointerEvents: 'none' as const
    } : undefined;

    return (
        <>
            <section className="wrapper">
                <div className="deckHolder">
                    <h3>Deck</h3>
                    <p>{cards.length} cards</p>
                </div>

                <div className="playArea">
                </div>

                <div className="playerArea">
                    {currentHand.map((card, index) => {
                        const key = `${drawCount}-${index}`;
                        return (
                            <div key={key} className="dealtCard" ref={el => { cardRefs.current[key] = el; }}>
                                <CardComponent onclick={() => handleSelect(card, index)} image={card.image} />
                            </div>
                        );
                    })}
                </div>

                <div className='currCard' ref={currCardRef}>
                    {selectedCard && (
                        <div
                            className="cardComponent currCardSelected"
                            style={{
                                backgroundImage: `url(${selectedCard.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat"
                            }}
                        />
                    )}
                </div>

                {flyState && <div className="flyingCard" style={flyingCardStyle} />}
            </section>

            <h1 className="playerHP">{health}</h1>

            { currentHand.length <= 1 && <button onClick={drawHand}>Draw</button>}
        </>
    );
}

function get_card_value(value: string): number {
    switch (value) {
        case "ACE":
            return 14;
        case "JACK":
            return 11;
        case "QUEEN":
            return 12;
        case "KING":
            return 13;
        default:
            return Number(value);
    }
}

function parse_card(apiCard: ApiCard): Card | null {
    if (apiCard.code.startsWith("X")) {
        return null;
    }

    const cardNumber = get_card_value(apiCard.value);

    switch (apiCard.suit) {
        case "HEARTS":
            if (cardNumber > 10) {
                return null;
            }

            return {
                cardType: CardType.potion,
                cardNumber,
                image: apiCard.image
            };

        case "SPADES":
            return {
                cardType: CardType.monster,
                cardNumber,
                image: apiCard.image
            };

        case "CLUBS":
        case "DIAMONDS":
            if (cardNumber > 10) {
                return null;
            }

            return {
                cardType: CardType.weapon,
                cardNumber,
                image: apiCard.image
            };

        default:
            return null;
    }
}

export default App;