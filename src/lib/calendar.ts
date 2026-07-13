export function getGoogleCalendarUrl(meeting: { title: string; description: string; dateTime: string; id: string }) {
  const startTime = new Date(meeting.dateTime);
  // Default duration is 30 minutes
  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
  
  const formatTime = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };
  
  const utcStart = formatTime(startTime);
  const utcEnd = formatTime(endTime);
  const meetingLink = typeof window !== 'undefined' ? `${window.location.origin}/meetings?join=${meeting.id}` : '';
  const details = `${meeting.description || ''}\n\nJoin Zoom-Style Room Link: ${meetingLink}`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${utcStart}/${utcEnd}&details=${encodeURIComponent(details)}`;
}
