export const COLLECTIONS = {
  blends: 'teas',
  members: 'members',
  facilities: 'facilities',
  users: 'users',
} as const;

export const SUBCOLLECTIONS = {
  dailySummaries: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/dailySummaries`,
  savedTeas: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/savedTeas`,
  conditionNotes: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/conditionNotes`,
  conditionNotesPrivate: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/conditionNotesPrivate`,
  parentLinks: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/parentLinks`,
  privateInfo: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/private`,
  encouragementMessages: (memberId: string) =>
    `${COLLECTIONS.members}/${memberId}/encouragementMessages`,
} as const;
