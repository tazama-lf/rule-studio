import { memo } from "react";
import * as S from './Tabs.styles';

export type TabItem = {
    label: string;
    value: string;
    enabled: boolean
};

interface TabsProps {
    tabs: TabItem[];
    selectedTab: string;
}

const Tabs = ({ tabs, selectedTab }: TabsProps) => {
    const selected = selectedTab;

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
