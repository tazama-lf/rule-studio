import { useEffect, useState } from "react";
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

  const [ruleId, setRuleId] = useState<DropdownOption | null>(ruleConfigId ? { label: ruleConfigId, value: ruleConfigId } : null);
  const [json, setJson] = useState(null)

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
    setRuleId(value)
  }

  const handleConfirm = () => {
    if (ruleId) {
      handleRuleValue(ruleId)
    }
    close()
  }

  return {
    values: {
      ruleConfigs: data?.map((item: IRuleId) => ({ label: `${item.ruleid} (${item.rulecfg})`, value: `${item.ruleid}@${item.rulecfg}` })),
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
