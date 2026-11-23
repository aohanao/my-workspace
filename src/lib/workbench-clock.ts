const chinaCalendar = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
})
export const chinaDate = (date = new Date()) => chinaCalendar.format(date)
