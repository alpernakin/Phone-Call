import { CallResponse, CallState } from "./states";

/**
 * Constructor parameters to create a Participant object.
 */
interface ParticipantProps {
    /**
     * 3 digits phone number.
     */
    number: string;
    /**
     * When the participant calls the given `callee` number.
     * @param selfId Phone number of the current participant
     * @param contactId Phone number of the callee.
     * @returns Call response status from the counterpart.
     */
    onCall: (selfId: string, contactId: string) => Promise<CallResponse>;
    /**
     * When the participant answers a call from the given `caller` number.
     * @param selfId Phone number of the current participant
     * @param contactId Phone number of the caller.
     * @returns Availability from the counterpart.
     */
    onAnswer: (selfId: string, contactId: string) => Promise<boolean>;
    /**
     * When the participant rejects a call from the given `caller` number.
     * @param selfId Phone number of the current participant
     * @param contactId Phone number of the caller.
     * @returns Availability from the counterpart.
     */
    onReject: (selfId: string, contactId: string) => Promise<boolean>;
    /**
     * When the participant hangs up a call with the given `contact` number
     * @param selfId Phone number of the current participant
     * @param contact Phone number of the contact.
     * @returns Availability from the counterpart.
     */
    onHangup: (selfId: string, contactId: string) => Promise<boolean>;
}

export class Participant {

    public number: string;
    public contactId: string;
    public state: CallState;
    /**
     * A callback bind to execute when participant states are changed.
     */
    public onStateChanged: (_: Participant) => void;

    constructor(public props: ParticipantProps) {
        this.number = props.number;
        this.contactId = '';
        this.state = CallState.idle;
        this.onStateChanged = _ => { };
    }

    /**
     * @param params Participant states.
     */
    public setState(params: { state?: CallState, contactId?: string }) {
        if (params.contactId)
            this.contactId = params.contactId;
        if (params.state)
            this.state = params.state;
        this.onStateChanged(this);
    }

    /**
     * If the participant in the busy state,
     * in order to understand if it is available for some actions.
     */
    public isBusy(): boolean {
        return [CallState.ringing,
        CallState.callee_is_ringing,
        CallState.talking, CallState.calling].includes(this.state);
    }

    /**
     * When another participant calls.
     * @param contactId Phone number for the caller.
     * @returns True if the operation is valid
     */
    async onCallReceive(contactId: string): Promise<boolean> {
        // the participant should not be busy
        if (this.isBusy())
            return false;
        // otherwise ring the participant
        this.setState({
            state: CallState.ringing,
            contactId: contactId
        });
        return true;
    }

    /**
     * When the callee answered.
     * @param contactId Phone number for the callee.
     * @returns True if the operation is valid
     */
    async onCalleeAnswer(contactId: string): Promise<boolean> {
        // if the participant is not already calling the contact,
        // then there is something wrong...
        if (!(this.state === CallState.callee_is_ringing
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.talking,
            contactId: contactId
        });
        return true;
    }

    /**
     * When the callee rejects.
     * @param contactId Phone number for the callee.
     * @returns True if the operation is valid
     */
    async onCalleeReject(contactId: string): Promise<boolean> {
        // if the participant is not already calling the contact,
        // then there is something wrong...
        if (!(this.state === CallState.callee_is_ringing
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.callee_is_busy,
            contactId: contactId
        });
        return true;
    }

    /**
     * When other side hangs up.
     * @param contactId Phone number for the counterpart.
     * @returns True if the operation is valid
     */
    async onCalleeHangup(contactId: string): Promise<boolean> {
        // if the participant is not already talking the contact,
        // then there is something wrong...
        if (!(this.state === CallState.talking
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.idle,
            contactId: ''
        });
        return true;
    }

    /**
     * When there is no number existing.
     * @param contactId Phone number that has been called.
     * @returns True if the operation is valid
     */
    async onUnknownNumberCalled(contactId: string): Promise<boolean> {
        // if the participant is not already calling the contact,
        // then there is something wrong...
        if (!(this.state === CallState.calling
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.number_unknown,
            contactId: contactId
        });
        return true;
    }

    /**
     * When the callee is busy on a call
     * @param contactId Phone number that has been called.
     * @returns True if the operation is valid
     */
    async onCalleeBusy(contactId: string): Promise<boolean> {
        // if the participant is not already calling the contact,
        // then there is something wrong...
        if (!(this.state === CallState.calling
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.callee_is_busy,
            contactId: contactId
        });

        return true;
    }

    /**
     * When the callee is available and ringing.
     * @param contactId Phone number that has been called.
     * @returns True if the operation is valid
     */
    async onCalleeRinging(contactId: string) {
        // if the participant is not already calling the contact,
        // then there is something wrong...
        if (!(this.state === CallState.calling
            && this.contactId === contactId))
            return false;

        this.setState({
            state: CallState.callee_is_ringing,
            contactId: contactId
        });

        return true;
    }

    /**
     * Make a call to another participant.
     * @param calleeId Phone number to call.
     */
    async makeACall(calleeId: string) {
        if (this.number === calleeId || this.isBusy())
            return;
        // immediately change the status to calling
        // to provide concurrency.
        this.setState({ state: CallState.calling, contactId: calleeId });

        const response = await this.props.onCall(this.number, calleeId);
        // process the immediate call response
        switch (response) {
            case CallResponse.busy:
                this.onCalleeBusy(calleeId);
                break;
            case CallResponse.unknown_number:
                this.onUnknownNumberCalled(calleeId);
                break;
            // then it means the calee is ringing...
            default:
                this.onCalleeRinging(calleeId);
        }
    }
    /**
     * Answer the current call.
     * It answers the call from the `contactId`.
     */
    async answerCurrentCall() {
        const response = await this.props.onAnswer(this.number, this.contactId);
        this.setState({ state: response ? CallState.talking : CallState.idle });

        // todo show a warning on false response
    }
    /**
     * Reject the current call.
     * It rejects the call from the `contactId`.
     */
    async rejectCurrentCall() {
        const response = await this.props.onReject(this.number, this.contactId);
        // it will be idle anyway on rejection
        this.setState({
            state: CallState.idle,
            contactId: ''
        });
    }
    /**
     * Hang up the current call.
     * It hangs up the call with the `contactId`.
     */
    async hangupCurrentCall() {
        const response = await this.props.onHangup(this.number, this.contactId);
        // it will be idle anyway on hangup
        this.setState({
            state: CallState.idle,
            contactId: ''
        });
    }
}