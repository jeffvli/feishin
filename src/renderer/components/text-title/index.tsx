import type { ReactNode } from 'react';
import { createPolymorphicComponent, Title as MantineHeader } from '@mantine/core';
import styled from 'styled-components';
import { textEllipsis } from '/@/renderer/styles';
import { StyleProps, StyledComponentsStyleProps } from '/@/renderer/components/shared';

export interface TextTitleProps extends StyleProps {
    $link?: boolean;
    $noSelect?: boolean;
    $secondary?: boolean;
    children?: ReactNode;
    order?: number;
    overflow?: 'hidden' | 'visible';
    to?: string;
    weight?: number;
}

const StyledTextTitle = styled(MantineHeader)<TextTitleProps & StyledComponentsStyleProps>`
    overflow: ${(props) => props.overflow};
    color: ${(props) => (props.$secondary ? 'var(--main-fg-secondary)' : 'var(--main-fg)')};
    cursor: ${(props) => props.$link && 'cursor'};
    user-select: ${(props) => (props.$noSelect ? 'none' : 'auto')};
    transition: color 0.2s ease-in-out;
    ${(props) => props.overflow === 'hidden' && !props.lineClamp && textEllipsis}

    &:hover {
        color: ${(props) => props.$link && 'var(--main-fg)'};
        text-decoration: ${(props) => (props.$link ? 'underline' : 'none')};
    }

    ${(props) => props.$bg && `background-color: ${props.$bg};`}
    ${(props) => props.$bottom && `bottom: ${props.$bottom};`}
    ${(props) => props.$display && `display: ${props.$display};`}
    ${(props) => props.$fw && `font-weight: ${props.$fw};`}
    ${(props) => props.$h && `height: ${props.$h};`}
    ${(props) => props.$left && `left: ${props.$left};`}
    ${(props) => props.$lts && `letter-spacing: ${props.$lts};`}
    ${(props) => props.$m && `margin: ${props.$m};`}
    ${(props) => props.$mah && `max-height: ${props.$mah};`}
    ${(props) => props.$maw && `max-width: ${props.$maw};`}
    ${(props) => props.$mb && `margin-bottom: ${props.$mb};`}
    ${(props) => props.$mih && `min-height: ${props.$mih};`}
    ${(props) => props.$miw && `min-width: ${props.$miw};`}
    ${(props) => props.$ml && `margin-left: ${props.$ml};`}
    ${(props) => props.$mr && `margin-right: ${props.$mr};`}
    ${(props) => props.$mt && `margin-top: ${props.$mt};`}
    ${(props) => props.$mx && `margin-left: ${props.$mx};`}
    ${(props) => props.$mx && `margin-right: ${props.$mx};`}
    ${(props) => props.$my && `margin-top: ${props.$my};`}
    ${(props) => props.$my && `margin-bottom: ${props.$my};`}
    ${(props) => props.$p && `padding: ${props.$p};`}
    ${(props) => props.$pb && `padding-bottom: ${props.$pb};`}
    ${(props) => props.$pl && `padding-left: ${props.$pl};`}
    ${(props) => props.$pos && `position: ${props.$pos};`}
    ${(props) => props.$pr && `padding-right: ${props.$pr};`}
    ${(props) => props.$pt && `padding-top: ${props.$pt};`}
    ${(props) => props.$px && `padding-left: ${props.$px};`}
    ${(props) => props.$px && `padding-right: ${props.$px};`}
    ${(props) => props.$py && `padding-top: ${props.$py};`}
    ${(props) => props.$py && `padding-bottom: ${props.$py};`}
    ${(props) => props.$right && `right: ${props.$right};`}
    ${(props) => props.$ta && `text-align: ${props.$ta};`}
    ${(props) => props.$td && `text-decoration: ${props.$td};`}
    ${(props) => props.$top && `top: ${props.$top};`}
    ${(props) => props.$tt && `text-transform: ${props.$tt};`}
    ${(props) => props.$w && `width: ${props.$w};`}
`;

const _TextTitle = ({
    children,
    order,
    $secondary,
    overflow,
    $noSelect,
    ...props
}: TextTitleProps) => {
    const {
        bg,
        bottom,
        display,
        fw,
        h,
        left,
        lts,
        m,
        mah,
        maw,
        mb,
        mih,
        miw,
        ml,
        mr,
        mt,
        mx,
        my,
        p,
        pb,
        pl,
        pos,
        pr,
        pt,
        px,
        py,
        right,
        ta,
        td,
        top,
        tt,
        w,
        ...htmlProps
    } = props;

    const styleProps = {
        $bg: bg,
        $bottom: bottom,
        $display: display,
        $fw: fw,
        $h: h,
        $left: left,
        $lts: lts,
        $m: m,
        $mah: mah,
        $maw: maw,
        $mb: mb,
        $mih: mih,
        $miw: miw,
        $ml: ml,
        $mr: mr,
        $mt: mt,
        $mx: mx,
        $my: my,
        $p: p,
        $pb: pb,
        $pl: pl,
        $pos: pos,
        $pr: pr,
        $pt: pt,
        $px: px,
        $py: py,
        $right: right,
        $ta: ta,
        $td: td,
        $top: top,
        $tt: tt,
        $w: w,
    };

    return (
        <StyledTextTitle
            $noSelect={$noSelect}
            $secondary={$secondary}
            order={order}
            overflow={overflow}
            {...styleProps}
            {...htmlProps}
        >
            {children}
        </StyledTextTitle>
    );
};

export const TextTitle = createPolymorphicComponent<'div', TextTitleProps>(_TextTitle);

_TextTitle.defaultProps = {
    $link: false,
    $noSelect: false,
    $secondary: false,
    overflow: 'visible',
    to: '',
    weight: 400,
};
