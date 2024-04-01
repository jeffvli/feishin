import AppKit
import MediaPlayer
import Foundation

@objc(NowPlayingManager)
class NowPlayingManager: NSObject {
  @objc func setNowPlaying(
    albumTitle: String?,
    albumTrackCount: Int32,
    albumTrackNumber: Int32,
    artist: String?,
    artwork: NSImage?,
    composer: String?,
    discCount: Int32,
    discNumber: Int32,
    genre: String?,
    mediaType: String?,
    persistentID: String?,
    playbackDuration: Double,
    title: String?
  ) {
    let nowPlayingInfo: [String: Any] = {
      var info: [String: Any] = [:]

      if let albumTitle = albumTitle {
        info[MPMediaItemPropertyAlbumTitle] = albumTitle
      }

      info[MPMediaItemPropertyAlbumTrackCount] = NSNumber(value: albumTrackCount)
      info[MPMediaItemPropertyAlbumTrackNumber] = NSNumber(value: albumTrackNumber)

      if let artist = artist {
        info[MPMediaItemPropertyArtist] = artist
      }

      if let artwork = artwork {
        info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: artwork.size, requestHandler: { _ in
          return NSData(data: artwork.tiffRepresentation!)
        })
      }

      if let composer = composer {
        info[MPMediaItemPropertyComposer] = composer
      }

      info[MPMediaItemPropertyDiscCount] = NSNumber(value: discCount)
      info[MPMediaItemPropertyDiscNumber] = NSNumber(value: discNumber)

      if let genre = genre {
        info[MPMediaItemPropertyGenre] = genre
      }

      if let mediaType = mediaType {
        info[MPMediaItemPropertyMediaType] = mediaType
      }

      if let persistentID = persistentID {
        info[MPMediaItemPropertyPersistentID] = persistentID
      }

      info[MPMediaItemPropertyPlaybackDuration] = NSNumber(value: playbackDuration)

      if let title = title {
        info[MPMediaItemPropertyTitle] = title
      }

      return info
    }()

    MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
  }
}
