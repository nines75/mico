import { supportSettings } from "@/utils/config.js";
import H2 from "../ui/H2.js";

export default function Support() {
    return (
        <div className="settings-container">
            {supportSettings.links.map(({ header, items }) => (
                <H2 key={header} name={header}>
                    {items.map(({ name, url }) => (
                        <a
                            key={name}
                            className="common-button support-button"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {name}
                        </a>
                    ))}
                </H2>
            ))}
        </div>
    );
}
