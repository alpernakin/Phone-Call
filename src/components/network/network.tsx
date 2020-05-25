import './network.scss';
import React, { Component } from 'react';
import Client, { Participant, CallResponse } from '../client/client';

interface Props {
    numberOfParticipants: number;
}

interface State {
    participants?: Participant[];
}

export default class Network extends Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            participants: []
        };
    }

    componentDidMount() {
        this.setState({
            participants: this.createParticipants(this.props.numberOfParticipants)
        });
    }

    /**
     * 
     * @param numberOfClients 
     */
    private createParticipants(numberOfClients: number): Participant[] {
        // the result collection
        let participants: Participant[] = [];
        // keep tracking the numbers to prevent duplicate
        let savedNumbers: string[] = [];
        for (let i = 0; i < numberOfClients; i++) {
            // let's produce a unique 3 digits number
            do {
                var participantId = Math.round(((Math.random() * 899) + 100)).toString();
            }
            while (savedNumbers.includes(participantId));
            // save in the collection
            savedNumbers.push(participantId);
            // create the client
            participants.push(new Participant({
                number: participantId,
                onCall: (selfId, calleeId) => this.call(selfId, calleeId),
                onHangup: (selfId, calleeId) => this.hangup(selfId, calleeId),
                onAnswer: (selfId, callerId) => this.answer(callerId, selfId),
                onReject: (selfId, callerId) => this.reject(callerId, selfId),
            }));
        }

        return participants;
    }

    /**
     * Start a call between two participants.
     * 
     * @param callerId Phone number for the caller.
     * @param calleeId Phone number for the callee.
     */
    private call(callerId: string, calleeId: string): CallResponse {
        let callee = this.state.participants?.find(x => x.number === calleeId);
        // if there is no participant with the given callee number
        if (!callee) {

            return CallResponse.unknown_number;
        }
        // then tell the callee
        return callee.onCalled(callerId);
    }

    /**
     * Answer a call.
     * 
     * @param callerId Phone number for the caller.
     * @param calleeId Phone number for the callee.
     */
    private answer(callerId: string, calleeId: string) {
        let caller = this.state.participants?.find(x => x.number === callerId);
        caller?.onCalleeAnswered(calleeId);
    }

    /**
     * 
     * @param callerId Phone number for the caller.
     * @param calleeId Phone number for the callee.
     */
    private reject(callerId: string, calleeId: string) {
        let caller = this.state.participants?.find(x => x.number === callerId);
        caller?.onCalleeRejected(calleeId);
    }

    /**
     * Ends an on-going call.
     * 
     * @param requesterId Phone number for who requests to hangup.
     * @param counterpartId Phone number for the counterpart.
     */
    private hangup(requesterId: string, counterpartId: string) {
        let counterpart = this.state.participants?.find(x => x.number === counterpartId);
        counterpart?.onCalleeHangup(requesterId);
    }

    render() {
        return (
            <div className="network">
                {
                    this.state.participants?.map((participant, index) => (
                        <Client key={index} participant={participant} />
                    ))
                }
            </div>
        );
    }
}