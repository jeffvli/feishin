#import <Foundation/Foundation.h>
#import <MediaPlayer/MediaPlayer.h>

@interface NowPlayingManager : NSObject

- (void)setNowPlayingWithAlbumTitle:(nullable NSString *)albumTitle
                    albumTrackCount:(int32_t)albumTrackCount
                   albumTrackNumber:(int32_t)albumTrackNumber
                             artist:(nullable NSString *)artist
                            artwork:(nullable NSImage *)artwork
                           composer:(nullable NSString *)composer
                          discCount:(int32_t)discCount
                         discNumber:(int32_t)discNumber
                              genre:(nullable NSString *)genre
                          mediaType:(nullable NSString *)mediaType
                       persistentID:(nullable NSString *)persistentID
                   playbackDuration:(double)playbackDuration
                              title:(nullable NSString *)title;

@end
