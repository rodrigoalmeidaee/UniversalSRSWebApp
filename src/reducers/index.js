import { combineReducers } from  'redux'
import deckList from './deckList'
import decks from './decks'


const webApp = combineReducers({
    deckList: deckList,
    decks: decks
});

export default webApp;
