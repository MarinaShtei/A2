import { h } from 'preact';
import { Router } from 'preact-router';
import Login from './Login';
import Registration from './Registration';
import EventPage from './EventPage';
import EditEvent from './EditEvent';
import JoinEvent from './JoinEvent'

export function App() {
  return (
    <div id="app">
      <Router>
        <Login path="/" />
        <Registration path="/registration" />
        <EventPage path="/events" />
        <EditEvent path="/edit-event" />
        <JoinEvent path="/join" />
      </Router>
    </div>
  );
}