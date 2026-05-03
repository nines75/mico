import { useStorageStore } from "@/utils/store";

export default function Count() {
  const count = useStorageStore((state) => state.log?.count);

  return (
    <>
      <div className="info-container">
        {[
          {
            name: "コメントのブロック数:",
            value: createPercentage(
              count?.blockedComment,
              count?.loadedComment,
            ),
          },
          {
            name: "動画のブロック数:",
            value: createPercentage(count?.blockedVideo, count?.loadedVideo),
          },
        ].map(({ name, value }) => (
          <div className="info" key={name}>
            {name}
            <span className="info-value">{value}</span>
          </div>
        ))}
      </div>
      {(() => {
        const config = [
          {
            name: "有効化されたルールの数:",
            value: count?.include,
          },
          {
            name: "無効化されたルールの数:",
            value: count?.exclude,
          },
          {
            name: "無効化されたコマンドの数:",
            value: count?.disable,
          },
        ].filter(({ value }) => value !== undefined && value > 0);

        // 不必要にcontainerをレンダリングしないようにする
        if (config.length === 0) return null;

        return (
          <div className="info-container">
            {config.map(({ name, value }) => (
              <div className="info" key={name}>
                {name}
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </>
  );
}

function createPercentage(blocked = 0, loaded = 0) {
  return `${blocked}/${loaded} (${loaded === 0 ? 0 : Math.floor((blocked / loaded) * 100)}%)`;
}
