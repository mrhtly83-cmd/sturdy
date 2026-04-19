// src/data/scenarios.ts
// Demo scenarios used in TypingDemo + future web landing page

import { colors as C } from '../theme';

export type ScenarioStep = {
  label: string;
  dot: string;
  bg: string;
  border: string;
  action: string;
  script: string;
};

export type Scenario = {
  text: string;
  steps: ScenarioStep[];
};

export const SCENARIOS: Scenario[] = [
  {
    text: "My 4-year-old won't leave the playground",
    steps: [
      { label: 'REGULATE', dot: C.sage,  bg: 'rgba(138,160,96,0.08)',  border: 'rgba(138,160,96,0.18)',  action: 'Get low. One slow breath.', script: '"You\'re really upset about leaving the playground."' },
      { label: 'CONNECT',  dot: C.blue,  bg: 'rgba(87,120,163,0.08)',  border: 'rgba(87,120,163,0.18)',  action: 'Stay close. Hold the limit.', script: '"You were having so much fun and you don\'t want to stop."' },
      { label: 'GUIDE',    dot: C.amber, bg: 'rgba(212,148,74,0.08)',  border: 'rgba(212,148,74,0.18)',  action: 'Stand up. Start walking.', script: '"We\'re going now. Hold my hand or I\'ll carry you."' },
    ],
  },
  {
    text: "My 10-year-old refuses to do homework",
    steps: [
      { label: 'REGULATE', dot: C.sage,  bg: 'rgba(138,160,96,0.08)',  border: 'rgba(138,160,96,0.18)',  action: 'Sit next to him. Lower your voice.', script: '"This homework is really frustrating right now."' },
      { label: 'CONNECT',  dot: C.blue,  bg: 'rgba(87,120,163,0.08)',  border: 'rgba(87,120,163,0.18)',  action: "Don't touch the homework.", script: '"You\'re stuck and it feels impossible. I\'m here."' },
      { label: 'GUIDE',    dot: C.amber, bg: 'rgba(212,148,74,0.08)',  border: 'rgba(212,148,74,0.18)',  action: 'Point to one problem.', script: '"Just this one. Show me where you\'re stuck."' },
    ],
  },
  {
    text: "My 7-year-old hit her brother again",
    steps: [
      { label: 'REGULATE', dot: C.sage,  bg: 'rgba(138,160,96,0.08)',  border: 'rgba(138,160,96,0.18)',  action: 'Move between them. Breathe.', script: '"That was a big reaction."' },
      { label: 'CONNECT',  dot: C.blue,  bg: 'rgba(87,120,163,0.08)',  border: 'rgba(87,120,163,0.18)',  action: 'Face her. Stay calm.', script: '"You were really angry at your brother. I won\'t let hitting happen."' },
      { label: 'GUIDE',    dot: C.amber, bg: 'rgba(212,148,74,0.08)',  border: 'rgba(212,148,74,0.18)',  action: 'Give one clear option.', script: '"When you\'re ready, come tell him what you need with words."' },
    ],
  },
];