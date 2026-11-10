import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const mockDeploy = jest.fn();
const mockRunRule = jest.fn();
const mockRunEndToEnd = jest.fn();
let mockDeployment: unknown;
let mockDeployed: unknown;
jest.mock('../../../../../src/redux/Api/RulePipeline', () => ({
    useGetRuleDeploymentQuery: () => ({ data: mockDeployment }),
    useDeployRuleMutation: () => [mockDeploy, { isLoading: false, data: mockDeployed }],
    useRunDeployedRuleMutation: () => [mockRunRule, { isLoading: false }],
    useRunEndToEndMutation: () => [mockRunEndToEnd, { isLoading: false }],
}));

import DeployedRule from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline/DeployedRule';
import type { RuleBuild, RuleDeployment, RuleRun } from '../../../../../src/redux/Api/RulePipeline';

const build = (over: Partial<RuleBuild> = {}): RuleBuild => ({
    buildId: '12', ruleDbId: 24, ruleConfigId: '021@4.0.0', ruleId: '021', version: '4.0.0',
    status: 'passed', createdAt: '2026-11-10T10:00:00Z', hasReport: true,
    image: { ref: 'localhost:5055/tazama/default-rule-021:4.0.0', id: 'sha256:img', digest: 'sha256:man' },
    ...over,
});

const running: RuleDeployment = {
    enabled: true, deployed: true, state: 'deployed', restarts: 0, current: true, container: 'trs-default-rule-021', network: 'tazama-core_default',
    rule: '021@4.0.0', image: 'localhost:5055/tazama/default-rule-021@sha256:man', startedAt: '2026-11-10T10:05:00Z',
};

const reason = 'Insufficient transaction history';
const ruleRun: RuleRun = {
    kind: 'rule', ok: true, msgId: 'm1', ranAt: '2026-11-10T10:06:00Z', tookMs: 20, reason,
    result: { id: '021@4.0.0', cfg: '4.0.0', subRuleRef: '.x01', indpdntVarbl: 0, prcgTm: 2329104 },
};
const e2eRun: RuleRun = {
    kind: 'e2e', ok: true, msgId: 'm2', ranAt: '2026-11-10T10:07:00Z', tookMs: 1200, reason,
    result: { id: '021@4.0.0', cfg: '4.0.0', subRuleRef: '.x01', indpdntVarbl: 0, wght: 0 },
    alert: {
        transactionID: 'tx-1',
        transaction: { TxTp: 'pacs.002.001.12' },
        report: {
            evaluationID: 'ev-1',
            status: 'NALT',
            tadpResult: {
                typologyResult: [
                    {
                        cfg: 'trs-021@4.0.0', result: 0, workflow: { alertThreshold: 200, interdictionThreshold: 400 },
                        ruleResults: [{ id: 'EFRuP@4.0.0', subRuleRef: 'none', indpdntVarbl: 0, wght: 0 }, { id: '021@4.0.0', subRuleRef: '.x01', indpdntVarbl: 0, wght: 0 }],
                    },
                    { cfg: '999-901-902@4.0.0', result: 100, ruleResults: [{ id: '901@4.0.0', subRuleRef: '.01', indpdntVarbl: 1, wght: 100 }] },
                ],
            },
        },
    },
};

const resolved = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });

describe('DeployedRule', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDeployment = { enabled: true, deployed: false, network: 'tazama-core_default' };
        mockDeployed = undefined;
    });

    it('renders nothing when deployment is not configured', () => {
        mockDeployment = { enabled: false, deployed: false };
        const { container } = render(<DeployedRule ruleId={24} build={build()} canRun />);
        expect(container).toBeEmptyDOMElement();
    });

    it('deploys the image of a passed build, and only then allows runs', async () => {
        mockDeploy.mockReturnValue(resolved({ ok: true, container: 'trs-default-rule-021' }));
        render(<DeployedRule ruleId={24} build={build()} canRun />);

        expect(screen.getByText('Not deployed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Run rule/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Run end to end/ })).toBeDisabled();
        expect(screen.getByText('Deploy the image of build #12 to run this rule in Tazama.')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /Deploy to Tazama/ }));
        expect(mockDeploy).toHaveBeenCalledWith(24);
        expect(toast.success).toHaveBeenCalledWith('Deployed to trs-default-rule-021');
    });

    it('cannot deploy before Build & Test passes', () => {
        render(<DeployedRule ruleId={24} build={build({ status: 'failed', image: undefined })} canRun />);

        expect(screen.getByRole('button', { name: /Deploy to Tazama/ })).toBeDisabled();
        expect(screen.getByText('Build & Test has to pass before its image can be deployed.')).toBeInTheDocument();
    });

    it('shows a deployment that failed', () => {
        mockDeployed = { ok: false, error: 'Updating network map 4.0.0 failed: HTTP 400' };
        render(<DeployedRule ruleId={24} build={build()} canRun />);

        expect(screen.getByText('Deployment failed: Updating network map 4.0.0 failed: HTTP 400')).toBeInTheDocument();
    });

    it('runs the deployed rule and end to end, as often as asked', async () => {
        mockDeployment = running;
        mockRunRule.mockReturnValue(resolved(ruleRun));
        mockRunEndToEnd.mockReturnValue(resolved(e2eRun));
        render(<DeployedRule ruleId={24} build={build()} canRun />);

        expect(screen.getByText('Deployed')).toBeInTheDocument();
        expect(screen.getByText(/trs-default-rule-021 on tazama-core_default · connected to NATS, up since/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Redeploy/ })).toBeEnabled();
        await userEvent.click(screen.getByRole('button', { name: /Run rule/ }));
        await userEvent.click(screen.getByRole('button', { name: /Run rule/ }));
        await userEvent.click(screen.getByRole('button', { name: /Run end to end/ }));

        expect(mockRunRule).toHaveBeenNthCalledWith(2, 24);
        expect(mockRunEndToEnd).toHaveBeenCalledWith(24);
        expect(toast.success).toHaveBeenCalledWith('Rule: .x01 · Insufficient transaction history');
        expect(toast.success).toHaveBeenCalledWith('End to end: .x01 · Insufficient transaction history');
    });

    it('shows the raw rule result and the whole alert of the end-to-end run', () => {
        mockDeployment = { ...running, runs: { rule: ruleRun, e2e: e2eRun } };
        render(<DeployedRule ruleId={24} build={build()} canRun />);

        expect(screen.getByText('Rule result')).toBeInTheDocument();
        expect(screen.getByText('.x01 · Insufficient transaction history · independent variable 0')).toBeInTheDocument();
        expect(screen.getByText(/took 20 ms · message m1/)).toBeInTheDocument();
        expect(screen.getByText('Rule result, as the rule returned it')).toBeInTheDocument();
        expect(screen.getByText(/"prcgTm": 2329104/)).toBeInTheDocument();

        expect(screen.getByText('End-to-end evaluation')).toBeInTheDocument();
        expect(screen.getByText('No alert')).toBeInTheDocument();
        expect(screen.getByText('This rule: .x01 · Insufficient transaction history · independent variable 0')).toBeInTheDocument();
        expect(screen.getByText('Typology trs-021@4.0.0 · score 0 (alert at 200, interdiction at 400)')).toBeInTheDocument();
        expect(screen.getByText('Typology 999-901-902@4.0.0 · score 100')).toBeInTheDocument();
        expect(screen.getByText('901@4.0.0 → .01 · indpdntVarbl 1 · wght 100')).toBeInTheDocument();
        expect(screen.getByText('Evaluation ev-1')).toBeInTheDocument();
        expect(screen.getByText('Alert, as Tazama stored it')).toBeInTheDocument();
        expect(screen.getByText(/"transactionID": "tx-1"/)).toBeInTheDocument();
    });

    it('calls a rule deployed only once its container runs and has connected to NATS', () => {
        mockDeployment = { ...running, state: 'starting' };
        const { rerender } = render(<DeployedRule ruleId={24} build={build()} canRun />);
        expect(screen.getByText('Starting')).toBeInTheDocument();
        expect(screen.getByText('The rule is starting. It counts as deployed once it has connected to NATS.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Run rule/ })).toBeDisabled();

        mockDeployment = { ...running, state: 'restarting', restarts: 3 };
        rerender(<DeployedRule ruleId={24} build={build()} canRun />);
        expect(screen.getByText('Restarting')).toBeInTheDocument();
        expect(screen.getByText(/3 restarts/)).toBeInTheDocument();
        expect(screen.getByText('The rule container is restarting. Redeploy it or check its logs.')).toBeInTheDocument();

        mockDeployment = { ...running, state: 'stopped', exitCode: 137 };
        rerender(<DeployedRule ruleId={24} build={build()} canRun />);
        expect(screen.getByText('Stopped')).toBeInTheDocument();
        expect(screen.getByText(/exited with code 137/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Run end to end/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Redeploy|Deploy to Tazama/ })).toBeEnabled();

        mockDeployment = { ...running, current: false, rule: '021@3.0.0' };
        rerender(<DeployedRule ruleId={24} build={build()} canRun />);
        expect(screen.getByText('Runs 021@3.0.0')).toBeInTheDocument();
    });

    it('shows runs that failed', () => {
        mockDeployment = {
            ...running,
            runs: {
                rule: { kind: 'rule', ok: false, ranAt: '2026-11-10T10:06:00Z', tookMs: 3, error: '021@4.0.0 is not deployed; deploy it first' },
                e2e: { kind: 'e2e', ok: false, ranAt: '2026-11-10T10:07:00Z', tookMs: 60000, error: 'No evaluation for m2 within 60 s' },
            },
        };
        render(<DeployedRule ruleId={24} build={build()} canRun />);

        expect(screen.getAllByText('Failed')).toHaveLength(2);
        expect(screen.getByText('021@4.0.0 is not deployed; deploy it first')).toBeInTheDocument();
        expect(screen.getByText('No evaluation for m2 within 60 s')).toBeInTheDocument();
    });

    it('lets only editors deploy and run, while everyone sees the results', () => {
        mockDeployment = { ...running, runs: { rule: ruleRun } };
        render(<DeployedRule ruleId={24} build={build()} canRun={false} />);

        expect(screen.queryByRole('button', { name: /Run rule/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Deploy/ })).not.toBeInTheDocument();
        expect(screen.getByText('Rule result')).toBeInTheDocument();
    });
});
