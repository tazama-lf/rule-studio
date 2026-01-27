
export interface ViewRuleProps {
  data: Record<string, string>
}

const useViewRuleController = ({ data }: ViewRuleProps) => {
  return {
    values: {
      data
    },
    functions: {}
  }
}

export default useViewRuleController;
