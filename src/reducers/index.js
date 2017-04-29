import { combineReducers } from  'redux'
import deckList from './deckList'
import decks from './decks'
import studySession from './studySession'

const webApp = combineReducers({
    deckList: deckList,
    decks: decks,
    studySession: studySession
});

export default webApp;
