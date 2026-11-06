import { act, renderHook } from '@testing-library/react';
import toast from 'react-hot-toast';

const mockOpen = jest.fn();
jest.mock('../../../../../src/contexts/ModalContext', () => ({ useModal: () => ({ open: mockOpen }) }));
jest.mock('../../../../../src/utils/Common/storage', () => ({ getAuthToken: () => 'jwt' }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const mockStart = jest.fn();
const mockGetBuild = jest.fn();
let mockConfig: unknown;
let mockLatest: unknown;
jest.mock('../../../../../src/redux/Api/RulePipeline', () => ({
    rulePipelineUrl: 'http://api/rule-pipeline',
    useGetPipelineConfigQuery: () => ({ data: mockConfig }),
    useGetLatestRuleBuildQuery: () => ({ data: mockLatest }),
    useStartRuleBuildMutation: () => [mockStart, { isLoading: false }],
    useGetRuleBuildQuery: (...args: unknown[]) => mockGetBuild(...args),
}));

import useRulePipelineController, { describeConfig, describeStatus, stageState } from '../../../../../src/pages/RuleEditor/Simulation/RulePipeline/useRulePipelineController';
import type { RuleBuild, RulePipelineConfig } from '../../../../../src/redux/Api/RulePipeline';

const config: RulePipelineConfig = {
    enabled: true,
    npm: { source: 'offline', cache: '/data/npm-cache' },
    image: { build: true, registry: 'localhost:5000', namespace: 'tazama' },
    git: { kind: 'gitea', url: 'http://gitea:3000', owner: 'tazama-rules', branch: 'staging' },
};

const build = (over: Partial<RuleBuild> = {}): RuleBuild => ({
    buildId: '7', ruleDbId: 50, ruleConfigId: 'amount102@1.0.0', ruleId: 'amount102', version: '1.0.0',
    status: 'passed', simulate: true, createdAt: '2026-11-04T10:00:00Z', hasReport: true,
    tests: { total: 4, passed: 4, failed: 0, success: true, coverageThresholdMet: false },
    package: { file: 'tazama-lf-rule-amount102-1.0.0.tgz', integrity: 'sha512-abc', shasum: 'def', size: 10 },
    durationsMs: { git: 1, start: 1, install: 1, test: 1, package: 1, assemble: 1, image: 1, push: 1 },
    simulation: { ok: true, upMs: 17000, subject: 'sub-rule-amount102@1.0.0' },
    ...over,
});

describe('describeConfig', () => {
    it('summarises each store, including when it is not used', () => {
        expect(describeConfig(config)).toEqual(['npm: offline cache, no network', 'image: push to localhost:5000', 'git: gitea tazama-rules (staging)']);
        expect(describeConfig({ ...config, git: { kind: 'github' } })[2]).toBe('git: github');
        expect(describeConfig({ ...config, npm: { source: 'mirror', registry: 'http://verdaccio:4873' }, image: { build: false, namespace: 't' }, git: { kind: 'none' } }))
            .toEqual(['npm: mirror http://verdaccio:4873', 'image: off (package only)', 'git: off']);
        expect(describeConfig({ ...config, npm: { source: 'public' }, image: { build: true, namespace: 't' } })[0]).toBe('npm: npmjs + GitHub Packages');
        expect(describeConfig({ ...config, image: { build: true, namespace: 't' } })[1]).toBe('image: kept on the Docker host');
        expect(describeConfig(undefined)).toEqual([]);
    });
});

describe('stageState', () => {
    it('marks stages before the current one done while a build runs', () => {
        const running = build({ status: 'running', stage: 'test', durationsMs: undefined });
        expect(stageState(running, 'install')).toBe('done');
        expect(stageState(running, 'test')).toBe('current');
        expect(stageState(running, 'image')).toBe('pending');
        expect(stageState(build({ status: 'queued', stage: undefined }), 'git')).toBe('pending');
    });

    it('marks stages that did not run as skipped once a build finished', () => {
        const failed = build({ status: 'failed', durationsMs: { git: 1, start: 1, install: 1, test: 1 }, simulation: undefined });
        expect(stageState(failed, 'test')).toBe('done');
        expect(stageState(failed, 'package')).toBe('skipped');
        expect(stageState(failed, 'simulate')).toBe('skipped');
        expect(stageState(build(), 'simulate')).toBe('done');
    });
});

describe('describeStatus', () => {
    it('explains every status', () => {
        expect(describeStatus(build({ status: 'queued' })).severity).toBe('info');
        expect(describeStatus(build({ status: 'running', stage: 'image' })).text).toBe('Running: Image…');
        expect(describeStatus(build()).severity).toBe('success');
        expect(describeStatus(build({ status: 'failed', tests: { total: 13, passed: 4, failed: 9, success: false, coverageThresholdMet: false } })))
            .toEqual({ severity: 'error', text: '9 of 13 unit tests failed, so nothing was packaged.' });
        expect(describeStatus(build({ status: 'error', error: 'Simulation failed: boom' })).text).toBe('Simulation failed: boom');
    });
});

describe('useRulePipelineController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConfig = config;
        mockLatest = { build: null };
        mockGetBuild.mockReturnValue({ data: undefined });
    });

    it('shows the latest build of the rule when the tab opens', () => {
        mockLatest = { build: build() };
        mockGetBuild.mockImplementation((id: string) => ({ data: id ? build() : undefined }));

        const { result } = renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: true }));

        expect(mockGetBuild).toHaveBeenLastCalledWith('7', { skip: false, pollingInterval: 0 });
        expect(result.current.values.build?.buildId).toBe('7');
        expect(result.current.values.chips).toHaveLength(3);
    });

    it('starts a build with simulation and polls it until it finishes, then says how it went', async () => {
        mockStart.mockReturnValue({ unwrap: () => Promise.resolve(build({ buildId: '8', status: 'queued' })) });
        let current: RuleBuild | undefined;
        mockGetBuild.mockImplementation((id: string) => ({ data: id ? current : undefined }));
        const { result, rerender } = renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: true }));

        current = build({ buildId: '8', status: 'queued' });
        await act(async () => { await result.current.functions.handleBuild(); });

        expect(mockStart).toHaveBeenCalledWith({ ruleId: 50, simulate: true });
        expect(mockGetBuild).toHaveBeenLastCalledWith('8', { skip: false, pollingInterval: 2000 });

        current = build({ buildId: '8', status: 'running', stage: 'image' });
        rerender();
        expect(result.current.values.running).toBe(true);

        current = build({ buildId: '8' });
        rerender();
        expect(toast.success).toHaveBeenCalledWith('All tests passed and every requested step worked.');
        expect(mockGetBuild).toHaveBeenLastCalledWith('8', { skip: false, pollingInterval: 0 });
    });

    it('does not ask for a simulation when images are switched off', async () => {
        mockConfig = { ...config, image: { build: false, namespace: 'tazama' } };
        mockStart.mockReturnValue({ unwrap: () => Promise.resolve(build({ status: 'queued' })) });
        const { result } = renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: true }));

        await act(async () => { await result.current.functions.handleBuild(); });

        expect(mockStart).toHaveBeenCalledWith({ ruleId: 50, simulate: false });
        expect(result.current.values.canSimulate).toBe(false);
    });

    it('opens the report and downloads the package with the user token', async () => {
        mockLatest = { build: build() };
        mockGetBuild.mockImplementation((id: string) => ({ data: id ? build() : undefined }));
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['tgz'])) });
        global.fetch = fetchMock as unknown as typeof fetch;
        URL.createObjectURL = jest.fn(() => 'blob:x');
        URL.revokeObjectURL = jest.fn();
        const { result } = renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: true }));

        act(() => { result.current.functions.handleReport(); });
        await act(async () => { await result.current.functions.handleDownload(); });

        expect(mockOpen).toHaveBeenCalledWith('Test Report', expect.anything(), null, { maxWidth: 'xl' });
        expect(fetchMock).toHaveBeenCalledWith('http://api/rule-pipeline/builds/7/package', { headers: { authorization: 'Bearer jwt' } });
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    });

    it('reports a failed download', async () => {
        mockLatest = { build: build() };
        mockGetBuild.mockImplementation((id: string) => ({ data: id ? build() : undefined }));
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
        const { result } = renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: true }));

        await act(async () => { await result.current.functions.handleDownload(); });

        expect(toast.error).toHaveBeenCalledWith('Failed to download the package');
    });

    it('lets nobody build without a rule id or the editor claim', () => {
        expect(renderHook(() => useRulePipelineController({ ruleId: undefined, canBuild: true })).result.current.values.canBuild).toBe(false);
        expect(renderHook(() => useRulePipelineController({ ruleId: 50, canBuild: false })).result.current.values.canBuild).toBe(false);
    });
});
