import './client.scss';
import React, { Component } from 'react';
import { CallState } from './states';
import { Participant } from './participant';

interface ClientProps {
    /**
     * Participant object.
     */
    participant: Participant;
}

interface ClientState {
    /**
     * 3 digits phone number to call.
     * The digits for input field.
     */
    calleeInput: string;
    /**
     * Participant object.
     */
    participant: Participant;
}

export default class Client extends Component<ClientProps, ClientState> {

    constructor(props: ClientProps) {
        super(props);
        // here we bind the state change callback 
        // to have a responsive UI for changes in participant
        props.participant.onStateChanged =
            participant => this.onParticipantStateChanged(participant);
        // init the component state
        this.state = {
            calleeInput: '',
            participant: props.participant,
        };
    }

    private onInputChanged(newValue: string) {
        this.setState({ calleeInput: newValue });
    }

    public onParticipantStateChanged(participant: Participant) {
        this.setState({ participant: participant });
    }

    render() {
        return (
            <div className="client">
                {
                    this.state.participant &&
                    <div>
                        <div className="phone-number">
                            Number: {this.state.participant.number}
                        </div>
                        <div className="callee-input-container">
                            <input value={this.state.calleeInput}
                                onChange={event => this.onInputChanged(event.currentTarget.value)}></input>
                        </div>
                        <div className="buttons-container">
                            {
                                this.state.participant.state === CallState.number_unknown &&
                                <div>
                                    The number {this.state.participant.contactId} is unknown.
                                </div>
                            }
                            {
                                this.state.participant.state === CallState.callee_is_busy &&
                                <div>
                                    {this.state.participant.contactId} is busy.
                                </div>
                            }
                            {
                                this.state.participant.state === CallState.callee_is_ringing &&
                                <div>
                                    {this.state.participant.contactId} is ringing...
                                </div>
                            }
                            {
                                this.state.participant.state === CallState.ringing &&
                                <div>
                                    {this.state.participant.contactId} is calling...
                                </div>
                            }
                            {
                                this.state.participant.state === CallState.talking &&
                                <div>
                                    Talking to {this.state.participant.contactId}...
                                </div>
                            }
                            {
                                this.state.participant.state === CallState.calling &&
                                <div>
                                    Calling {this.state.participant.contactId}...
                                </div>
                            }
                            {
                                !this.state.participant.isBusy() &&
                                <button onClick={_event => this.state.participant.makeACall(this.state.calleeInput)}>
                                    Call
                                </button>
                            }
                            {
                                this.state.participant.state === CallState.ringing &&
                                <button onClick={_event => this.state.participant.rejectCurrentCall()}>
                                    Reject
                                </button>
                            }
                            {
                                this.state.participant.state === CallState.ringing &&
                                <button onClick={_event => this.state.participant.answerCurrentCall()}>
                                    Answer
                                </button>
                            }
                            {
                                this.state.participant.state === CallState.talking &&
                                <button onClick={_event => this.state.participant.hangupCurrentCall()}>
                                    Hangup
                                </button>
                            }
                        </div>
                    </div>
                }

            </div>
        );
    }
}