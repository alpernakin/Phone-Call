import './network.scss';
import React, { Component } from 'react';
import { Participant } from '../client/participant';
import { CallResponse } from '../client/states';
import Client from '../client/client';

interface Props {
    numberOfParticipants: number;
}

interface State {
    participants: Participant[];
}

export default class Network extends Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            participants: this.createParticipants(this.props.numberOfParticipants)
        };
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
    async call(callerId: string, calleeId: string): Promise<CallResponse> {
        const callee = this.state.participants?.find(x => x.number === calleeId);
        // if there is no participant with the given callee number
        if (!callee) {

            return CallResponse.unknown_number;
        }
        // then tell the callee
        return await callee.onCallReceive(callerId) ?
            CallResponse.ringing : CallResponse.busy;
    }

    /**
     * Answer a call.
     * 
     * @param callerId Phone number for the caller.
     * @param calleeId Phone number for the callee.
     */
    async answer(callerId: string, calleeId: string): Promise<boolean> {
        const caller = this.state.participants.find(x => x.number === callerId);
        return await caller?.onCalleeAnswer(calleeId) || false;
    }

    /**
     * 
     * @param callerId Phone number for the caller.
     * @param calleeId Phone number for the callee.
     */
    async reject(callerId: string, calleeId: string): Promise<boolean> {
        const caller = this.state.participants.find(x => x.number === callerId);
        return await caller?.onCalleeReject(calleeId) || false;
    }

    /**
     * Ends an on-going call.
     * 
     * @param requesterId Phone number for who requests to hangup.
     * @param counterpartId Phone number for the counterpart.
     */
    async hangup(requesterId: string, counterpartId: string): Promise<boolean> {
        const counterpart = this.state.participants.find(x => x.number === counterpartId);
        return await counterpart?.onCalleeHangup(requesterId) || false;
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