import { CSSProperties } from 'react';
import styled from 'styled-components';

export type StyleProps = {
    bg?: CSSProperties['backgroundColor'];
    bottom?: CSSProperties['bottom'];
    display?: CSSProperties['display'];
    fw?: CSSProperties['fontWeight'];
    h?: CSSProperties['height'];
    left?: CSSProperties['left'];
    lh?: CSSProperties['lineHeight'];
    lts?: CSSProperties['letterSpacing'];
    m?: CSSProperties['margin'];
    mah?: CSSProperties['maxHeight'];
    maw?: CSSProperties['maxWidth'];
    mb?: CSSProperties['marginBottom'];
    mih?: CSSProperties['minHeight'];
    miw?: CSSProperties['minWidth'];
    ml?: CSSProperties['marginLeft'];
    mr?: CSSProperties['marginRight'];
    mt?: CSSProperties['marginTop'];
    mx?: CSSProperties['marginLeft'] | CSSProperties['marginRight'];
    my?: CSSProperties['marginTop'] | CSSProperties['marginBottom'];
    p?: CSSProperties['padding'];
    pb?: CSSProperties['paddingBottom'];
    pl?: CSSProperties['paddingLeft'];
    pos?: CSSProperties['position'];
    pr?: CSSProperties['paddingRight'];
    pt?: CSSProperties['paddingTop'];
    px?: CSSProperties['paddingLeft'] | CSSProperties['paddingRight'];
    py?: CSSProperties['paddingTop'] | CSSProperties['paddingBottom'];
    right?: CSSProperties['right'];
    ta?: CSSProperties['textAlign'];
    td?: CSSProperties['textDecoration'];
    top?: CSSProperties['top'];
    tt?: CSSProperties['textTransform'];
    w?: CSSProperties['width'];
};

export type StyledComponentsStyleProps = {
    $bg?: CSSProperties['backgroundColor'];
    $bottom?: CSSProperties['bottom'];
    $display?: CSSProperties['display'];
    $fw?: CSSProperties['fontWeight'];
    $h?: CSSProperties['height'];
    $left?: CSSProperties['left'];
    $lh?: CSSProperties['lineHeight'];
    $lts?: CSSProperties['letterSpacing'];
    $m?: CSSProperties['margin'];
    $mah?: CSSProperties['maxHeight'];
    $maw?: CSSProperties['maxWidth'];
    $mb?: CSSProperties['marginBottom'];
    $mih?: CSSProperties['minHeight'];
    $miw?: CSSProperties['minWidth'];
    $ml?: CSSProperties['marginLeft'];
    $mr?: CSSProperties['marginRight'];
    $mt?: CSSProperties['marginTop'];
    $mx?: CSSProperties['marginLeft'] | CSSProperties['marginRight'];
    $my?: CSSProperties['marginTop'] | CSSProperties['marginBottom'];
    $p?: CSSProperties['padding'];
    $pb?: CSSProperties['paddingBottom'];
    $pl?: CSSProperties['paddingLeft'];
    $pos?: CSSProperties['position'];
    $pr?: CSSProperties['paddingRight'];
    $pt?: CSSProperties['paddingTop'];
    $px?: CSSProperties['paddingLeft'] | CSSProperties['paddingRight'];
    $py?: CSSProperties['paddingTop'] | CSSProperties['paddingBottom'];
    $right?: CSSProperties['right'];
    $ta?: CSSProperties['textAlign'];
    $td?: CSSProperties['textDecoration'];
    $top?: CSSProperties['top'];
    $tt?: CSSProperties['textTransform'];
    $w?: CSSProperties['width'];
};

export const DivWithStyleProps = styled.div<StyledComponentsStyleProps>`
    ${(props) => props.$bg && `background-color: ${props.$bg};`}
    ${(props) => props.$bottom && `bottom: ${props.$bottom};`}
    ${(props) => props.$display && `display: ${props.$display};`}
    ${(props) => props.$fw && `font-weight: ${props.$fw};`}
    ${(props) => props.$h && `height: ${props.$h};`}
    ${(props) => props.$left && `left: ${props.$left};`}
    ${(props) => props.$lh && `line-height: ${props.$lh};`}
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
