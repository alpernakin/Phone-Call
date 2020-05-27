import { Participant } from './participant';
import { CallResponse, CallState } from './states';

describe('Participant', () => {
    // test suite wide participant object
    let participant: Participant;

    beforeEach(() => {
        // form participant before each unit
        participant = new Participant({
            number: '123',
            onCall: () => Promise.resolve(CallResponse.ringing),
            onAnswer: () => Promise.resolve(true),
            onHangup: () => Promise.resolve(true),
            onReject: () => Promise.resolve(true)
        });
    });

    it('should create', () => {
        expect(participant).toBeTruthy();
    });

    it('should change state', () => {
        participant.setState({
            state: CallState.talking,
            contactId: '234'
        });
        expect(participant.state).toBe(CallState.talking);
        expect(participant.contactId).toBe('234');
    });

    it('should be ringing on a call', async () => {
        // by default the participant state is idle
        await participant.onCallReceive('234');
        expect(participant.state).toBe(CallState.ringing);
    });

    it('should not be available for a call in a busy state', async () => {
        // let's pick a busy state
        participant.setState({
            state: CallState.talking,
            contactId: '456'
        });
        expect(await participant.onCallReceive('234')).toBeFalsy();
    });

    it('should be talking on a call answer', async () => {
        // simulate that the participant is ringing
        participant.setState({
            state: CallState.callee_is_ringing,
            contactId: '234'
        });
        expect(await participant.onCalleeAnswer('234')).toBeTruthy();
        expect(participant.state).toBe(CallState.talking);
    });

    it('should not be talking on a call answer from a number, which the participant has not called', async () => {
        // by default the state is idle
        expect(await participant.onCalleeAnswer('234')).toBeFalsy();
    });

    it('should be able to recieve a rejection from a number', async () => {
        // simulate that the participant is ringing
        participant.setState({
            state: CallState.callee_is_ringing,
            contactId: '234'
        });
        expect(await participant.onCalleeReject('234')).toBeTruthy();
        expect(participant.state).toBe(CallState.callee_is_busy);
    });

    it('should not be able to recieve a rejection from a number, which the participant has not called', async () => {
        // by default the state is idle
        expect(await participant.onCalleeReject('234')).toBeFalsy();
    });

    it('should receive hangup from a call', async () => {
        // simulate that the participant is talking
        participant.setState({
            state: CallState.talking,
            contactId: '234'
        });
        expect(await participant.onCalleeHangup('234')).toBeTruthy();
        expect(participant.state).toBe(CallState.idle);
    });

    it('should not receive hangup from a number, which participant has not called', async () => {
        // by default the state is idle
        expect(await participant.onCalleeReject('234')).toBeFalsy();
    });

    it('should receive unknown number', async () => {
        // simulate that the participant is calling
        participant.setState({
            state: CallState.calling,
            contactId: '234'
        });
        expect(await participant.onUnknownNumberCalled('234')).toBeTruthy();
        expect(participant.state).toBe(CallState.number_unknown);
    });

    it('should not receive unknown number for a number, which the participant has not called', async () => {
        // by default the state is idle
        expect(await participant.onUnknownNumberCalled('234')).toBeFalsy();
    });

    it('should not make a call to itself', async () => {
        await participant.makeACall('123');
        expect(participant.state).toBe(CallState.idle);
    });

    it('should not make a call when busy', async () => {
        // assign one of busy states
        participant.setState({ state: CallState.talking });
        await participant.makeACall('234');
        expect(participant.state).toBe(CallState.talking);
    });

    it('should switch state on accordingly, when the participant make a call', async () => {
        // unknown number
        participant.props.onCall = (x, y) => Promise.resolve(CallResponse.unknown_number);
        // simulate that the participant is idle
        participant.setState({ state: CallState.idle });
        await participant.makeACall('234');
        expect(participant.state).toBe(CallState.number_unknown);
        // callee is busy
        participant.props.onCall = (x, y) => Promise.resolve(CallResponse.busy);
        // simulate that the participant is idle
        participant.setState({ state: CallState.idle });
        await participant.makeACall('234');
        expect(participant.state).toBe(CallState.callee_is_busy);
        // ringing
        participant.props.onCall = (x, y) => Promise.resolve(CallResponse.ringing);
        // simulate that the participant is idle
        participant.setState({ state: CallState.idle });
        await participant.makeACall('234');
        expect(participant.state).toBe(CallState.callee_is_ringing);
    });

    // todo add more tests regarding answerCurrentCall, rejectCurrentCall, hangupCurrentCall functions
});