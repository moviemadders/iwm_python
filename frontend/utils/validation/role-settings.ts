/**
 * Zod validation schemas for role-specific settings
 */

import { z } from "zod"

/**
 * Critic Settings Schema
 */
export const criticSettingsSchema = z.object({
  handle: z.string().min(3, "Handle must be at least 3 characters").max(50, "Handle must be less than 50 characters").regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores").optional().or(z.literal("")),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional().or(z.literal("")),
  expertise: z.array(z.string()).optional(),
  twitter_url: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  letterboxd_url: z.string().url("Invalid Letterboxd URL").optional().or(z.literal("")),
  personal_website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  review_visibility: z.enum(["public", "private", "followers_only"]).optional(),
  allow_comments: z.boolean().optional(),
})

export type CriticSettingsFormData = z.infer<typeof criticSettingsSchema>

/**
 * Talent Settings Schema
 */
export const talentSettingsSchema = z.object({
  handle: z.string().min(3, "Handle must be at least 3 characters").max(50, "Handle must be less than 50 characters").regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores").optional().or(z.literal("")),
  stage_name: z.string().max(200, "Stage name must be less than 200 characters").optional().or(z.literal("")),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional().or(z.literal("")),
  headshot_url: z.string().url("Invalid headshot URL").optional().or(z.literal("")),
  demo_reel_url: z.string().url("Invalid demo reel URL").optional().or(z.literal("")),
  imdb_url: z.string().url("Invalid IMDb URL").optional().or(z.literal("")),
  agent_name: z.string().max(200, "Agent name must be less than 200 characters").optional().or(z.literal("")),
  agent_contact: z.string().max(200, "Agent contact must be less than 200 characters").optional().or(z.literal("")),
  experience_years: z.number().min(0).max(100).optional(),
  availability_status: z.enum(["available", "busy", "not_available"]).optional(),
})

export type TalentSettingsFormData = z.infer<typeof talentSettingsSchema>

/**
 * Industry Pro Settings Schema
 */
export const industryProSettingsSchema = z.object({
  handle: z.string().min(3, "Handle must be at least 3 characters").max(50, "Handle must be less than 50 characters").regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores").optional().or(z.literal("")),
  company_name: z.string().max(200, "Company name must be less than 200 characters").optional().or(z.literal("")),
  job_title: z.string().max(200, "Job title must be less than 200 characters").optional().or(z.literal("")),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional().or(z.literal("")),
  website_url: z.string().url("Invalid website URL").optional().or(z.literal("")),
  imdb_url: z.string().url("Invalid IMDb URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  experience_years: z.number().min(0).max(100).optional(),
  accepting_projects: z.boolean().optional(),
})

export type IndustryProSettingsFormData = z.infer<typeof industryProSettingsSchema>

