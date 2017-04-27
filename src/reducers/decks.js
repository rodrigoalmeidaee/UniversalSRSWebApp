const card = (state = {}, action) => {
    switch (action.type) {
        case 'UPDATE_CARD':
        case 'REMOVE_CARD':
            return Object.assign({}, state, {isUpdating: true}, action.updates);
        case 'CARD_UPDATED':
            return action.card;
        default:
            return state;
    }
}


const deck = (state = {}, action) => {
    var newState;

    switch (action.type) {
        case 'UPDATE_CARD':
        case 'CARD_UPDATED':
        case 'REMOVE_CARD':
            newState = Object.assign({}, state);
            newState.cards = newState.cards.slice();
            var cardIndex = newState.cards.findIndex(c => c.id === action.cardId);
            newState.cards.splice(
                cardIndex,
                1,
                card(newState.cards[cardIndex], action)
            );
            return newState;

        case 'CARD_ADDED':
            newState = Object.assign({}, state);
            newState.cards = newState.cards.slice();
            newState.cards.push(action.card);
            return newState;

        case 'CARD_REMOVED':
            newState = Object.assign({}, state);
            newState.cards = newState.cards.slice();
            var cardIndex = newState.cards.findIndex(c => c.id === action.cardId);
            newState.cards.splice(
                cardIndex,
                1
            );
            return newState;

        default:
            return state;
    }
}


const decks = (state = {}, action) => {
    var newState;

    switch (action.type) {
        case 'REQUEST_DECK':
            newState = Object.assign({}, state);
            delete newState[action.deckId];
            return newState;
        case 'RECEIVE_DECK':
            newState = Object.assign({}, state);
            newState[action.deckId] = action.deck;
            return newState;
        case 'UPDATE_CARD':
        case 'CARD_UPDATED':
        case 'ADD_CARD':
        case 'CARD_ADDED':
        case 'REMOVE_CARD':
        case 'CARD_REMOVED':
            if (!state[action.deckId]) {
                console.error("Deck id not found");
                return state;
            }
            newState = Object.assign({}, state);
            newState[action.deckId] = deck(newState[action.deckId], action);
            return newState;
        default:
            return state;
    }
}


export default decks;
