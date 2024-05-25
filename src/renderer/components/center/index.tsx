import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { Center as MantineCenter } from '@mantine/core';
import styled from 'styled-components';
import { StyleProps, StyledComponentsStyleProps } from '/@/renderer/components/shared';

interface CenterProps extends HTMLAttributes<HTMLDivElement>, StyleProps {
    children?: ReactNode;
    inline?: boolean;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(
    ({ inline, children, ...props }: CenterProps, ref) => {
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
            <StyledCenter
                ref={ref}
                inline={inline}
                {...styleProps}
                {...htmlProps}
            >
                {children}
            </StyledCenter>
        );
    },
);

const StyledCenter = styled(MantineCenter)<StyledComponentsStyleProps>`
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
