import { Alert, Platform } from 'react-native';

export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackNotice {
  title: string;
  message?: string;
  tone?: FeedbackTone;
  durationMs?: number;
}

export interface ActiveFeedbackNotice extends FeedbackNotice {
  id: number;
  tone: FeedbackTone;
  durationMs: number;
}

type FeedbackListener = (notice: ActiveFeedbackNotice) => void;

const listeners = new Set<FeedbackListener>();
let nextNoticeId = 1;

function buildFallbackMessage({ title, message }: FeedbackNotice): string {
  return message ? `${title}\n${message}` : title;
}

export function showFeedback(notice: FeedbackNotice): void {
  const activeNotice: ActiveFeedbackNotice = {
    id: nextNoticeId++,
    title: notice.title,
    message: notice.message,
    tone: notice.tone ?? 'info',
    durationMs: notice.durationMs ?? (notice.tone === 'error' ? 3200 : 2400),
  };

  if (listeners.size === 0) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(buildFallbackMessage(activeNotice));
      return;
    }

    Alert.alert(activeNotice.title, activeNotice.message);
    return;
  }

  listeners.forEach((listener) => listener(activeNotice));
}

export function subscribeFeedback(listener: FeedbackListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
