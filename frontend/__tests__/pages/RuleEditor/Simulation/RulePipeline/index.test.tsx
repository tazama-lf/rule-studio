import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController', () => ({
    ...jest.requireActual('../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController'),
    __esModule: true,
    default: jest.fn(),
}));

import RulePipeline from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline';
import useRulePipelineController from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController';
import type { RuleBuild } from '../../../../../src/redux/Api/RulePipeline';

const mockController = useRulePipelineController as jest.MockedFunction<typeof useRulePipelineController>;
const functions = { setSimulate: jest.fn(), handleBuild: jest.fn(), handleReport: jest.fn(), handleDownload: jest.fn() };

const build = (over: Partial<RuleBuild> = {}): RuleBuild => ({
    buildId: '7', ruleDbId: 50, ruleConfigId: 'amount102@1.0.0', ruleId: 'amount102', version: '1.0.0',
    status: 'passed', simulate: true, createdAt: '2026-11-04T10:00:00Z', hasReport: true,
    tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
    package: { file: 'tazama-lf-rule-amount102-1.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 10 },
    image: { ref: 'localhost:5000/tazama/rule-amount102:1.0.0', id: 'sha256:img', digest: 'sha256:man' },
    gitRepo: 'http://gitea:3000/tazama-rules/rule-amount102',
    durationsMs: { git: 1, start: 1, install: 1, test: 1, package: 1, assemble: 1, image: 1, push: 1 },
    simulation: { ok: true, upMs: 17000, subject: 'sub-rule-amount102@1.0.0' },
    ...over,
});

const setup = (values: Partial<ReturnType<typeof useRulePipelineController>['values']>) => {
    mockController.mockReturnValue({
        values: { build: undefined, chips: ['npm: offline cache, no network', 'image: push to localhost:5000', 'git: off'], simulate: true, canSimulate: true, canBuild: true, running: false, starting: false, ...values },
        functions,
    });
    return render(<RulePipeline ruleId={50} canBuild />);
};

describe('RulePipeline', () => {
    beforeEach(() => jest.clearAllMocks());

    it('shows the configuration and starts a build', async () => {
        setup({});

        expect(screen.getByText('npm: offline cache, no network')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /Build & Test/ }));
        expect(functions.handleBuild).toHaveBeenCalled();
        expect(screen.queryByText('View Test Report')).not.toBeInTheDocument();
    });

    it('hides the Build & Test controls from users who cannot build', () => {
        setup({ canBuild: false, build: build() });

        expect(screen.queryByRole('button', { name: /Build & Test/ })).not.toBeInTheDocument();
        expect(screen.getByText('View Test Report')).toBeInTheDocument();
    });

    it('shows every result of a passed build and enables the report and the download', async () => {
        setup({ build: build() });

        expect(screen.getByText('All tests passed and every requested step worked.')).toBeInTheDocument();
        expect(screen.getByText('4/4 passed · coverage threshold not met')).toBeInTheDocument();
        expect(screen.getByText('sha512-abc')).toBeInTheDocument();
        expect(screen.getByText('digest sha256:man')).toBeInTheDocument();
        expect(screen.getByText('http://gitea:3000/tazama-rules/rule-amount102')).toBeInTheDocument();
        expect(screen.getByText(/Up in 17.0 s, listening on sub-rule-amount102@1.0.0/)).toBeInTheDocument();

        await userEvent.click(screen.getByText('View Test Report'));
        await userEvent.click(screen.getByText('Download Package'));
        expect(functions.handleReport).toHaveBeenCalled();
        expect(functions.handleDownload).toHaveBeenCalled();
    });

    it('explains a failed build and offers no package', () => {
        setup({ build: build({ status: 'failed', tests: { total: 13, passed: 4, failed: 9, success: false, coverageThresholdMet: false }, package: undefined, image: undefined, gitRepo: undefined, simulation: undefined }) });

        expect(screen.getByText('9 of 13 unit tests failed, so nothing was packaged.')).toBeInTheDocument();
        expect(screen.getByText('Download Package').closest('button')).toBeDisabled();
        expect(screen.getByText('View Test Report').closest('button')).not.toBeDisabled();
    });

    it('shows progress and blocks a second build while one runs', () => {
        setup({ running: true, build: build({ status: 'running', stage: 'image', durationsMs: undefined, simulation: undefined }) });

        expect(screen.getByText('Running: Image…')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Building/ })).toBeDisabled();
    });

    it('reports a simulation that did not start', () => {
        setup({ build: build({ status: 'error', error: 'Simulation failed: no rule processor', simulation: { ok: false, error: 'no rule processor' } }) });

        expect(screen.getByText('Simulation failed: no rule processor')).toBeInTheDocument();
        expect(screen.getByText('Did not start: no rule processor')).toBeInTheDocument();
    });
});
