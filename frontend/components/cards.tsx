import { Card, SvgIcon } from "@mui/material"
import { orange, blue, yellow, grey } from "@mui/material/colors"
import type { SvgIconProps } from "@mui/material"

export enum CardState {
  None = "none",
  Warm = "warm",
  Cool = "cool",
  Question = "question",
  QuestionWarm = "question_warm",
  QuestionCool = "question_cool",
  MoveOn = "move_on",
}

export function CardIcon({
  state,
  ...params
}: { state: CardState } & SvgIconProps) {
  params.fontSize = "large"
  switch (state) {
    case CardState.None:
      return <EmptyCardIcon color={grey[300]} {...params} />
    case CardState.Warm:
      return <SingleCardIcon color={orange[600]} {...params} />
    case CardState.Cool:
      return <SingleCardIcon color={blue[600]} {...params} />
    case CardState.Question:
      return <SingleCardIcon color={yellow[600]} {...params} />
    case CardState.QuestionWarm:
      return (
        <TwoCardIcon
          primaryColor={yellow[600]}
          secondaryColor={orange[600]}
          {...params}
        />
      )
    case CardState.QuestionCool:
      return (
        <TwoCardIcon
          primaryColor={yellow[600]}
          secondaryColor={blue[600]}
          {...params}
        />
      )
    case CardState.MoveOn:
      return (
        <TwoCardIcon
          primaryColor={orange[600]}
          secondaryColor={blue[600]}
          {...params}
        />
      )
    default:
      return <EmptyCardIcon {...params} />
  }
}

export function CardIconLegacy({
  warm,
  cool,
  question,
  ...params
}: { warm: boolean; cool: boolean; question: boolean } & SvgIconProps) {
  if (warm && cool) {
    return <CardIcon state={CardState.MoveOn} {...params} />
  } else if (warm && question) {
    return <CardIcon state={CardState.QuestionWarm} {...params} />
  } else if (cool && question) {
    return <CardIcon state={CardState.QuestionCool} {...params} />
  } else if (warm) {
    return <CardIcon state={CardState.Warm} {...params} />
  } else if (cool) {
    return <CardIcon state={CardState.Cool} {...params} />
  } else if (question) {
    return <CardIcon state={CardState.Question} {...params} />
  }
  return <CardIcon state={CardState.None} {...params} />
}

function EmptyCardIcon({ color, ...params }: any) {
  if (params.sx) {
    params.sx.color = color
  } else {
    params.sx = { color: color }
  }
  return (
    <SvgIcon {...params}>
      <path
        d="M 17 5
           v 14
           h -10
           v -14
           z
           m 0 -2
           h -10
           c -1.1 0 -2 .9 -2 2
           v 14
           c 0 1.1 .9 2 2 2
           h 10
           c 1.1 0 2 -.9 2 -2
           v -14
           c 0 -1.1 -.9 -2 -2 -2"
      />
    </SvgIcon>
  )
}

function SingleCardIcon({ color, ...params }: any) {
  if (params.sx) {
    params.sx.color = color
  } else {
    params.sx = { color: color }
  }
  return (
    <SvgIcon {...params}>
      <path
        d="M 7 3
           c -1.1 0 -2 .9 -2 2
           v 14
           c 0 1.1 .9 2 2 2
           h 10
           c 1.1 0 2 -.9 2 -2
           v -14
           c 0 -1.1 -.9 -2 -2 -2z"
      ></path>
    </SvgIcon>
  )
}

function TwoCardIcon({ primaryColor, secondaryColor, ...params }: any) {
  return (
    <SvgIcon {...params}>
      <path
        fill={secondaryColor}
        d="M 5 1
           c -1.1 0 -2 .9 -2 2
           v 14
           c 0 1.1 .9 2 2 2
           h 1
           v -12
           c 0 -2 .9 -3 3 -3
           h 9
           v -1
           c 0 -1.1 -.9 -2 -2 -2z"
      />
      <path
        fill={primaryColor}
        d="M 9 5
           c -1.1 0 -2 .9 -2 2
           v 14
           c 0 1.1 .9 2 2 2
           h 10
           c 1.1 0 2 -.9 2 -2
           v -14
           c 0 -1.1 -.9 -2 -2 -2z"
      />
    </SvgIcon>
  )
}
