import { memo } from "react";
import { useTab } from "../../contexts/TabContext/useTab";
import { useMaskingTab } from "../../contexts/MaskingTabContext/useMaskingTab";
import * as S from './Tabs.styles';

export type TabItem = {
    label: string;
    value: string;
    enabled: boolean
};

interface TabsProps {
    variant?: 'default' | 'masking';
}

const TabList = ({ tabs, selected }: { tabs: TabItem[]; selected: string }) => (
    <S.Wrapper>
        <S.TabsContainer>
            {tabs.map((item: TabItem) => {
                const active = selected === item.value;
                return (
                    <S.TabItemWrapper active={active} key={item.value}>
                        <S.TabLabel active={active}>{item.label}</S.TabLabel>
                        {active && <S.Underline layoutId="underline" />}
                    </S.TabItemWrapper>
                );
            })}
        </S.TabsContainer>
    </S.Wrapper>
);

const DefaultTabs = () => {
    const { tabs, selectedTab } = useTab();
    return <TabList tabs={tabs} selected={selectedTab} />;
};

const MaskingTabs = () => {
    const { tabs, selectedTab } = useMaskingTab();
    return <TabList tabs={tabs} selected={selectedTab} />;
};

const Tabs = ({ variant = 'default' }: TabsProps) => {
    if (variant === 'masking') return <MaskingTabs />;
    return <DefaultTabs />;
};

export default memo(Tabs);
