import { useStorageStore } from "@/utils/store";

export default function Count() {
  const count = useStorageStore((state) => state.log?.count);

  return (
    <>
      {[
        {
          name: "コメントのブロック数:",
          value: createPercentage(count?.blockedComment, count?.loadedComment),
        },
        {
          name: "動画のブロック数:",
          value: createPercentage(count?.blockedVideo, count?.loadedVideo),
        },
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
      ].map(({ name, value }) => {
        if (value === undefined || (typeof value === "number" && value <= 0))
          return null;

        return (
          <section key={name}>
            <span className="info">
              {name}
              <span className="info-value">{value}</span>
            </span>
          </section>
        );
      })}
    </>
  );
}

function createPercentage(blocked = 0, loaded = 0) {
  return `${blocked}/${loaded} (${loaded === 0 ? 0 : Math.floor((blocked / loaded) * 100)}%)`;
}
