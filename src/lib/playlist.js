import { PROXY_URL } from '../data/channels'

function normalizeLine(value) {
  return value.trim()
}

export function buildProxyUrl(url) {
  return `${PROXY_URL}${encodeURIComponent(url)}`
}

function categorizeChannel(groupTitle = '', channelName = '') {
  const group = groupTitle.toLowerCase()
  const name = channelName.toLowerCase()

  const sportsKeywords = [
    'sports',
    'sport',
    'football',
    'fifa',
    'cricket',
    'icc',
    'ipl',
    'wwe',
    'premier',
    'league',
    'tennis',
    'motorsport',
    'formula',
    'basketball',
    'nba',
    'soccer',
    'golf',
    'boxing',
    'badminton',
    'hockey',
    'rugby',
  ]

  const newsKeywords = ['news', 'breaking', 'cnn', 'bbc news', 'aljazeera', 'ndtv']
  const movieKeywords = ['movie', 'movies', 'cinema', 'film', 'hollywood']
  const musicKeywords = ['music', 'song', 'songs', 'audio', 'mtv', 'jazz']
  const kidsKeywords = ['kids', 'cartoon', 'nick', 'pogo', 'junior', 'baby', 'disney']
  const documentaryKeywords = [
    'documentary',
    'infotainment',
    'information',
    'discovery',
    'history',
    'nature',
    'travel',
    'wild',
    'science',
  ]
  const religiousKeywords = ['religious', 'religion', 'islam', 'islamic', 'quran', 'makkah', 'madina']

  const includesAny = (target, keywords) => keywords.some((keyword) => target.includes(keyword))

  if (includesAny(group, sportsKeywords) || includesAny(name, sportsKeywords)) {
    return 'Sports'
  }

  if (includesAny(group, newsKeywords) || includesAny(name, newsKeywords)) {
    return 'News'
  }

  if (includesAny(group, movieKeywords) || includesAny(name, movieKeywords)) {
    return 'Movies'
  }

  if (includesAny(group, musicKeywords) || includesAny(name, musicKeywords)) {
    return 'Music'
  }

  if (includesAny(group, kidsKeywords) || includesAny(name, kidsKeywords)) {
    return 'Kids'
  }

  if (includesAny(group, documentaryKeywords) || includesAny(name, documentaryKeywords)) {
    return 'Documentary'
  }

  if (includesAny(group, religiousKeywords) || includesAny(name, religiousKeywords)) {
    return 'Religious'
  }

  if (group.includes('live') || name.includes('live')) {
    return 'Live'
  }

  return 'Entertainment'
}

function splitExtinf(extinfLine) {
  const commaIndex = extinfLine.lastIndexOf(',')

  if (commaIndex === -1) {
    return {
      metadata: extinfLine,
      channelName: 'Unknown Channel',
    }
  }

  return {
    metadata: extinfLine.slice(0, commaIndex),
    channelName: extinfLine.slice(commaIndex + 1).trim() || 'Unknown Channel',
  }
}

function extractAttr(metadata, attr) {
  const match = metadata.match(new RegExp(`${attr}="([^"]*)"`, 'i'))
  return match ? match[1].trim() : ''
}

function isStreamUrl(value) {
  return /^https?:\/\//i.test(value) || /^\/\//.test(value)
}

export function parsePlaylist(content) {
  const lines = content
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean)

  const channels = []
  let pendingExtinf = ''
  let pendingExtras = []
  let pendingName = ''
  let pendingLogo = ''
  let pendingGroup = ''

  for (const line of lines) {
    if (line.startsWith('# Source:')) {
      continue
    }

    if (line.startsWith('#EXTINF:')) {
      const { metadata, channelName } = splitExtinf(line)
      pendingExtinf = metadata
      pendingName = channelName
      pendingExtras = []
      pendingLogo = extractAttr(metadata, 'tvg-logo')
      pendingGroup = extractAttr(metadata, 'group-title')
      continue
    }

    if (line.startsWith('#')) {
      continue
    }

    if (!pendingExtinf) {
      continue
    }

    if (!isStreamUrl(line)) {
      pendingExtras.push(line)
      const joinedMeta = `${pendingExtinf} ${pendingExtras.join(' ')}`
      pendingLogo = pendingLogo || extractAttr(joinedMeta, 'tvg-logo')
      pendingGroup = pendingGroup || extractAttr(joinedMeta, 'group-title')
      continue
    }

    const joinedMeta = `${pendingExtinf} ${pendingExtras.join(' ')}`
    const logo = pendingLogo || extractAttr(joinedMeta, 'tvg-logo')
    const groupTitle = pendingGroup || extractAttr(joinedMeta, 'group-title')
    const name = pendingName
    const category = categorizeChannel(groupTitle, name)

    channels.push({
      id: line,
      name,
      logo:
        logo ||
        `https://dummyimage.com/256x256/111827/f9fafb.png&text=${encodeURIComponent(
          name,
        )}`,
      url: line,
      category,
      groupTitle,
    })

    pendingExtinf = ''
    pendingExtras = []
    pendingName = ''
    pendingLogo = ''
    pendingGroup = ''
  }

  return channels
}
