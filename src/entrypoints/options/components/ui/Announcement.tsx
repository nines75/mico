import { useSettingsStore } from "@/utils/store";
import { X } from "lucide-react";
import { useShallow } from "zustand/shallow";

export function Announcement() {
  const [showAnnouncement, save] = useSettingsStore(
    useShallow((state) => [
      state.settings.showAnnouncement,
      state.saveSettings,
    ]),
  );

  const majorVersion = browser.runtime.getManifest().version[0];
  if (!showAnnouncement || majorVersion === undefined) return null;

  return (
    <div className="announcement">
      <button
        className="announcement-dismiss-button"
        onClick={() => {
          save({ showAnnouncement: false });
        }}
      >
        <X size={24} />
      </button>
      v{majorVersion}に更新されました。
      <a
        className="announcement-link"
        href={`https://github.com/nines75/mico/releases/tag/v${majorVersion}.0.0`}
        target="_blank"
        rel="noreferrer"
      >
        リリースノート
      </a>
      を確認することをお勧めします。
    </div>
  );
}
