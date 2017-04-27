const deckList = (state = {isFetching: false, decks: null}, action) => {
    switch (action.type) {
        case 'REQUEST_DECKS':
            return Object.assign({}, state, {
                isFetching: true
            });
        case 'RECEIVE_DECKS':
            return Object.assign({}, state, {
                decks: action.decks,
                isFetching: false
            });
        default:
            return state;
    }
}


export default deckList;
