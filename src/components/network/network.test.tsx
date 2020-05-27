import Network from './network';
import { CallResponse, CallState } from '../client/states';

describe('Network', () => {
    // test suite wide network object
    let network: Network;

    beforeEach(() => {
        network = new Network({ numberOfParticipants: 2 });
    });

    it('should create', () => {
        expect(network).toBeTruthy();
    });

    it('should create participants with unique numbers in 3 digits', () => {
        // expect as many as in the props
        expect(network.state.participants?.length).toBe(2);
        // map participant numbers
        const numbers = network.state.participants.map(x => x.number);
        expect(numbers[0] === numbers[1]).toBeFalsy();
        // and in 3 digits
        expect(numbers[0].length).toEqual(3);
    });

    it('should return unknown number, when a participant calls a non-existing number', async () => {
        const caller = network.state.participants[0];
        // try to call a number, which would not exist in the network
        expect(await network.call(caller.number, '01')).toBe(CallResponse.unknown_number);
    });

    it('should return busy, when a participant calls another busy participant', async () => {
        const caller = network.state.participants[0];
        const callee = network.state.participants[1];
        // simulate the callee busy with talking
        callee.setState({ state: CallState.talking });

        expect(await network.call(caller.number, callee.number)).toBe(CallResponse.busy);
    });

    it('should return ringing, when a participant calls an available participant', async () => {
        const caller = network.state.participants[0];
        const callee = network.state.participants[1];
        // the callee status is default idle
        expect(await network.call(caller.number, callee.number)).toBe(CallResponse.ringing);
    });

    it('should return true / false accordingly, when a participant answers a call from another', async () => {
        const caller = network.state.participants[0];
        const callee = network.state.participants[1];
        // simulate that the first participant is ringing the second one
        const simulate = () => {
            caller.setState({
                state: CallState.callee_is_ringing,
                contactId: callee.number
            });
            callee.setState({
                state: CallState.ringing,
                contactId: caller.number
            });
        }

        // positive case
        simulate();
        expect(await network.answer(caller.number, callee.number)).toBeTruthy();

        // negative case
        simulate();
        // with a glitch **
        caller.setState({ state: CallState.idle, contactId: '' });
        expect(await network.answer(caller.number, callee.number)).toBeFalsy();
    });

    it('should return true / false accordingly, when a participant rejects a call from another', async () => {
        const caller = network.state.participants[0];
        const callee = network.state.participants[1];
        // simulate that the first participant is ringing the second one
        const simulate = () => {
            caller.setState({
                state: CallState.callee_is_ringing,
                contactId: callee.number
            });
            callee.setState({
                state: CallState.ringing,
                contactId: caller.number
            });
        }
        // positive case
        simulate();
        expect(await network.reject(caller.number, callee.number)).toBeTruthy();

        // negative case
        simulate();
        // with a glitch **
        caller.setState({ state: CallState.idle, contactId: '' });
        expect(await network.reject(caller.number, callee.number)).toBeFalsy();
    });

    it('should return true / false accordingly, when a participant hangs up a call from another', async () => {
        const caller = network.state.participants[0];
        const callee = network.state.participants[1];
        // simulate that the first participant is talking to the second one
        const simulate = () => {
            caller.setState({
                state: CallState.talking,
                contactId: callee.number
            });
            callee.setState({
                state: CallState.talking,
                contactId: caller.number
            });
        }

        // positive case
        simulate();
        expect(await network.hangup(caller.number, callee.number)).toBeTruthy();

        // negative case
        simulate();
        // with a glitch **
        callee.setState({ state: CallState.idle, contactId: '' });
        expect(await network.hangup(caller.number, callee.number)).toBeFalsy();
    });

    // todo add some UI / DOM tests
});