import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController', () => ({
    ...jest.requireActual('../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController'),
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../../../src/pages/RuleEditor/Simulation/RulePipeline/DeployedRule', () => ({
    __esModule: true,
    default: ({ ruleId, build, canRun }: { ruleId?: number; build?: { buildId: string }; canRun: boolean }) => (
        <div data-testid="deployed-rule">deploy rule {String(ruleId)} from build {build?.buildId ?? 'none'} · canRun {String(canRun)}</div>
    ),
}));

import RulePipeline from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline';
import useRulePipelineController from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController';
import type { RuleBuild } from '../../../../../src/redux/Api/RulePipeline';

const mockController = useRulePipelineController as jest.MockedFunction<typeof useRulePipelineController>;
const functions = { handleBuild: jest.fn(), handleReport: jest.fn(), handleDownload: jest.fn() };

const build = (over: Partial<RuleBuild> = {}): RuleBuild => ({
    buildId: '7', ruleDbId: 50, ruleConfigId: 'amount102@1.0.0', ruleId: 'amount102', version: '1.0.0',
    status: 'passed', createdAt: '2026-11-04T10:00:00Z', hasReport: true,
    tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
    package: { file: 'tazama-lf-rule-amount102-1.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 10 },
    image: { ref: 'localhost:5055/tazama/default-rule-amount102:1.0.0', id: 'sha256:img', digest: 'sha256:man' },
    gitRepo: 'http://gitea:3000/tazama-rules/rule-amount102',
    durationsMs: { git: 1, start: 1, install: 1, test: 1, package: 1, assemble: 1, image: 1, push: 1 },
    ...over,
});

const setup = (values: Partial<ReturnType<typeof useRulePipelineController>['values']>) => {
    mockController.mockReturnValue({
        values: { build: undefined, chips: ['npm: http://verdaccio:4873', 'image: localhost:5055/tazama', 'git: off', 'deploy: tazama-core_default'], canBuild: true, running: false, starting: false, ...values },
        functions,
    });
    return render(<RulePipeline ruleId={50} canBuild />);
};

describe('RulePipeline', () => {
    beforeEach(() => jest.clearAllMocks());

    it('shows the configuration and starts a build, with no deploy option on Build & Test', async () => {
        setup({});

        expect(screen.getByText('npm: http://verdaccio:4873')).toBeInTheDocument();
        expect(screen.queryByText('Deploy to Tazama')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Build & Test/ }));
        expect(functions.handleBuild).toHaveBeenCalled();
        expect(screen.queryByText('View Test Report')).not.toBeInTheDocument();
        expect(screen.getByTestId('deployed-rule')).toHaveTextContent('deploy rule 50 from build none · canRun true');
    });

    it('hides the Build & Test button from users who cannot build', () => {
        setup({ canBuild: false, build: build() });

        expect(screen.queryByRole('button', { name: /Build & Test/ })).not.toBeInTheDocument();
        expect(screen.getByText('View Test Report')).toBeInTheDocument();
        expect(screen.getByTestId('deployed-rule')).toHaveTextContent('canRun false');
    });

    it('shows every result of a passed build, the stages up to the push, and hands the build to Deploy & Run', async () => {
        setup({ build: build() });

        expect(screen.getByText('All tests passed and every requested step worked.')).toBeInTheDocument();
        expect(screen.getByText('4/4 passed · coverage threshold not met')).toBeInTheDocument();
        expect(screen.getByText('sha512-abc')).toBeInTheDocument();
        expect(screen.getByText('digest sha256:man')).toBeInTheDocument();
        expect(screen.getByText('http://gitea:3000/tazama-rules/rule-amount102')).toBeInTheDocument();
        expect(screen.getByText('Push')).toBeInTheDocument();
        expect(screen.queryByText('Deploy')).not.toBeInTheDocument();
        expect(screen.getByTestId('deployed-rule')).toHaveTextContent('from build 7');

        await userEvent.click(screen.getByText('View Test Report'));
        await userEvent.click(screen.getByText('Download Package'));
        expect(functions.handleReport).toHaveBeenCalled();
        expect(functions.handleDownload).toHaveBeenCalled();
    });

    it('explains a failed build and offers no package', () => {
        setup({ build: build({ status: 'failed', tests: { total: 13, passed: 4, failed: 9, success: false, coverageThresholdMet: false }, package: undefined, image: undefined, gitRepo: undefined }) });

        expect(screen.getByText(/9 of 13 unit tests failed/)).toBeInTheDocument();
        expect(screen.queryByText('Download Package')).not.toBeInTheDocument();
        expect(screen.getByText('View Test Report')).toBeInTheDocument();
    });

    it('shows progress and blocks a second build while one runs', () => {
        setup({ running: true, build: build({ status: 'running', stage: 'image', durationsMs: undefined }) });

        expect(screen.getAllByText('Image…').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: /Building/ })).toBeDisabled();
    });

    it('offers the test report as soon as the unit tests ran, while the build goes on', async () => {
        setup({ running: true, build: build({ status: 'running', stage: 'image', durationsMs: undefined, package: undefined, image: undefined, gitRepo: undefined }) });

        expect(screen.getByText('4/4 passed · coverage threshold not met')).toBeInTheDocument();
        await userEvent.click(screen.getByText('View Test Report'));
        expect(functions.handleReport).toHaveBeenCalled();
        expect(screen.queryByText('Download Package')).not.toBeInTheDocument();
    });
});
