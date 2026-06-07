import { useState, useEffect, useRef } from 'react';
import { CardType } from './types/types';
import './App.css';
import type { Card, ApiCard } from './types/types';
import CardComponent from './components/CardComponent';
import { draw_cards } from './utils/Utils';

function App() {
    const [cards, setCards] = useState<Card[]>([]);
    const [health, setHealth] = useState(20);
    const [currentHand, setCurrentHand] = useState<Card[]>([]);
    const [drawCount, setDrawCount] = useState(0);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [activeWeapon, setActiveWeapon] = useState(0);
    const [flyState, setFlyState] = useState<{ card: Card; from: DOMRect; to: DOMRect; active: boolean } | null>(null);
    const [message, setMessage] = useState('Draw cards to begin your run.');
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
        setActiveWeapon(0);
        setMessage('Choose a card from your hand to play.');
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
            resolveCard(card);
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

    function resolveCard(card: Card) {
        if (card.cardType === CardType.potion) {
            setHealth(prev => Math.min(prev + card.cardNumber, 20));
            setMessage(`You play a potion and recover ${card.cardNumber} health.`);
            return;
        }

        if (card.cardType === CardType.weapon) {
            setActiveWeapon(card.cardNumber);
            setMessage(`You play a weapon and prepare ${card.cardNumber} attack power for the next monster.`);
            return;
        }

        if (card.cardType === CardType.monster) {
            if (activeWeapon > 0) {
                const remainingHealth = Math.max(card.cardNumber - activeWeapon, 0);
                setActiveWeapon(0);
                if (remainingHealth > 0) {
                    setHealth(prev => Math.max(prev - remainingHealth, 0));
                    setMessage(`Weapon dealt ${activeWeapon} damage. Monster has ${remainingHealth} left, and you take ${remainingHealth} damage.`);
                } else {
                    setMessage(`Weapon defeated the monster and blocked its attack. You take no damage.`);
                }
            } else {
                setHealth(prev => Math.max(prev - card.cardNumber, 0));
                setMessage(`No weapon was ready. The monster hits you for ${card.cardNumber} damage.`);
            }
            return;
        }
    }

    function resetGame() {
        setCards([]);
        setCurrentHand([]);
        setDrawCount(0);
        setSelectedCard(null);
        setMessage('Draw cards to begin your run.');
        setHealth(20);

        fetch("https://deckofcardsapi.com/api/deck/new/draw/?count=52")
            .then(response => response.json())
            .then(data => {
                const parsedCards = data.cards
                    .map(parse_card)
                    .filter((card: Card | null): card is Card => card !== null);

                setCards(parsedCards);
            })
            .catch(error => console.error(error));
    }

    return (
        <>
            <section className="wrapper">
                <div className="deckHolder">
                    <h3>Deck</h3>
                    <p>{cards.length} cards</p>
                </div>

                <div className="infoPanel">
                    <p>{message}</p>
                    <p>Deck remaining: {cards.length}</p>
                    <p>Health: {health}</p>
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

            <div className="playerFooter">
                <h1 className="playerHP">Health: {health}</h1>
            </div>

            {currentHand.length <= 1 && <button className="drawButton" onClick={drawHand}>Draw</button>}
            <button className="drawButton secondary" onClick={resetGame}>Restart</button>
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
        case "CLUBS":
            return {
                cardType: CardType.monster,
                cardNumber,
                image: apiCard.image
            };

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