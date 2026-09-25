import * as React from 'react';

export interface Step { name: React.ReactNode; meta?: React.ReactNode; state: 'done' | 'active' | 'pending'; }
export interface StepperProps { steps: Step[]; min?: number; }
export declare function Stepper(props: StepperProps): JSX.Element;
