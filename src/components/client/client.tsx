import './client.scss';
import React, { Component } from 'react';

export enum CallState {
    idle = 1,
    ringing = 2,
    callee_is_ringing = 4,
    number_unknown = 8,
    callee_is_busy = 16,
    talking = 32
}

export enum CallResponse {
    ringing = 1,
    busy = 2,
    unknown_number = 4
}

const busyStates = [CallState.callee_is_ringing, CallState.ringing, CallState.talking];

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
        props.participant.onStateChanged =
            _ => this.onParticipantStateChanged(_);
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
                            {this.state.participant.number}
                        </div>
                        <div className="callee-input-container">
                            <input value={this.state.calleeInput}
                                onChange={event => this.onInputChanged(event.currentTarget.value)}></input>
                        </div>
                        <div className="buttons-container">
                            {
                                !busyStates.includes(this.state.participant.state) &&
                                <button onClick={_event => this.state.participant.makeACall(this.state.calleeInput)}>
                                    Call
                                </button>
                            }
                            {
                                this.state.participant.state === CallState.number_unknown &&
                                <span>
                                    The number is unknown.
                                </span>
                            }
                            {
                                this.state.participant.state === CallState.callee_is_busy &&
                                <span>
                                    The callee is busy.
                                </span>
                            }
                            {
                                this.state.participant.state === CallState.callee_is_ringing &&
                                <span>
                                    The callee is ringing...
                                </span>
                            }
                            {
                                this.state.participant.state === CallState.ringing &&
                                <span>
                                    Ringing...
                                </span>
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

interface ParticipantProps {
    /**
     * 3 digits phone number.
     */
    number: string;
    /**
     * When the client calls the given `callee` number.
     * @param contactId Phone number of the callee.
     * @returns 
     */
    onCall: (selfId: string, contactId: string) => CallResponse;
    /**
     * When the client answers a call from the given `caller` number.
     * @param contactId Phone number of the caller.
     */
    onAnswer: (selfId: string, contactId: string) => void;
    /**
     * When the client rejects a call from the given `caller` number.
     * @param contactId Phone number of the caller.
     */
    onReject: (selfId: string, contactId: string) => void;
    /**
     * When the client hangs up a call with the given `contact` number
     * @param contact Phone number of the contact.
     */
    onHangup: (selfId: string, contactId: string) => void;
}

export class Participant {

    public number: string;
    public contactId: string;
    public state: CallState;
    /**
     * A callback bind to execute when participant states are changed.
     */
    public onStateChanged: (_: Participant) => void;

    constructor(private props: ParticipantProps) {
        this.number = props.number;
        this.contactId = '';
        this.state = CallState.idle;
        this.onStateChanged = _ => { };
    }

    /**
     * @param params Participant states.
     */
    public setState(params: { state: CallState, contactId?: string }) {
        if (params.contactId)
            this.contactId = params.contactId;
        if (params.state)
            this.state = params.state;
        this.onStateChanged(this);
    }

    /**
     * When another participant calls.
     * @param contactId Phone number for the caller.
     */
    public onCalled(contactId: string): CallResponse {
        // if the participant is busy
        if (busyStates.includes(this.state))
            return CallResponse.busy;
        // otherwise ring the participant
        this.setState({
            state: CallState.ringing,
            contactId: contactId
        });
        return CallResponse.ringing;
    }

    /**
     * When the callee answered.
     * @param contactId Phone number for the callee.
     */
    public onCalleeAnswered(contactId: string) {
        this.setState({
            state: CallState.talking,
            contactId: contactId
        });
    }

    /**
     * When the callee rejects.
     * @param contactId Phone number for the callee.
     */
    public onCalleeRejected(contactId: string) {
        this.setState({
            state: CallState.callee_is_busy,
            contactId: contactId
        });
    }


    /**
     * When other side hangs up.
     * @param _contactId Phone number for the counterpart.
     */
    public onCalleeHangup(_contactId: string) {
        this.setState({
            state: CallState.idle,
            contactId: ''
        });
    }

    /**
     * When there is no number, called by the participant.
     * @param contactId Phone number that has been called.
     */
    public onUnknownNumber(contactId: string) {
        this.setState({
            state: CallState.number_unknown,
            contactId: contactId
        });
    }

    /**
     * Make a call to another participant.
     * @param calleeId Phone number to call.
     */
    public makeACall(calleeId: string) {
        if (this.number === calleeId)
            return;

        const callResponse = this.props.onCall(this.number, calleeId);
        switch (callResponse) {
            case CallResponse.busy:
                this.onCalleeRejected(calleeId);
                break;
            case CallResponse.unknown_number:
                this.onUnknownNumber(calleeId);
                break;
            default:
                this.setState({
                    state: CallState.callee_is_ringing,
                    contactId: calleeId
                });
        }
    }

    /**
     * Answer the current call.
     * It answers the call from the `contactId`.
     */
    public answerCurrentCall() {
        this.props.onAnswer(this.number, this.contactId);
        this.setState({ state: CallState.talking });
    }

    /**
     * Reject the current call.
     * It rejects the call from the `contactId`.
     */
    public rejectCurrentCall() {
        this.props.onReject(this.number, this.contactId);
        this.setState({
            state: CallState.idle,
            contactId: ''
        });
    }

    /**
     * Hang up the current call.
     * It hangs up the call with the `contactId`.
     */
    public hangupCurrentCall() {
        this.props.onHangup(this.number, this.contactId);
        this.setState({
            state: CallState.idle,
            contactId: ''
        });
    }
}

