export type UserRole = "ADMIN" | "ANALYST" | "VIEWER";

export type FeedbackChannel = 
  | "EMAIL" 
  | "APP_STORE" 
  | "WEB_FORM" 
  | "INTERCOM" 
  | "SURVEY";

export type FeedbackSentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  workspaceId: string;
  workspaceName: string;
}

export interface ClassificationResult {
  sentiment: FeedbackSentiment;
  sentimentScore: number; // 0.0 to 1.0 (or -1.0 to 1.0)
  featureArea: string;
  themes: string[];
  rationale: string;
}

export interface FeedbackFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  channel?: FeedbackChannel | "ALL";
  sentiment?: FeedbackSentiment | "ALL";
  status?: FeedbackStatus | "ALL";
  themeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardOverviewData {
  stats: {
    totalFeedback: number;
    negativeCount: number;
    negativePercent: number;
    newThisWeekCount: number;
    newThisWeekChange: number;
    positivePercent: number;
    neutralPercent: number;
  };
  volumeOverTime: Array<{
    date: string;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  sentimentBreakdown: Array<{
    sentiment: FeedbackSentiment;
    count: number;
    percentage: number;
  }>;
  topThemes: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  }>;
}
