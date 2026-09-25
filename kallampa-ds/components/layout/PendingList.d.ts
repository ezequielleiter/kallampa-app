import * as React from 'react';

export interface PendingItem { icon: string; text: React.ReactNode; tone?: 'default' | 'danger'; }
export interface PendingListProps { title?: string; items: PendingItem[]; empty?: React.ReactNode; }
export declare function PendingList(props: PendingListProps): JSX.Element;
