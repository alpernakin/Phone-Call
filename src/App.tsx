import React, { Component } from 'react';
import './App.scss';
import Network from './components/network/network';

export default class App extends Component<{}, {}> {

    render() {
        return (
            <div className="app">
                <Network numberOfParticipants={4} />
            </div>
        );
    }
}