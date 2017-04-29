import fetch from 'isomorphic-fetch'


export function requestDecks() {
    return {
        type: 'REQUEST_DECKS'
    };
}


export function receiveDecks(decks) {
    return {
        type: 'RECEIVE_DECKS',
        decks: decks
    };
}


export function requestDeck(deckId) {
    return {
        type: 'REQUEST_DECK',
        deckId: deckId
    };
}

export function receiveDeck(deckId, deck) {
    return {
        type: 'RECEIVE_DECK',
        deckId: deckId,
        deck: deck
    };
}


export function updateCard(deckId, cardId, updates) {
    return {
        type: 'UPDATE_CARD',
        deckId: deckId,
        cardId: cardId,
        updates: updates
    };
}


export function cardUpdated(deckId, cardId, card) {
    return {
        type: 'CARD_UPDATED',
        deckId: deckId,
        cardId: cardId,
        card: card
    };
}


export function addCard(deckId, card) {
    return {
        type: 'ADD_CARD',
        deckId: deckId,
        card: card
    };
}


export function cardAdded(deckId, card) {
    return {
        type: 'CARD_ADDED',
        deckId: deckId,
        card: card
    };
}


export function removeCard(deckId, cardId) {
    return {
        type: 'REMOVE_CARD',
        deckId: deckId,
        cardId: cardId
    };
}


export function cardRemoved(deckId, cardId) {
    return {
        type: 'CARD_REMOVED',
        deckId: deckId,
        cardId: cardId
    };
}


export function requestStudySession(deckId) {
    return {
        type: 'REQUEST_STUDY_SESSION',
        deckId: deckId
    };
}


export function receiveStudySession(studySession) {
    return {
        type: 'RECEIVE_STUDY_SESSION',
        studySession: studySession
    }
}


export function syncStarted(sessionId, answers) {
    return {
        type: 'SYNC_STARTED',
        sessionId: sessionId,
        answers: answers
    };
}


export function syncSucceeded(sessionId, answers) {
    return {
        type: 'SYNC_SUCCEEDED',
        sessionId: sessionId,
        answers: answers
    }
}


const raiseForStatus = response => {
    if (response.status > 299) {
        return Promise.reject(`Expected HTTP 2xx, but got ${response.status}`);
    }
    return response;
}


export function fetchDecks() {
    return function(dispatch) {
        dispatch(requestDecks());

        return fetch(process.env.REACT_APP_API_HOST + '/decks')
            .then(raiseForStatus)
            .then(response => response.json())
            .then(json => dispatch(receiveDecks(json)));
    };
}


export function fetchDecksIfNeeded() {
    return (dispatch, getState) => {
        if (getState().deckList.decks) {
            return Promise.resolve();
        } else {
            return dispatch(fetchDecks());
        }
    };
}


export function fetchDeck(deckId) {
    return function(dispatch) {
        dispatch(requestDeck(deckId));

        return fetch(process.env.REACT_APP_API_HOST + '/decks/' + deckId)
            .then(raiseForStatus)
            .then(response => response.json())
            .then(json => dispatch(receiveDeck(deckId, json)))
    };
}


export function submitCardUpdate(deckId, cardId, updates) {
    return function(dispatch) {
        dispatch(updateCard(deckId, cardId, updates));

        return fetch(
            process.env.REACT_APP_API_HOST + '/decks/' + deckId + '/cards/' + cardId,
            {
                method: 'PATCH',
                body: JSON.stringify(updates)
            }
        ).then(
            raiseForStatus
        ).then(
            response => response.json()
        ).then(
            json => dispatch(cardUpdated(deckId, cardId, json))
        );
    }
}


export function submitCard(deckId, card) {
    return function(dispatch) {
        dispatch(addCard(deckId, card));

        return fetch(
            process.env.REACT_APP_API_HOST + '/decks/' + deckId + '/cards',
            {
                method: 'POST',
                body: JSON.stringify(card)
            }
        ).then(
            raiseForStatus
        ).then(
            response => response.json()
        ).then(
            json => dispatch(cardAdded(deckId, json))
        );
    }
}


export function submitCardRemoval(deckId, cardId) {
    return function(dispatch) {
        dispatch(removeCard(deckId, cardId));

        return fetch(
            process.env.REACT_APP_API_HOST + '/decks/' + deckId + '/cards/' + cardId,
            {method: 'DELETE'}
        ).then(raiseForStatus).then(
            response => {
                console.log(response);
                dispatch(cardRemoved(deckId, cardId));
            }
        );
    }
}


export function fetchStudySession(deckId) {
    return function(dispatch) {
        dispatch(requestStudySession(deckId));

        return fetch(
            process.env.REACT_APP_API_HOST + '/decks/' + deckId + '/study'
        ).then(raiseForStatus).then(
            response => response.json()
        ).then(
            json => dispatch(receiveStudySession(json))
        );
    }
}


export function submitAnswers(sessionId, answers) {
    return function(dispatch) {
        dispatch(syncStarted(sessionId, answers));

        fetch(
            process.env.REACT_APP_API_HOST + '/answers?session_id=' + sessionId,
            {method: 'POST', body: JSON.stringify(answers)}
        ).then(raiseForStatus).then(
            response => dispatch(syncSucceeded(sessionId, answers))
        );
    }
}
