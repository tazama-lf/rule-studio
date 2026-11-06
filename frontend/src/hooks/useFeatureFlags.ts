import { useGetFeaturesQuery } from "../redux/Api/Features";

export interface FeatureFlagsHookResult {
    isLoading: boolean;
    isDockerPublishEnabled: boolean;
    isSimStudioEnabled: boolean;
    isRulePipelineEnabled: boolean;
}

// While loading or on error, features are reported as disabled so the UI does
// not flash a feature that later turns out to be off.
export const useFeatureFlags = (): FeatureFlagsHookResult => {
    const { data, isLoading, isError } = useGetFeaturesQuery();

    if (isLoading || isError || !data) {
        return { isLoading, isDockerPublishEnabled: false, isSimStudioEnabled: false, isRulePipelineEnabled: false };
    }
    return {
        isLoading: false,
        isDockerPublishEnabled: data.dockerPublish,
        isSimStudioEnabled: data.simStudio,
        isRulePipelineEnabled: data.rulePipeline ?? false,
    };
};
