export const PROXY_URL = 'https://summer-night-8a15.mdnasimhosen333.workers.dev/?url='

export const PLAYLIST_SOURCES = [
	{
		id: 'all',
		label: 'All Channels',
		description: 'Full snapshot of every available channel',
		localPath: '/playlists/all.m3u',
		remoteUrl: 'https://raw.githubusercontent.com/imShakil/tvlink/refs/heads/main/all.m3u',
	},
	{
		id: 'iptv',
		label: 'IPTV Channels',
		description: 'Primary IPTV playlist from the repository',
		localPath: '/playlists/iptv.m3u8',
		remoteUrl: 'https://raw.githubusercontent.com/imShakil/tvlink/refs/heads/main/iptv.m3u8',
	},
	{
		id: 'private',
		label: 'Private Channels',
		description: 'Private playlist snapshot stored locally',
		localPath: '/playlists/private.m3u',
		remoteUrl: 'https://raw.githubusercontent.com/imShakil/tvlink/refs/heads/main/private.m3u',
	},
]

export const DEFAULT_PLAYLIST_SOURCE_ID = 'all'
export const SOURCE_STORAGE_KEY = 'live-tv-last-playlist-source'
export const STORAGE_KEY = 'live-tv-last-channel-url'

export function getChannelStorageKey(sourceId) {
	return `${STORAGE_KEY}-${sourceId}`
}
