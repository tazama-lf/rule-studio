import { useEffect, useMemo, useState } from "react";
import type { DropdownOption } from "../../../../components/DropDown";
import { useGetRuleConfigsIdsQuery, useLazyGetRuleConfigQuery } from "../../../../redux/Api/Rules";
import { useModal } from "../../../../contexts/ModalContext";

export interface RuleConfigProps {
  handleRuleValue: (val: DropdownOption) => void,
  ruleConfigId: string | undefined,
  mode: string | null
}

interface IRuleId {
  ruleid: string,
  rulecfg: string,
  tenantid: string,
}

const useRuleConfigController = ({ handleRuleValue, ruleConfigId, mode }: RuleConfigProps) => {

  const { data, isLoading } = useGetRuleConfigsIdsQuery({})
  const [submit, { isLoading: configLoader }] = useLazyGetRuleConfigQuery()
  const { close } = useModal()

  const [selection, setSelection] = useState<DropdownOption | null>(null);
  const [json, setJson] = useState(null)

  // Derive the current selection: user's in-modal pick wins; otherwise resolve
  // the incoming ruleConfigId against loaded data so the DropDown renders the
  // matching option's label. If no match (or data not yet loaded), fall back
  // to using the raw prop for both label and value.
  const ruleId = useMemo<DropdownOption | null>(() => {
    if (selection) return selection
    if (!ruleConfigId) return null
    if (data) {
      const match = (data as IRuleId[]).find((item) => item.ruleid === ruleConfigId)
      if (match) return { label: match.ruleid, value: match.ruleid }
    }
    return { label: ruleConfigId, value: ruleConfigId }
  }, [selection, ruleConfigId, data])

  useEffect(() => {
    if (ruleId) {
      submit({ id: ruleId.value }).then((res) => {
        if (res?.data) {
          setJson(res?.data)
        }
      })
    }
  }, [ruleId, submit])

  const handleRuleId = (value: DropdownOption) => {
    setSelection(value)
  }

  const handleConfirm = () => {
    if (ruleId) {
      handleRuleValue(ruleId)
    }
    close()
  }

  return {
    values: {
      ruleConfigs: data?.map((item: IRuleId) => ({ label: item.ruleid, value: item.ruleid })),
      ruleId,
      isLoading,
      configLoader,
      json,
      isView: mode === 'view' || mode === 'edit'
    },
    functions: {
      handleRuleId,
      handleConfirm
    }
  }
}

export default useRuleConfigController;
