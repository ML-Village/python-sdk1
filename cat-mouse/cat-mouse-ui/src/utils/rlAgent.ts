type Action = 'up' | 'down' | 'left' | 'right';
type State = string;

export class RLAgent {
    private qTable: Map<State, Map<Action, number>> = new Map();
    private learningRate = 0.1;
    private discountFactor = 0.9;
    private epsilon = 0.1;

    constructor(private boardSize: number) {}

    getState(catPos: [number, number], mousePos: [number, number]): State {
        return `${catPos[0]},${catPos[1]},${mousePos[0]},${mousePos[1]}`;
    }

    getAction(state: State): Action {
        if (Math.random() < this.epsilon) {
        return this.getRandomAction();
        }
        if (!this.qTable.has(state)) {
        this.qTable.set(state, new Map());
        }
        const stateActions = this.qTable.get(state)!;
        if (stateActions.size < 4) {
        return this.getRandomAction();
        }
        return this.getBestAction(stateActions);
    }

    update(state: State, action: Action, reward: number, nextState: State) {
        if (!this.qTable.has(state)) {
        this.qTable.set(state, new Map());
        }
        const stateActions = this.qTable.get(state)!;
        const oldValue = stateActions.get(action) || 0;
        const nextStateActions = this.qTable.get(nextState) || new Map();
        const nextMax = Math.max(...Array.from(nextStateActions.values()), 0);
        const newValue = oldValue + this.learningRate * (reward + this.discountFactor * nextMax - oldValue);
        stateActions.set(action, newValue);
    }

    private getRandomAction(): Action {
        const actions: Action[] = ['up', 'down', 'left', 'right'];
        return actions[Math.floor(Math.random() * actions.length)];
    }

    private getBestAction(stateActions: Map<Action, number>): Action {
        let bestAction: Action = 'up';
        let maxValue = -Infinity;
        for (const [action, value] of stateActions.entries()) {
        if (value > maxValue) {
            maxValue = value;
            bestAction = action;
        }
        }
        return bestAction;
    }
}