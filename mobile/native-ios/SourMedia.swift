// ---- Sour Player for iPhone (added to AppDelegate.swift by setup-ios.mjs) ----
// The web app's way into iOS: what's playing on the lock screen and Control Center (and the
// headphone / AirPods buttons), notifications, the connection type (data saver), offline songs
// and QR codes. Updates come from TestFlight, so the in-app updater is off here.

import AVFoundation
import Capacitor
import CoreImage
import MediaPlayer
import Network
import UserNotifications

@objc(SourMediaPlugin)
public class SourMediaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SourMediaPlugin"
    public let jsName = "SourMedia"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setQueue", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "info", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "notify", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "network", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "takeIntent", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveOffline", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listOffline", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeOffline", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearOffline", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "qr", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scanQr", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "musicSearch", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setIcon", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "downloadUpdate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "installUpdate", returnType: CAPPluginReturnPromise),
    ]

    private let monitor = NWPathMonitor()
    private var netType = "wifi"
    private var playing = false
    private var artUrl = ""
    private var artwork: MPMediaItemArtwork?

    private func send(_ action: String, _ extra: [String: Any] = [:]) {
        var data = extra
        data["action"] = action
        notifyListeners("action", data: data)
    }

    override public func load() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default)
        try? session.setActive(true)

        let cc = MPRemoteCommandCenter.shared()
        cc.playCommand.addTarget { [weak self] _ in self?.send("play"); return .success }
        cc.pauseCommand.addTarget { [weak self] _ in self?.send("pause"); return .success }
        cc.togglePlayPauseCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.send(self.playing ? "pause" : "play")
            return .success
        }
        cc.nextTrackCommand.addTarget { [weak self] _ in self?.send("next"); return .success }
        cc.previousTrackCommand.addTarget { [weak self] _ in self?.send("previous"); return .success }
        cc.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let e = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.send("seek", ["position": e.positionTime])
            return .success
        }

        monitor.pathUpdateHandler = { [weak self] path in
            if path.usesInterfaceType(.wifi) || path.usesInterfaceType(.wiredEthernet) { self?.netType = "wifi" }
            else if path.usesInterfaceType(.cellular) { self?.netType = "cellular" }
            else { self?.netType = path.status == .satisfied ? "other" : "none" }
        }
        monitor.start(queue: DispatchQueue.global(qos: .utility))

        // headphones / AirPods / the car: unplugged pauses, plugged in can play
        NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            guard let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  let reason = AVAudioSession.RouteChangeReason(rawValue: raw) else { return }
            let output = AVAudioSession.sharedInstance().currentRoute.outputs.first
            let bluetooth = [AVAudioSession.Port.bluetoothA2DP, .bluetoothLE, .bluetoothHFP, .carAudio].contains(output?.portType ?? .builtInSpeaker)
            if reason == .oldDeviceUnavailable { self?.send("noisy") }
            if reason == .newDeviceAvailable {
                self?.notifyListeners("device", data: ["connected": true, "bluetooth": bluetooth, "name": output?.portName ?? ""])
            }
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        playing = call.getBool("playing", false)
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: call.getString("title", ""),
            MPMediaItemPropertyArtist: call.getString("artist", ""),
            MPMediaItemPropertyAlbumTitle: call.getString("album", ""),
            MPMediaItemPropertyPlaybackDuration: call.getDouble("duration", 0),
            MPNowPlayingInfoPropertyElapsedPlaybackTime: call.getDouble("position", 0),
            MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0,
        ]
        let art = call.getString("art", "")
        if art != artUrl {
            artUrl = art
            artwork = nil
            if let url = URL(string: art), art.hasPrefix("http") {
                URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                    guard let self = self, let data = data, let image = UIImage(data: data), art == self.artUrl else { return }
                    self.artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    DispatchQueue.main.async {
                        var now = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                        now[MPMediaItemPropertyArtwork] = self.artwork
                        MPNowPlayingInfoCenter.default().nowPlayingInfo = now
                    }
                }.resume()
            }
        }
        if let artwork = artwork { info[MPMediaItemPropertyArtwork] = artwork }
        DispatchQueue.main.async {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            MPNowPlayingInfoCenter.default().playbackState = self.playing ? .playing : .paused
        }
        call.resolve()
    }

    @objc func setQueue(_ call: CAPPluginCall) { call.resolve() }

    @objc func info(_ call: CAPPluginCall) {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0"
        let code = Int(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0") ?? 0
        call.resolve(["version": version, "code": code, "platform": "ios"])
    }

    @objc func notify(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            guard granted else { call.resolve(); return }
            let content = UNMutableNotificationContent()
            content.title = call.getString("title", "Sour Player")
            content.body = call.getString("text", "")
            content.sound = .default
            center.add(UNNotificationRequest(identifier: call.getString("id", UUID().uuidString), content: content, trigger: nil))
            call.resolve()
        }
    }

    @objc func network(_ call: CAPPluginCall) { call.resolve(["type": netType]) }

    @objc func takeIntent(_ call: CAPPluginCall) { call.resolve([:]) }

    // ---- offline songs, in the app's own Documents folder

    private var offlineDir: URL {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("offline")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private func safe(_ id: String) -> String {
        String(id.map { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" ? $0 : "_" })
    }

    @objc func saveOffline(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let link = call.getString("url"), let url = URL(string: link) else {
            call.reject("Missing song")
            return
        }
        let ext = call.getString("ext", "mp3").filter { $0.isLetter || $0.isNumber }
        let target = offlineDir.appendingPathComponent("\(safe(id)).\(ext)")
        URLSession.shared.downloadTask(with: url) { tmp, _, error in
            guard let tmp = tmp, error == nil else { call.reject("Download failed"); return }
            try? FileManager.default.removeItem(at: target)
            do {
                try FileManager.default.moveItem(at: tmp, to: target)
                let size = (try? FileManager.default.attributesOfItem(atPath: target.path)[.size] as? Int) ?? 0
                call.resolve(["path": target.path, "size": size])
            } catch {
                call.reject("Could not save it")
            }
        }.resume()
    }

    @objc func listOffline(_ call: CAPPluginCall) {
        let files = (try? FileManager.default.contentsOfDirectory(at: offlineDir, includingPropertiesForKeys: [.fileSizeKey])) ?? []
        call.resolve(["files": files.map { f -> [String: Any] in
            ["file": f.deletingPathExtension().lastPathComponent, "path": f.path, "size": (try? f.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0]
        }])
    }

    @objc func removeOffline(_ call: CAPPluginCall) {
        let prefix = safe(call.getString("id", "")) + "."
        for f in (try? FileManager.default.contentsOfDirectory(at: offlineDir, includingPropertiesForKeys: nil)) ?? [] where f.lastPathComponent.hasPrefix(prefix) {
            try? FileManager.default.removeItem(at: f)
        }
        call.resolve()
    }

    @objc func clearOffline(_ call: CAPPluginCall) {
        try? FileManager.default.removeItem(at: offlineDir)
        call.resolve()
    }

    // ---- QR codes (listen along and Group Play invites)

    @objc func qr(_ call: CAPPluginCall) {
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { call.reject("No QR codes"); return }
        filter.setValue(Data(call.getString("text", "").utf8), forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        guard let output = filter.outputImage?.transformed(by: CGAffineTransform(scaleX: 12, y: 12)),
              let cg = CIContext().createCGImage(output, from: output.extent),
              let png = UIImage(cgImage: cg).pngData() else { call.reject("Couldn't make the code"); return }
        call.resolve(["image": "data:image/png;base64," + png.base64EncodedString()])
    }

    @objc func scanQr(_ call: CAPPluginCall) {
        call.reject("Scan the code with the iPhone Camera app for now")
    }

    @objc func musicSearch(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let url = URL(string: "shazam://"), UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
                call.resolve()
            } else {
                call.reject("Open Control Center and tap Music Recognition (the Shazam button)")
            }
        }
    }

    @objc func setIcon(_ call: CAPPluginCall) { call.resolve() }

    @objc func downloadUpdate(_ call: CAPPluginCall) { call.reject("TestFlight updates Sour Player on iPhone") }

    @objc func installUpdate(_ call: CAPPluginCall) { call.reject("TestFlight updates Sour Player on iPhone") }
}

// registers the plugin (the storyboard's view controller is set to this class)
class SourBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SourMediaPlugin())
    }
}
