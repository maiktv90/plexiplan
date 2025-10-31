import { DateTime } from 'luxon';

export const cropSeconds = (dateTime: DateTime) => {
  return DateTime.fromObject({
    day: dateTime.day,
    hour: dateTime.hour,
    minute: dateTime.minute,
    second: 0,
  });
};

export const isToday = (date: string) => {
  if (!date) {
    return false;
  }
  const formatted = DateTime.fromISO(date).toFormat('dd.MM.yyyy');
  return DateTime.now().toFormat('dd.MM.yyyy') === formatted;
};
