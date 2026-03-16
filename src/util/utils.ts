export function formatQuantity(num: number) {
  if (typeof num !== 'number' || !Number.isInteger(num)) {
    return false
  }

  if (Math.abs(num) <= 1000) return num.toString()

  return Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatDecimal(num: string) {
  const number = Number(num)
  if (isNaN(number)) return false

  if (Number.isInteger(num)) {
    return num
  }

  const [integerPart, decimalPart] = num.split('.')

  if (Math.abs( Number(integerPart)) <= 1000) return num

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${formattedInteger}.${decimalPart}`
}

export function filterAddress(address: string) {
  if (address) {
    if (address.length > 9) {
      return address.slice(0,4) + '***' + address.slice(-4);
    } else {
      return address;
    }
  }

  return ''
}

export function formatTimestamp(timestamp: number | string): string {
  let date;
  
  if (typeof timestamp === 'number') {
    date = new Date(timestamp * 1000);
  } else if (typeof timestamp === 'string') {
    // If timestamp is a string, check if it's a Unix timestamp
    const numTimestamp = parseInt(timestamp);
    if (!isNaN(numTimestamp)) {
      // It's a Unix timestamp string
      date = new Date(numTimestamp * 1000);
    } else {
      // Try to parse as ISO date string
      date = new Date(timestamp);
    }
  } else {
    return '';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
