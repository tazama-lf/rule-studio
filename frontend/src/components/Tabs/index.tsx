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

const Tabs = ({ variant = 'default' }: TabsProps) => {
    const defaultContext = variant === 'default' ? useTab() : null;
    const maskingContext = variant === 'masking' ? useMaskingTab() : null;
    
    const context = defaultContext || maskingContext;
    
    if (!context) {
        return null;
    }

    const tabs = context.tabs;
    const selected = context.selectedTab;

    return (
        <S.Wrapper>
            <S.TabsContainer>
                {tabs.map((item: TabItem) => {
                    const active = selected === item.value;

                    return (
                        <S.TabItemWrapper
                            active={active}
                            key={item.value}
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
