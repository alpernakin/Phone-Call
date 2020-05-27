import Client from './client';
import { Participant } from './participant';
import { CallResponse, CallState } from './states';

describe('Client', () => {
    // test suite wide client object
    let client: Client;

    beforeEach(() => {
        // dependency
        const participant = new Participant({
            number: '123',
            onCall: () => Promise.resolve(CallResponse.ringing),
            onAnswer: () => Promise.resolve(true),
            onHangup: () => Promise.resolve(true),
            onReject: () => Promise.resolve(true)
        });

        client = new Client({ participant: participant });
    });

    it('should create', () => {
        expect(client).toBeTruthy();
    });

    it('should change state on participant state changed', () => {
        const stateChangeSpy = spyOn(client, 'onParticipantStateChanged');
        // change state on participant dependency
        // simulate that the participant is talking to a number
        client.state.participant.setState({
            state: CallState.talking,
            contactId: '321'
        });
        // now it should reflect back
        expect(stateChangeSpy).toBeCalled();
        expect(client.state.participant.state).toBe(CallState.talking);
        expect(client.state.participant.contactId).toBe('321');
    });

    // todo add UI / DOM tests
});