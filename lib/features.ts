export const features = {
  progress: process.env.NEXT_PUBLIC_FEATURE_PROGRESS !== "false",
  aiEdit: process.env.NEXT_PUBLIC_FEATURE_AI_EDIT !== "false",
  goals: process.env.NEXT_PUBLIC_FEATURE_GOALS !== "false",
} as const

export type FeatureKey = keyof typeof features
