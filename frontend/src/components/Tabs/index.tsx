import { memo } from "react";
import { useTab } from "../../contexts/TabContext/useTab";
import * as S from './Tabs.styles';

export type TabItem = {
    label: string;
    value: string;
    enabled: boolean
};

const Tabs = () => {
    const context = useTab()

    const tabs = context.tabs
    const selected = context.selectedTab

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
