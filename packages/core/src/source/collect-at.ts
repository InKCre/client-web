import { z } from 'zod'
import { Z } from 'zod-class'
import dayjs from 'dayjs'

export class CollectAt extends Z.class({
  // 0 (Monday) to 6 (Sunday), null to run on every day
  day_of_week: z.int().min(0).max(6).nullable().default(null),
  // null to run on every hour
  hour: z.int().min(0).max(23).nullable().default(null),
  minute: z.int().min(0).max(59).default(0),
}) {
  static WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  static format(value: CollectAt): string {
    const weekday = value.day_of_week === null ? 'every day' : CollectAt.WEEKDAYS[value.day_of_week]
    const isEveryHour = value.hour === null
    const timeDescription = isEveryHour
      ? `every hour at minute ${value.minute}`
      : `at ${dayjs().hour(value.hour!).minute(value.minute).format('HH:mm')}`
    return `every ${weekday} ${timeDescription}`
  }

  /**
   * Get day of week options as { label, value } pairs
   * Apps can convert this to their UI framework's dropdown format
   */
  static get DayOfWeekOptions(): Array<{ label: string; value: number }> {
    return [
      { label: 'Every day', value: -1 },
      ...CollectAt.WEEKDAYS.map((weekday, index) => ({
        label: weekday,
        value: index,
      })),
    ]
  }

  /**
   * Get hour options as { label, value } pairs
   * Apps can convert this to their UI framework's dropdown format
   */
  static get HourOptions(): Array<{ label: string; value: number }> {
    return [
      { label: 'every hour', value: -1 },
      ...Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: i,
      })),
    ]
  }

  /**
   * Get minute options as { label, value } pairs
   * Apps can convert this to their UI framework's dropdown format
   */
  static get MinuteOptions(): Array<{ label: string; value: number }> {
    return Array.from({ length: 60 }, (_, i) => ({
      label: i.toString().padStart(2, '0'),
      value: i,
    }))
  }
}
