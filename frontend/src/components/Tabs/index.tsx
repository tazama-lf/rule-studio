import { memo } from "react";
import { useTab } from "../../contexts/TabContext/useTab";
import * as S from './Tabs.styles';

export type TabItem = {
    label: string;
    value: string;
    enabled: boolean
};

export interface TabsProps {
    tabs?: TabItem[];
    selected?: string;
    setSelected?: (value: string) => void;
}

const Tabs = ({ tabs: propTabs, selected: propSelected, setSelected: propSetSelected }: TabsProps = {}) => {
    const context = useTab()

    const tabs = propTabs ?? context.tabs
    const selected = propSelected ?? context.selectedTab
    const setSelected = propSetSelected ?? context.setSelectedTab

    return (
        <S.Wrapper>
            <S.TabsContainer>
                {tabs.map((item: TabItem) => {
                    const active = selected === item.value;

                    return (
                        <S.TabItemWrapper

                            active={active}
                            key={item.value}
                            onClick={() => item.enabled && setSelected(item.value)}
                        >
                            <S.TabLabel active={active}>
                                {item.label}
                            </S.TabLabel>

                            {active && (
                                <S.Underline layoutId="underline" />
                            )}
                        </S.TabItemWrapper>
                    );
                })}
            </S.TabsContainer>
        </S.Wrapper>
    );
};

export default memo(Tabs);
